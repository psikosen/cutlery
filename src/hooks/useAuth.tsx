import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { AuthState, AuthUser, MFASetupResponse } from '../services/auth/types';
import {
  checkAuth, loginWithEmail, verifyLoginOTP, verifyMFA,
  enableMFA, disableMFA, logout,
} from '../services/auth/authService';

interface AuthContextValue {
  authState: AuthState;
  sendOTP: (email: string) => Promise<{ success: boolean; message: string }>;
  verifyOTP: (email: string, code: string) => Promise<{ success: boolean; message: string }>;
  verifyMFACode: (userId: string, code: string) => Promise<{ success: boolean; message: string }>;
  enableUserMFA: (userId: string) => Promise<{ success: boolean; message: string; setup?: MFASetupResponse }>;
  disableUserMFA: (userId: string) => Promise<{ success: boolean; message: string }>;
  signOut: () => Promise<void>;
  skipAuth: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({ status: 'loading' });

  // Check for existing session on mount
  useEffect(() => {
    checkAuth().then(state => {
      setAuthState(state);
    });
  }, []);

  const sendOTP = useCallback(async (email: string) => {
    const result = await loginWithEmail(email);
    if (result.success) {
      setAuthState({ status: 'awaiting_otp', email });
    }
    return result;
  }, []);

  const handleVerifyOTP = useCallback(async (email: string, code: string) => {
    const result = await verifyLoginOTP(email, code);
    if (result.success && result.state) {
      setAuthState(result.state);
    }
    return { success: result.success, message: result.message };
  }, []);

  const verifyMFACode = useCallback(async (userId: string, code: string) => {
    const result = await verifyMFA(userId, code);
    if (result.success && result.state) {
      setAuthState(result.state);
    }
    return { success: result.success, message: result.message };
  }, []);

  const enableUserMFA = useCallback(async (userId: string) => {
    const result = await enableMFA(userId);
    if (result.success) {
      // Refresh auth state
      const newState = await checkAuth();
      setAuthState(newState);
    }
    return result;
  }, []);

  const disableUserMFA = useCallback(async (userId: string) => {
    const result = await disableMFA(userId);
    if (result.success) {
      const newState = await checkAuth();
      setAuthState(newState);
    }
    return result;
  }, []);

  const signOut = useCallback(async () => {
    if (authState.status === 'authenticated') {
      await logout(authState.user.id);
    }
    setAuthState({ status: 'unauthenticated' });
  }, [authState]);

  const skipAuth = useCallback(() => {
    // Allow playing without auth (local-only mode)
    setAuthState({
      status: 'authenticated',
      user: {
        id: 'local_user',
        email: 'local@shadow.system',
        emailVerified: false,
        mfaEnabled: false,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      },
      session: {
        userId: 'local_user',
        token: 'local_session',
        expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
        mfaVerified: false,
      },
    });
  }, []);

  return (
    <AuthContext.Provider value={{
      authState,
      sendOTP,
      verifyOTP: handleVerifyOTP,
      verifyMFACode,
      enableUserMFA,
      disableUserMFA,
      signOut,
      skipAuth,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
