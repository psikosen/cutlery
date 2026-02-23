import { Router } from 'express';
import type { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import crypto from 'node:crypto';
import { authenticator } from 'otplib';
import pool from '../db/pool.js';
import { generateToken, requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';

// In-memory rate limiter for MFA verification (per userId)
const MFA_MAX_ATTEMPTS = 5;
const MFA_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const mfaAttempts = new Map<string, { count: number; firstAttempt: number }>();

function checkMfaRateLimit(userId: string): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();
  const entry = mfaAttempts.get(userId);
  if (!entry || (now - entry.firstAttempt > MFA_WINDOW_MS)) {
    mfaAttempts.set(userId, { count: 1, firstAttempt: now });
    return { allowed: true };
  }
  if (entry.count >= MFA_MAX_ATTEMPTS) {
    const retryAfterMs = MFA_WINDOW_MS - (now - entry.firstAttempt);
    return { allowed: false, retryAfterMs };
  }
  entry.count++;
  return { allowed: true };
}

function resetMfaRateLimit(userId: string): void {
  mfaAttempts.delete(userId);
}

const router = Router();

const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const OTP_MAX_ATTEMPTS = 3;
const BCRYPT_ROUNDS = 12;
const DEV_DEBUG_OTP_CODE = process.env.DEV_DEBUG_OTP_CODE || '424242';
if (!process.env.MFA_ENCRYPTION_KEY && process.env.NODE_ENV === 'production') {
  throw new Error('MFA_ENCRYPTION_KEY environment variable is required in production');
}
const MFA_ENC_KEY = process.env.MFA_ENCRYPTION_KEY || '0'.repeat(64);

// ============================================================
// HELPERS
// ============================================================

function generateOTPCode(): string {
  const digits = crypto.randomInt(0, 1000000);
  return String(digits).padStart(6, '0');
}

function encryptMFASecret(secret: string): string {
  const iv = crypto.randomBytes(16);
  const key = Buffer.from(MFA_ENC_KEY, 'hex');
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(secret, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
}

function decryptMFASecret(encrypted: string): string {
  const [ivHex, tagHex, data] = encrypted.split(':');
  const key = Buffer.from(MFA_ENC_KEY, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  let decrypted = decipher.update(data, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

function generateBackupCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < 8; i++) {
    const bytes = crypto.randomBytes(4);
    const hex = bytes.toString('hex').toUpperCase();
    codes.push(`${hex.slice(0, 4)}-${hex.slice(4)}`);
  }
  return codes;
}

// ============================================================
// POST /auth/otp/request
// ============================================================
router.post('/otp/request', async (req, res) => {
  try {
    const { email, purpose = 'login' } = req.body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ success: false, message: 'Invalid email address' });
      return;
    }

    // Rate limit: check for recent unexpired OTP
    const { rows: existing } = await pool.query(
      'SELECT id, expires_at, attempts FROM otp_codes WHERE email = $1 AND expires_at > NOW() AND attempts = 0 ORDER BY created_at DESC LIMIT 1',
      [email],
    );
    if (existing.length > 0) {
      const waitMs = new Date(existing[0].expires_at).getTime() - Date.now() - (OTP_EXPIRY_MS - 30000);
      if (waitMs > 0) {
        res.status(429).json({ success: false, message: `Please wait ${Math.ceil(waitMs / 1000)}s before requesting a new code` });
        return;
      }
    }

    const code = generateOTPCode();
    const codeHash = await bcrypt.hash(code, BCRYPT_ROUNDS);

    // Clean up old OTPs for this email
    await pool.query('DELETE FROM otp_codes WHERE email = $1', [email]);

    await pool.query(
      'INSERT INTO otp_codes (email, code_hash, purpose, expires_at) VALUES ($1, $2, $3, NOW() + INTERVAL \'5 minutes\')',
      [email, codeHash, purpose],
    );

    // In production: send email
    // For dev: log and include OTP in response message for local testing
    const isDev = process.env.NODE_ENV !== 'production';
    if (isDev) {
      console.log(`[DEV OTP] ${email}: ${code} (purpose: ${purpose})`);
    }
    // TODO: integrate nodemailer for production email delivery

    const message = isDev
      ? `Verification code sent to ${email}. DEV OTP: ${code}. DEBUG OTP: ${DEV_DEBUG_OTP_CODE}`
      : `Verification code sent to ${email}`;
    res.json({ success: true, message });
  } catch (err) {
    console.error('OTP request error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ============================================================
// POST /auth/otp/verify
// ============================================================
router.post('/otp/verify', async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      res.status(400).json({ success: false, message: 'Email and code are required' });
      return;
    }
    const isDev = process.env.NODE_ENV !== 'production';
    const useDebugOtp = isDev && code === DEV_DEBUG_OTP_CODE;

    if (!useDebugOtp) {
      const { rows } = await pool.query(
        'SELECT id, code_hash, attempts, expires_at FROM otp_codes WHERE email = $1 AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
        [email],
      );

      if (rows.length === 0) {
        res.json({ success: false, message: 'No verification code found. Please request a new one.' });
        return;
      }

      const otp = rows[0];

      if (otp.attempts >= OTP_MAX_ATTEMPTS) {
        await pool.query('DELETE FROM otp_codes WHERE id = $1', [otp.id]);
        res.json({ success: false, message: 'Too many attempts. Please request a new code.' });
        return;
      }

      // Increment attempts
      await pool.query('UPDATE otp_codes SET attempts = attempts + 1 WHERE id = $1', [otp.id]);

      const valid = await bcrypt.compare(code, otp.code_hash);
      if (!valid) {
        const remaining = OTP_MAX_ATTEMPTS - (otp.attempts + 1);
        res.json({
          success: false,
          message: remaining > 0
            ? `Invalid code. ${remaining} attempt${remaining > 1 ? 's' : ''} remaining.`
            : 'Too many attempts. Please request a new code.',
        });
        return;
      }

      // OTP valid — clean up
      await pool.query('DELETE FROM otp_codes WHERE id = $1', [otp.id]);
    } else {
      console.log(`[DEV OTP BYPASS] ${email} authenticated using DEBUG OTP`);
    }

    // Find or create user
    let { rows: users } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    let user;
    if (users.length === 0) {
      const userId = uuidv4();
      await pool.query(
        'INSERT INTO users (id, email, email_verified) VALUES ($1, $2, TRUE)',
        [userId, email],
      );
      user = { id: userId, email, email_verified: true, mfa_enabled: false };
    } else {
      user = users[0];
      await pool.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);
    }

    // If MFA enabled, create partial session
    if (user.mfa_enabled) {
      const sessionId = uuidv4();
      const tokenHash = crypto.randomBytes(32).toString('hex');
      await pool.query(
        'INSERT INTO sessions (id, user_id, token_hash, mfa_verified, expires_at) VALUES ($1, $2, $3, FALSE, NOW() + INTERVAL \'10 minutes\')',
        [sessionId, user.id, tokenHash],
      );
      const token = generateToken(user.id, sessionId);
      res.json({
        success: true,
        message: 'OTP verified. Enter your MFA code.',
        requiresMFA: true,
        token,
        userId: user.id,
      });
      return;
    }

    // Full session
    const sessionId = uuidv4();
    const tokenHash = crypto.randomBytes(32).toString('hex');
    await pool.query(
      'INSERT INTO sessions (id, user_id, token_hash, mfa_verified, expires_at) VALUES ($1, $2, $3, TRUE, NOW() + INTERVAL \'7 days\')',
      [sessionId, user.id, tokenHash],
    );
    const token = generateToken(user.id, sessionId);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        emailVerified: user.email_verified,
        mfaEnabled: user.mfa_enabled,
      },
    });
  } catch (err) {
    console.error('OTP verify error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ============================================================
// POST /auth/mfa/verify
// ============================================================
router.post('/mfa/verify', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { code } = req.body;
    const userId = req.userId!;

    // Rate limit MFA verification attempts
    const rateCheck = checkMfaRateLimit(userId);
    if (!rateCheck.allowed) {
      const retrySeconds = Math.ceil((rateCheck.retryAfterMs || 0) / 1000);
      res.status(429).json({ success: false, message: `Too many MFA attempts. Try again in ${retrySeconds}s.` });
      return;
    }

    const { rows: users } = await pool.query(
      'SELECT id, email, mfa_enabled, mfa_secret_encrypted FROM users WHERE id = $1',
      [userId],
    );
    if (users.length === 0 || !users[0].mfa_secret_encrypted) {
      res.json({ success: false, message: 'MFA not configured' });
      return;
    }

    const user = users[0];
    const secret = decryptMFASecret(user.mfa_secret_encrypted);

    // Try backup codes first
    const { rows: backups } = await pool.query(
      'SELECT id, code_hash FROM backup_codes WHERE user_id = $1 AND used = FALSE',
      [userId],
    );
    for (const backup of backups) {
      const normalizedCode = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (await bcrypt.compare(normalizedCode, backup.code_hash)) {
        await pool.query('UPDATE backup_codes SET used = TRUE WHERE id = $1', [backup.id]);
        // Invalidate other partial sessions for this user before upgrading
        await pool.query(
          'DELETE FROM sessions WHERE user_id = $1 AND mfa_verified = FALSE AND id != $2',
          [userId, req.sessionId],
        );
        // Upgrade session
        await pool.query(
          'UPDATE sessions SET mfa_verified = TRUE, expires_at = NOW() + INTERVAL \'7 days\' WHERE id = $1',
          [req.sessionId],
        );
        resetMfaRateLimit(userId);
        const token = generateToken(userId, req.sessionId!);
        res.json({ success: true, message: 'Backup code accepted', token });
        return;
      }
    }

    // Verify TOTP
    const valid = authenticator.verify({ token: code, secret });
    if (!valid) {
      res.json({ success: false, message: 'Invalid MFA code' });
      return;
    }

    // Invalidate other partial sessions for this user before upgrading
    await pool.query(
      'DELETE FROM sessions WHERE user_id = $1 AND mfa_verified = FALSE AND id != $2',
      [userId, req.sessionId],
    );
    // Upgrade session
    await pool.query(
      'UPDATE sessions SET mfa_verified = TRUE, expires_at = NOW() + INTERVAL \'7 days\' WHERE id = $1',
      [req.sessionId],
    );
    resetMfaRateLimit(userId);
    const token = generateToken(userId, req.sessionId!);

    res.json({
      success: true,
      message: 'MFA verified',
      token,
      user: {
        id: user.id,
        email: user.email,
        emailVerified: user.email_verified,
        mfaEnabled: user.mfa_enabled,
      },
    });
  } catch (err) {
    console.error('MFA verify error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ============================================================
// POST /auth/mfa/setup
// ============================================================
router.post('/mfa/setup', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
    const { rows: users } = await pool.query('SELECT email FROM users WHERE id = $1', [userId]);
    if (users.length === 0) {
      res.json({ success: false, message: 'User not found' });
      return;
    }

    const secret = authenticator.generateSecret();
    const qrCodeUrl = authenticator.keyuri(users[0].email, 'ShadowSystem', secret);
    const backupCodes = generateBackupCodes();

    // Store pending secret temporarily (not yet enabled)
    // Use a temporary table or just overwrite — we'll confirm in the next step
    await pool.query(
      'UPDATE users SET mfa_secret_encrypted = $1 WHERE id = $2',
      [`pending:${encryptMFASecret(secret)}`, userId],
    );

    // Store pending backup codes (hash in parallel, then batch insert)
    await pool.query('DELETE FROM backup_codes WHERE user_id = $1', [userId]);
    const hashes = await Promise.all(
      backupCodes.map(code => bcrypt.hash(code.replace(/[^A-Z0-9]/g, ''), BCRYPT_ROUNDS))
    );
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const hash of hashes) {
        await client.query(
          'INSERT INTO backup_codes (user_id, code_hash) VALUES ($1, $2)',
          [userId, hash],
        );
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    res.json({
      success: true,
      message: 'Scan the QR code, then confirm with a 6-digit code',
      setup: { secret, qrCodeUrl, backupCodes },
    });
  } catch (err) {
    console.error('MFA setup error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ============================================================
// POST /auth/mfa/confirm
// ============================================================
router.post('/mfa/confirm', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
    const { code } = req.body;

    const { rows: users } = await pool.query(
      'SELECT mfa_secret_encrypted FROM users WHERE id = $1',
      [userId],
    );
    if (users.length === 0 || !users[0].mfa_secret_encrypted?.startsWith('pending:')) {
      res.json({ success: false, message: 'No pending MFA setup found' });
      return;
    }

    const encryptedSecret = users[0].mfa_secret_encrypted.slice('pending:'.length);
    const secret = decryptMFASecret(encryptedSecret);

    const valid = authenticator.verify({ token: code, secret });
    if (!valid) {
      res.json({ success: false, message: 'Invalid code. Please try again.' });
      return;
    }

    // Activate MFA
    await pool.query(
      'UPDATE users SET mfa_enabled = TRUE, mfa_secret_encrypted = $1 WHERE id = $2',
      [encryptedSecret, userId],
    );

    // Invalidate all sessions
    await pool.query('DELETE FROM sessions WHERE user_id = $1', [userId]);

    res.json({ success: true, message: 'MFA enabled successfully' });
  } catch (err) {
    console.error('MFA confirm error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ============================================================
// POST /auth/mfa/disable
// ============================================================
router.post('/mfa/disable', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
    const { code } = req.body;

    const { rows: users } = await pool.query(
      'SELECT mfa_enabled, mfa_secret_encrypted FROM users WHERE id = $1',
      [userId],
    );
    if (users.length === 0 || !users[0].mfa_enabled || !users[0].mfa_secret_encrypted) {
      res.json({ success: false, message: 'MFA is not enabled' });
      return;
    }

    const secret = decryptMFASecret(users[0].mfa_secret_encrypted);

    // Verify TOTP or backup code
    let verified = authenticator.verify({ token: code, secret });

    if (!verified) {
      const { rows: backups } = await pool.query(
        'SELECT id, code_hash FROM backup_codes WHERE user_id = $1 AND used = FALSE',
        [userId],
      );
      const normalizedCode = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
      for (const backup of backups) {
        if (await bcrypt.compare(normalizedCode, backup.code_hash)) {
          verified = true;
          await pool.query('UPDATE backup_codes SET used = TRUE WHERE id = $1', [backup.id]);
          break;
        }
      }
    }

    if (!verified) {
      res.json({ success: false, message: 'Invalid code. Enter your TOTP or backup code.' });
      return;
    }

    await pool.query(
      'UPDATE users SET mfa_enabled = FALSE, mfa_secret_encrypted = NULL WHERE id = $1',
      [userId],
    );
    await pool.query('DELETE FROM backup_codes WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM sessions WHERE user_id = $1', [userId]);

    res.json({ success: true, message: 'MFA disabled' });
  } catch (err) {
    console.error('MFA disable error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ============================================================
// POST /auth/logout
// ============================================================
router.post('/logout', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    await pool.query('DELETE FROM sessions WHERE id = $1', [req.sessionId]);
    res.json({ success: true });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ============================================================
// GET /auth/me
// ============================================================
router.get('/me', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, email, email_verified, mfa_enabled, created_at, last_login_at FROM users WHERE id = $1',
      [req.userId],
    );
    if (rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const u = rows[0];
    res.json({
      id: u.id,
      email: u.email,
      emailVerified: u.email_verified,
      mfaEnabled: u.mfa_enabled,
      createdAt: u.created_at,
      lastLoginAt: u.last_login_at,
    });
  } catch (err) {
    console.error('Auth me error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
