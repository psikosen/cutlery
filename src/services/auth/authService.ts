// ============================================================
// AUTH SERVICE — Main authentication orchestrator
// ============================================================
// Manages user registration, login via OTP, MFA setup/verification,
// and session management. Uses IndexedDB for local persistence.

import { v4 as uuidv4 } from 'uuid';
import type { AuthUser, AuthSession, AuthState } from './types';
import { requestOTP, verifyOTP } from './otpService';
import { setupMFA, verifyTOTP } from './mfaService';
import { encryptSecret, decryptSecret } from './crypto';
import { openDB } from 'idb';

const AUTH_DB_NAME = 'shadow_system_auth';
const AUTH_DB_VERSION = 1;
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

async function getAuthDB() {
  return openDB(AUTH_DB_NAME, AUTH_DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('users')) {
        const store = db.createObjectStore('users', { keyPath: 'id' });
        store.createIndex('by_email', 'email', { unique: true });
      }
      if (!db.objectStoreNames.contains('sessions')) {
        db.createObjectStore('sessions', { keyPath: 'userId' });
      }
      if (!db.objectStoreNames.contains('backup_codes')) {
        db.createObjectStore('backup_codes', { keyPath: 'userId' });
      }
    },
  });
}

// ============================================================
// USER MANAGEMENT
// ============================================================

/**
 * Decrypt any encrypted MFA secrets on a user record after loading from DB.
 */
async function decryptUserSecrets(user: AuthUser): Promise<AuthUser> {
  const result = { ...user };
  if (result.mfaSecret) {
    try { result.mfaSecret = await decryptSecret(result.mfaSecret); } catch { /* unencrypted legacy */ }
  }
  if (result.mfaPendingSecret) {
    try { result.mfaPendingSecret = await decryptSecret(result.mfaPendingSecret); } catch { /* unencrypted legacy */ }
  }
  return result;
}

/**
 * Encrypt MFA secrets before writing to DB.
 */
async function encryptUserSecrets(user: AuthUser): Promise<AuthUser> {
  const result = { ...user };
  if (result.mfaSecret) {
    result.mfaSecret = await encryptSecret(result.mfaSecret);
  }
  if (result.mfaPendingSecret) {
    result.mfaPendingSecret = await encryptSecret(result.mfaPendingSecret);
  }
  return result;
}

async function findUserByEmail(email: string): Promise<AuthUser | undefined> {
  const db = await getAuthDB();
  const raw = (await db.getFromIndex('users', 'by_email', email)) as AuthUser | undefined;
  return raw ? decryptUserSecrets(raw) : undefined;
}

async function createUser(email: string): Promise<AuthUser> {
  const db = await getAuthDB();
  const user: AuthUser = {
    id: uuidv4(),
    email,
    emailVerified: true, // Verified via OTP
    mfaEnabled: false,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };
  await db.put('users', user);
  return user;
}

async function updateUser(user: AuthUser): Promise<void> {
  const db = await getAuthDB();
  const encrypted = await encryptUserSecrets(user);
  await db.put('users', encrypted);
}

async function loadUser(userId: string): Promise<AuthUser | undefined> {
  const db = await getAuthDB();
  const raw = (await db.get('users', userId)) as AuthUser | undefined;
  return raw ? decryptUserSecrets(raw) : undefined;
}

// ============================================================
// SESSION MANAGEMENT
// ============================================================

function generateSessionToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function createSession(userId: string, mfaVerified: boolean): Promise<AuthSession> {
  const db = await getAuthDB();
  const session: AuthSession = {
    userId,
    token: generateSessionToken(),
    expiresAt: Date.now() + SESSION_DURATION_MS,
    mfaVerified,
  };
  await db.put('sessions', session);
  return session;
}

async function getSession(): Promise<AuthSession | undefined> {
  const db = await getAuthDB();
  const all = await db.getAll('sessions');
  const valid = all.find((s: any) => s.expiresAt > Date.now()) as AuthSession | undefined;
  return valid;
}

async function clearSession(userId: string): Promise<void> {
  const db = await getAuthDB();
  await db.delete('sessions', userId);
}

