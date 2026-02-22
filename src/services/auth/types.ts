// ============================================================
// AUTH TYPES — OTP, Email, MFA
// ============================================================

export interface AuthUser {
  id: string;
  email: string;
  emailVerified: boolean;
  mfaEnabled: boolean;
  mfaSecret?: string; // TOTP secret (stored encrypted in production)
  mfaPendingSecret?: string; // Pending TOTP secret during MFA setup (before verification)
  createdAt: string;
  lastLoginAt: string;
}

export interface AuthSession {
  userId: string;
  token: string;
  expiresAt: number; // Unix timestamp
  mfaVerified: boolean;
}

export type AuthState =
  | { status: 'unauthenticated' }
  | { status: 'awaiting_otp'; email: string }
  | { status: 'awaiting_mfa'; email: string; userId: string }
  | { status: 'authenticated'; user: AuthUser; session: AuthSession }
  | { status: 'loading' };

export interface OTPRequest {
  email: string;
  purpose: 'login' | 'signup' | 'verify_email';
}

export interface OTPVerification {
  email: string;
  code: string;
}

export interface MFASetupResponse {
  secret: string;
  qrCodeUrl: string; // otpauth:// URI for QR code
  backupCodes: string[];
}

export interface MFAVerification {
  code: string; // 6-digit TOTP code
}
