import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

export function LoginScreen() {
  const { authState, sendOTP, verifyOTP, verifyMFACode, skipAuth } = useAuth();
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || loading) return;
    setLoading(true);
    setError('');
    const result = await sendOTP(email.trim().toLowerCase());
    setLoading(false);
    if (result.success) {
      setInfo(result.message);
    } else {
      setError(result.message);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim() || loading) return;
    setLoading(true);
    setError('');
    const result = await verifyOTP(
      authState.status === 'awaiting_otp' ? authState.email : email,
      otpCode.trim()
    );
    setLoading(false);
    if (!result.success) {
      setError(result.message);
    }
  };

  const handleVerifyMFA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaCode.trim() || loading) return;
    if (authState.status !== 'awaiting_mfa') return;
    setLoading(true);
    setError('');
    const result = await verifyMFACode(authState.userId, mfaCode.trim());
    setLoading(false);
    if (!result.success) {
      setError(result.message);
    }
  };

  const renderEmailForm = () => (
    <form onSubmit={handleSendOTP}>
      <div style={{
        fontSize: 12,
        color: '#00ccff',
        marginBottom: 16,
        letterSpacing: 2,
      }}>
        ENTER YOUR EMAIL
      </div>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="hunter@shadow.system"
        autoFocus
        autoComplete="email"
        style={inputStyle}
      />
      <button type="submit" disabled={!email.trim() || loading} style={buttonStyle(!email.trim() || loading)}>
        {loading ? 'SENDING...' : 'SEND VERIFICATION CODE'}
      </button>
    </form>
  );

  const renderOTPForm = () => (
    <form onSubmit={handleVerifyOTP}>
      <div style={{
        fontSize: 12,
        color: '#00ccff',
        marginBottom: 8,
        letterSpacing: 2,
      }}>
        ENTER VERIFICATION CODE
      </div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>
        Sent to {authState.status === 'awaiting_otp' ? authState.email : email}
      </div>
      <input
        type="text"
        value={otpCode}
        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
        placeholder="000000"
        autoFocus
        maxLength={6}
        inputMode="numeric"
        autoComplete="one-time-code"
        style={{
          ...inputStyle,
          textAlign: 'center',
          fontSize: 24,
          letterSpacing: 8,
          fontFamily: 'monospace',
        }}
      />
      <button type="submit" disabled={otpCode.length < 6 || loading} style={buttonStyle(otpCode.length < 6 || loading)}>
        {loading ? 'VERIFYING...' : 'VERIFY CODE'}
      </button>
      <button
        type="button"
        onClick={() => sendOTP(authState.status === 'awaiting_otp' ? authState.email : email)}
        style={{
          width: '100%',
          padding: '8px 0',
          background: 'none',
          border: 'none',
          color: 'rgba(255,255,255,0.3)',
          fontSize: 12,
          cursor: 'pointer',
          marginTop: 8,
          fontFamily: 'Rajdhani, sans-serif',
        }}
      >
        Resend code
      </button>
    </form>
  );

  const renderMFAForm = () => (
    <form onSubmit={handleVerifyMFA}>
      <div style={{
        fontSize: 12,
        color: '#aa66ff',
        marginBottom: 8,
        letterSpacing: 2,
      }}>
        MULTI-FACTOR AUTHENTICATION
      </div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>
        Enter the 6-digit code from your authenticator app
      </div>
      <input
        type="text"
        value={mfaCode}
        onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
        placeholder="000000"
        autoFocus
        maxLength={6}
        inputMode="numeric"
        autoComplete="one-time-code"
        style={{
          ...inputStyle,
          textAlign: 'center',
          fontSize: 24,
          letterSpacing: 8,
          fontFamily: 'monospace',
        }}
      />
      <button type="submit" disabled={mfaCode.length < 6 || loading} style={buttonStyle(mfaCode.length < 6 || loading)}>
        {loading ? 'VERIFYING...' : 'VERIFY MFA'}
      </button>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 12, textAlign: 'center' }}>
        You can also use a backup code
      </div>
    </form>
  );

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#050208',
      fontFamily: 'Rajdhani, sans-serif',
      padding: 24,
    }}>
      {/* Title */}
      <div style={{
        fontSize: 10,
        letterSpacing: 6,
        color: '#00ccff',
        marginBottom: 12,
        fontWeight: 600,
      }}>
        ⌜ SYSTEM ⌝
      </div>
      <div style={{
        fontSize: 32,
        fontWeight: 700,
        color: '#fff',
        fontFamily: 'Cinzel, serif',
        marginBottom: 8,
        textAlign: 'center',
      }}>
        SHADOW SYSTEM
      </div>
      <div style={{
        fontSize: 13,
        color: 'rgba(255,255,255,0.4)',
        marginBottom: 40,
        textAlign: 'center',
        maxWidth: 280,
        lineHeight: 1.5,
      }}>
        Secure your shadow army. Sign in to persist your progress across devices.
      </div>

      {/* Auth card */}
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: 340,
        padding: '24px 20px',
        background: 'rgba(10, 15, 30, 0.95)',
        border: `1px solid ${authState.status === 'awaiting_mfa' ? '#aa66ff' : '#00ccff'}40`,
        borderRadius: 4,
        boxShadow: `0 0 30px ${authState.status === 'awaiting_mfa' ? '#aa66ff' : '#00ccff'}10`,
      }}>
        {/* Corner brackets */}
        {['top', 'bottom'].map(v =>
          ['left', 'right'].map(h => {
            const accentColor = authState.status === 'awaiting_mfa' ? '#aa66ff' : '#00ccff';
            return (
              <div key={`${v}-${h}`} style={{
                position: 'absolute',
                [v]: 4,
                [h]: 4,
                width: 12,
                height: 12,
                [`border${v === 'top' ? 'Top' : 'Bottom'}`]: `1px solid ${accentColor}`,
                [`border${h === 'left' ? 'Left' : 'Right'}`]: `1px solid ${accentColor}`,
              }} />
            );
          })
        )}

        {/* Error/Info messages */}
        {error && (
          <div style={{
            padding: '8px 12px',
            background: 'rgba(255, 50, 50, 0.1)',
            border: '1px solid rgba(255, 50, 50, 0.3)',
            borderRadius: 4,
            color: '#ff6666',
            fontSize: 12,
            marginBottom: 12,
          }}>
            {error}
          </div>
        )}
        {info && !error && (
          <div style={{
            padding: '8px 12px',
            background: 'rgba(0, 204, 255, 0.1)',
            border: '1px solid rgba(0, 204, 255, 0.2)',
            borderRadius: 4,
            color: '#00ccff',
            fontSize: 12,
            marginBottom: 12,
          }}>
            {info}
          </div>
        )}

        {/* Form based on auth state */}
        {authState.status === 'unauthenticated' && renderEmailForm()}
        {authState.status === 'awaiting_otp' && renderOTPForm()}
        {authState.status === 'awaiting_mfa' && renderMFAForm()}
      </div>

      {/* Skip auth option */}
      <button
        onClick={skipAuth}
        style={{
          marginTop: 24,
          background: 'none',
          border: 'none',
          color: 'rgba(255,255,255,0.2)',
          fontSize: 12,
          cursor: 'pointer',
          fontFamily: 'Rajdhani, sans-serif',
          padding: '8px 16px',
        }}
      >
        Continue without account (local only)
      </button>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  background: 'rgba(0, 0, 0, 0.4)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 4,
  color: '#fff',
  fontSize: 16,
  fontFamily: 'Rajdhani, sans-serif',
  outline: 'none',
  marginBottom: 16,
  boxSizing: 'border-box' as const,
};

const buttonStyle = (disabled: boolean): React.CSSProperties => ({
  width: '100%',
  padding: '12px 0',
  background: disabled
    ? 'rgba(255,255,255,0.03)'
    : 'linear-gradient(135deg, #00ccff20, #00ccff10)',
  border: `1px solid ${disabled ? 'rgba(255,255,255,0.06)' : '#00ccff50'}`,
  borderRadius: 4,
  color: disabled ? 'rgba(255,255,255,0.2)' : '#fff',
  fontSize: 13,
  fontWeight: 700,
  fontFamily: 'Rajdhani, sans-serif',
  letterSpacing: 2,
  cursor: disabled ? 'default' : 'pointer',
});