// ============================================================
// PUBLIC API
// ============================================================

/**
 * Check if there's an existing valid session.
 * Returns the current auth state.
 */
export async function checkAuth(): Promise<AuthState> {
  try {
    const session = await getSession();
    if (!session) {
      return { status: 'unauthenticated' };
    }

    const user = await loadUser(session.userId);
    if (!user) {
      await clearSession(session.userId);
      return { status: 'unauthenticated' };
    }

    // If user has MFA enabled but session wasn't MFA-verified, require MFA
    if (user.mfaEnabled && !session.mfaVerified) {
      return { status: 'awaiting_mfa', email: user.email, userId: user.id };
    }

    return { status: 'authenticated', user, session };
  } catch {
    return { status: 'unauthenticated' };
  }
}

/**
 * Step 1: Request OTP for email login/signup
 */
export async function loginWithEmail(email: string): Promise<{ success: boolean; message: string }> {
  const result = await requestOTP({ email, purpose: 'login' });
  return result;
}

/**
 * Step 2: Verify OTP and create session
 * If user doesn't exist, creates a new account.
 * If user has MFA enabled, returns awaiting_mfa state.
 */
export async function verifyLoginOTP(email: string, code: string): Promise<{
  success: boolean;
  message: string;
  state?: AuthState;
}> {
  const otpResult = await verifyOTP(email, code);
  if (!otpResult.valid) {
    return { success: false, message: otpResult.message };
  }

  // Find or create user
  let user = await findUserByEmail(email);
  if (!user) {
    user = await createUser(email);
  } else {
    user.lastLoginAt = new Date().toISOString();
    await updateUser(user);
  }

  // If MFA is enabled, don't fully authenticate yet
  if (user.mfaEnabled) {
    // Create a partial session
    await createSession(user.id, false);
    return {
      success: true,
      message: 'OTP verified. Enter your MFA code.',
      state: { status: 'awaiting_mfa', email: user.email, userId: user.id },
    };
  }

  // No MFA — fully authenticated
  const session = await createSession(user.id, true);
  return {
    success: true,
    message: 'Login successful',
    state: { status: 'authenticated', user, session },
  };
}

/**
 * Step 3 (if MFA): Verify TOTP code
 */
export async function verifyMFA(userId: string, code: string): Promise<{
  success: boolean;
  message: string;
  state?: AuthState;
}> {
  const db = await getAuthDB();
  const user = await loadUser(userId);

  if (!user || !user.mfaSecret) {
    return { success: false, message: 'User not found or MFA not configured' };
  }

  // Check backup codes first
  const backupEntry = (await db.get('backup_codes', userId)) as { userId: string; codes: string[] } | undefined;
  if (backupEntry) {
    const normalizedCode = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const backupIdx = backupEntry.codes.findIndex(
      bc => bc.replace(/[^A-Z0-9]/g, '') === normalizedCode
    );
    if (backupIdx >= 0) {
      // Use and remove the backup code
      backupEntry.codes.splice(backupIdx, 1);
      await db.put('backup_codes', backupEntry);

      // Update session to MFA verified
      const session = await getSession();
      if (session) {
        session.mfaVerified = true;
        await db.put('sessions', session);
        return {
          success: true,
          message: 'Backup code accepted',
          state: { status: 'authenticated', user, session },
        };
      }
    }
  }

  // Verify TOTP
  const valid = await verifyTOTP(user.mfaSecret, code);
  if (!valid) {
    return { success: false, message: 'Invalid MFA code' };
  }

  // Update session
  const session = await getSession();
  if (session) {
    session.mfaVerified = true;
    await db.put('sessions', session);
    return {
      success: true,
      message: 'MFA verified',
      state: { status: 'authenticated', user, session },
    };
  }

  return { success: false, message: 'Session error' };
}

/**
 * Begin MFA setup for the current user.
 * Returns the setup data (secret, QR URI, backup codes) but does NOT enable MFA yet.
 * The user must verify a TOTP code via confirmEnableMFA() to actually enable it.
 */
