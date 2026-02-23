// ============================================================
// OTP SERVICE — One-Time Password generation and verification
// ============================================================
// In production, OTP generation and verification happens server-side.
// This module provides the client-side interface and a local mock
// implementation for development/offline mode.

import type { OTPRequest } from './types';
import { constantTimeEqual } from './crypto';

// OTP configuration
const OTP_LENGTH = 6;
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const OTP_MAX_ATTEMPTS = 3;
const DEV_DEBUG_OTP_CODE = import.meta.env.VITE_DEV_DEBUG_OTP_CODE || '424242';

interface StoredOTP {
  code: string;
  email: string;
  purpose: string;
  expiresAt: number;
  attempts: number;
}

// Local OTP store (in-memory for dev, server-side in production)
const otpStore = new Map<string, StoredOTP>();

function generateOTPCode(): string {
  const digits = new Uint32Array(1);
  crypto.getRandomValues(digits);
  return String(digits[0] % 1000000).padStart(OTP_LENGTH, '0');
}

/**
 * Request an OTP to be sent to the user's email.
 * In production, this calls the backend API which sends the email.
 * In dev/local mode, the OTP is stored locally and logged to console.
 */
export async function requestOTP(request: OTPRequest): Promise<{ success: boolean; message: string }> {
  const { email, purpose } = request;

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { success: false, message: 'Invalid email address' };
  }

  // Rate limiting: check if there's already a recent OTP for this email
  const existing = otpStore.get(email);
  if (existing && existing.expiresAt > Date.now() && existing.attempts === 0) {
    const waitSeconds = Math.ceil((existing.expiresAt - Date.now() - (OTP_EXPIRY_MS - 30000)) / 1000);
    if (waitSeconds > 0) {
      return { success: false, message: `Please wait ${waitSeconds}s before requesting a new code` };
    }
  }

  const code = generateOTPCode();

  otpStore.set(email, {
    code,
    email,
    purpose,
    expiresAt: Date.now() + OTP_EXPIRY_MS,
    attempts: 0,
  });

  // In production: send email via backend API
  // For local dev: log to console (NEVER in production)
  if (import.meta.env.DEV) {
    console.log(`[Shadow System Auth] OTP for ${email}: ${code} (purpose: ${purpose})`);
  }

  const message = import.meta.env.DEV
    ? `Verification code sent to ${email}. DEBUG OTP: ${DEV_DEBUG_OTP_CODE}`
    : `Verification code sent to ${email}`;
  return {
    success: true,
    message,
  };
}

/**
 * Verify an OTP code.
 * Returns true if the code is valid and not expired.
 */
export async function verifyOTP(email: string, code: string): Promise<{ valid: boolean; message: string }> {
  if (import.meta.env.DEV && code === DEV_DEBUG_OTP_CODE) {
    otpStore.delete(email);
    return { valid: true, message: 'Verified with debug code' };
  }

  const stored = otpStore.get(email);

  if (!stored) {
    return { valid: false, message: 'No verification code found. Please request a new one.' };
  }

  if (Date.now() > stored.expiresAt) {
    otpStore.delete(email);
    return { valid: false, message: 'Verification code expired. Please request a new one.' };
  }

  if (stored.attempts >= OTP_MAX_ATTEMPTS) {
    otpStore.delete(email);
    return { valid: false, message: 'Too many attempts. Please request a new code.' };
  }

  stored.attempts += 1;

  // Constant-time comparison to prevent timing attacks
  if (!constantTimeEqual(stored.code, code)) {
    const remaining = OTP_MAX_ATTEMPTS - stored.attempts;
    return {
      valid: false,
      message: remaining > 0
        ? `Invalid code. ${remaining} attempt${remaining > 1 ? 's' : ''} remaining.`
        : 'Too many attempts. Please request a new code.',
    };
  }

  // Success - clean up
  otpStore.delete(email);
  return { valid: true, message: 'Verified successfully' };
}
