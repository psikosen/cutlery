// ============================================================
// MFA SERVICE — TOTP-based Multi-Factor Authentication
// ============================================================
// Implements RFC 6238 TOTP (Time-based One-Time Password).
// In production, the secret is stored server-side encrypted.
// This module provides local TOTP generation and verification.

import type { MFASetupResponse } from './types';
import { constantTimeEqual } from './crypto';

const TOTP_PERIOD = 30; // seconds
const TOTP_DIGITS = 6;
const TOTP_ALGORITHM = 'SHA-1';
const TOTP_WINDOW = 1; // Allow 1 period before/after for clock skew

/**
 * Generate a random base32 secret for TOTP setup
 */
export function generateMFASecret(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return base32Encode(bytes);
}

/**
 * Set up MFA for a user. Returns the secret, QR code URI, and backup codes.
 */
export function setupMFA(email: string): MFASetupResponse {
  const secret = generateMFASecret();
  const issuer = 'ShadowSystem';
  const qrCodeUrl = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=${TOTP_ALGORITHM}&digits=${TOTP_DIGITS}&period=${TOTP_PERIOD}`;

  // Generate backup codes
  const backupCodes: string[] = [];
  for (let i = 0; i < 8; i++) {
    const bytes = new Uint8Array(4);
    crypto.getRandomValues(bytes);
    const code = Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
    backupCodes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
  }

  return { secret, qrCodeUrl, backupCodes };
}

/**
 * Generate the current TOTP code for a given secret
 */
export async function generateTOTP(secret: string): Promise<string> {
  const time = Math.floor(Date.now() / 1000 / TOTP_PERIOD);
  return await computeHOTP(secret, time);
}

/**
 * Verify a TOTP code against a secret.
 * Allows a window of +/- 1 period for clock skew.
 */
export async function verifyTOTP(secret: string, code: string): Promise<boolean> {
  const time = Math.floor(Date.now() / 1000 / TOTP_PERIOD);

  for (let i = -TOTP_WINDOW; i <= TOTP_WINDOW; i++) {
    const expected = await computeHOTP(secret, time + i);
    if (constantTimeEqual(expected, code)) {
      return true;
    }
  }
  return false;
}

/**
 * Compute HOTP (HMAC-based One-Time Password) per RFC 4226
 */
async function computeHOTP(secret: string, counter: number): Promise<string> {
  const secretBytes = base32Decode(secret);

  // Convert counter to 8-byte big-endian
  const counterBytes = new ArrayBuffer(8);
  const view = new DataView(counterBytes);
  view.setUint32(4, counter, false); // Big-endian

  // HMAC-SHA1
  const key = await crypto.subtle.importKey(
    'raw',
    secretBytes,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, counterBytes);
  const hmac = new Uint8Array(signature);

  // Dynamic truncation
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const otp = binary % Math.pow(10, TOTP_DIGITS);
  return String(otp).padStart(TOTP_DIGITS, '0');
}

// ============================================================
// BASE32 ENCODING / DECODING
// ============================================================

const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(bytes: Uint8Array): string {
  let result = '';
  let bits = 0;
  let value = 0;

  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      result += BASE32_CHARS[(value >> bits) & 0x1f];
    }
  }

  if (bits > 0) {
    result += BASE32_CHARS[(value << (5 - bits)) & 0x1f];
  }

  return result;
}

function base32Decode(encoded: string): Uint8Array {
  const cleaned = encoded.toUpperCase().replace(/[^A-Z2-7]/g, '');
  const bytes: number[] = [];
  let bits = 0;
  let value = 0;

  for (const char of cleaned) {
    const idx = BASE32_CHARS.indexOf(char);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((value >> bits) & 0xff);
    }
  }

  return new Uint8Array(bytes);
}