export async function enableMFA(userId: string): Promise<{
  success: boolean;
  message: string;
  setup?: { secret: string; qrCodeUrl: string; backupCodes: string[] };
}> {
  const db = await getAuthDB();
  const user = await loadUser(userId);

  if (!user) {
    return { success: false, message: 'User not found' };
  }

  const mfaSetup = setupMFA(user.email);

  // Store the pending secret but do NOT enable MFA yet
  user.mfaPendingSecret = mfaSetup.secret;
  await updateUser(user);

  // Temporarily store backup codes under a pending key
  await db.put('backup_codes', { userId: `${userId}_pending`, codes: mfaSetup.backupCodes });

  return {
    success: true,
    message: 'Scan the QR code, then enter the 6-digit code to confirm',
    setup: mfaSetup,
  };
}

/**
 * Confirm MFA setup by verifying a TOTP code.
 * Only after successful verification is MFA actually enabled.
 */
export async function confirmEnableMFA(userId: string, code: string): Promise<{
  success: boolean;
  message: string;
}> {
  const db = await getAuthDB();
  const user = await loadUser(userId);

  if (!user || !user.mfaPendingSecret) {
    return { success: false, message: 'No pending MFA setup found' };
  }

  // Verify the TOTP code against the pending secret
  const valid = await verifyTOTP(user.mfaPendingSecret, code);
  if (!valid) {
    return { success: false, message: 'Invalid code. Please try again.' };
  }

  // Verification passed — now enable MFA
  user.mfaEnabled = true;
  user.mfaSecret = user.mfaPendingSecret;
  user.mfaPendingSecret = undefined;
  await updateUser(user);

  // Move backup codes from pending to active
  const pendingCodes = (await db.get('backup_codes', `${userId}_pending`)) as { userId: string; codes: string[] } | undefined;
  if (pendingCodes) {
    await db.put('backup_codes', { userId, codes: pendingCodes.codes });
    await db.delete('backup_codes', `${userId}_pending`);
  }

  // Invalidate existing sessions so user must re-authenticate with MFA
  await clearSession(userId);

  return { success: true, message: 'MFA enabled successfully' };
}

/**
 * Disable MFA for the current user.
 * Requires a valid TOTP code or backup code for re-authentication.
 */
export async function disableMFA(userId: string, code: string): Promise<{ success: boolean; message: string }> {
  const db = await getAuthDB();
  const user = await loadUser(userId);

  if (!user) {
    return { success: false, message: 'User not found' };
  }

  if (!user.mfaEnabled || !user.mfaSecret) {
    return { success: false, message: 'MFA is not enabled' };
  }

  // Require re-authentication: verify TOTP code
  const valid = await verifyTOTP(user.mfaSecret, code);
  if (!valid) {
    // Also check backup codes
    const backupEntry = (await db.get('backup_codes', userId)) as { userId: string; codes: string[] } | undefined;
    if (backupEntry) {
      const normalizedCode = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
      const backupIdx = backupEntry.codes.findIndex(
        bc => bc.replace(/[^A-Z0-9]/g, '') === normalizedCode
      );
      if (backupIdx < 0) {
        return { success: false, message: 'Invalid code. Enter your TOTP or backup code to disable MFA.' };
      }
      // Consume the backup code
      backupEntry.codes.splice(backupIdx, 1);
      await db.put('backup_codes', backupEntry);
    } else {
      return { success: false, message: 'Invalid code. Enter your TOTP code to disable MFA.' };
    }
  }

  user.mfaEnabled = false;
  user.mfaSecret = undefined;
  user.mfaPendingSecret = undefined;
  await updateUser(user);
  await db.delete('backup_codes', userId);

  // Invalidate sessions on MFA state change
  await clearSession(userId);

  return { success: true, message: 'MFA disabled' };
}

/**
 * Log out — clear session
 */
export async function logout(userId: string): Promise<void> {
  await clearSession(userId);
}

/**
 * Get the current authenticated user (if any)
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const state = await checkAuth();
  if (state.status === 'authenticated') {
    return state.user;
  }
  return null;
}
