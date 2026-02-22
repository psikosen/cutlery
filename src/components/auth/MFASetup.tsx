import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import type { MFASetupResponse } from '../../services/auth/types';

interface MFASetupProps {
  userId: string;
  mfaEnabled: boolean;
  onClose: () => void;
}

export function MFASetup({ userId, mfaEnabled, onClose }: MFASetupProps) {
  const { enableUserMFA, confirmUserMFA, disableUserMFA } = useAuth();
  const [setup, setSetup] = useState<MFASetupResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [confirmCode, setConfirmCode] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [showDisableForm, setShowDisableForm] = useState(false);

  const handleEnable = async () => {
    setLoading(true);
    setMessage('');
    const result = await enableUserMFA(userId);
    setLoading(false);
    if (result.success && result.setup) {
      setSetup(result.setup);
      setMessage('Scan the code, then enter the 6-digit code below to confirm.');
    } else {
      setMessage(result.message);
    }
  };

  const handleConfirmEnable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmCode.trim() || loading) return;
    setLoading(true);
    setMessage('');
    const result = await confirmUserMFA(userId, confirmCode.trim());
    setLoading(false);
    setMessage(result.message);
    if (result.success) {
      setTimeout(onClose, 1000);
    }
  };

  const handleDisable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disableCode.trim() || loading) return;
    setLoading(true);
    const result = await disableUserMFA(userId, disableCode.trim());
    setLoading(false);
    setMessage(result.message);
    if (result.success) {
      setTimeout(onClose, 1000);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    background: 'rgba(0, 0, 0, 0.4)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 4,
    color: '#fff',
    fontSize: 20,
    fontFamily: 'monospace',
    letterSpacing: 6,
    textAlign: 'center',
    outline: 'none',
    marginBottom: 12,
    boxSizing: 'border-box' as const,
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1500,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(5, 2, 8, 0.9)',
      padding: 16,
    }}>
      <div style={{
        width: '100%',
        maxWidth: 380,
        background: 'rgba(10, 15, 30, 0.98)',
        border: '1px solid #aa66ff40',
        borderRadius: 8,
        padding: 24,
        position: 'relative',
      }}>
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.3)',
            fontSize: 18,
            cursor: 'pointer',
            padding: 4,
          }}
        >
          ✕
        </button>

        <div style={{
          fontSize: 11,
          letterSpacing: 3,
          color: '#aa66ff',
          marginBottom: 8,
          fontWeight: 600,
        }}>
          ⌜ SECURITY ⌝
        </div>

        <div style={{
          fontSize: 20,
          fontWeight: 700,
          color: '#fff',
          marginBottom: 4,
          fontFamily: 'Cinzel, serif',
        }}>
          Multi-Factor Auth
        </div>

        <div style={{
          fontSize: 12,
          color: 'rgba(255,255,255,0.4)',
          marginBottom: 20,
          lineHeight: 1.5,
        }}>
          {mfaEnabled
            ? 'MFA is currently enabled. Your account has an additional layer of protection.'
            : 'Add an extra layer of security. Use an authenticator app (Google Authenticator, Authy, etc.) for quick sign-in.'}
        </div>

        {message && (
          <div style={{
            padding: '8px 12px',
            background: message.includes('enabled') || message.includes('disabled') || message.includes('successfully')
              ? 'rgba(0, 204, 255, 0.1)' : message.includes('Scan') || message.includes('confirm')
              ? 'rgba(170, 102, 255, 0.1)' : 'rgba(255, 50, 50, 0.1)',
            border: `1px solid ${message.includes('enabled') || message.includes('disabled') || message.includes('successfully')
              ? 'rgba(0, 204, 255, 0.2)' : message.includes('Scan') || message.includes('confirm')
              ? 'rgba(170, 102, 255, 0.2)' : 'rgba(255, 50, 50, 0.3)'}`,
            borderRadius: 4,
            color: message.includes('enabled') || message.includes('disabled') || message.includes('successfully')
              ? '#00ccff' : message.includes('Scan') || message.includes('confirm')
              ? '#aa66ff' : '#ff6666',
            fontSize: 12,
            marginBottom: 16,
          }}>
            {message}
          </div>
        )}

        {/* Setup display */}
        {setup && (
          <div style={{ marginBottom: 20 }}>
            {/* QR Code URI */}
            <div style={{
              padding: '12px',
              background: 'rgba(0,0,0,0.3)',
              borderRadius: 6,
              marginBottom: 12,
              wordBreak: 'break-all',
            }}>
              <div style={{ fontSize: 11, color: '#aa66ff', marginBottom: 4, fontWeight: 600 }}>
                SETUP URI (paste in authenticator app)
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', fontFamily: 'monospace', lineHeight: 1.5 }}>
                {setup.qrCodeUrl}
              </div>
            </div>

            {/* Manual secret */}
            <div style={{
              padding: '12px',
              background: 'rgba(0,0,0,0.3)',
              borderRadius: 6,
              marginBottom: 12,
            }}>
              <div style={{ fontSize: 11, color: '#aa66ff', marginBottom: 4, fontWeight: 600 }}>
                MANUAL ENTRY KEY
              </div>
              <div style={{
                fontSize: 14,
                color: '#fff',
                fontFamily: 'monospace',
                letterSpacing: 2,
                wordBreak: 'break-all',
              }}>
                {setup.secret}
              </div>
            </div>

            {/* Verification code input */}
            <form onSubmit={handleConfirmEnable}>
              <div style={{ fontSize: 11, color: '#aa66ff', marginBottom: 8, fontWeight: 600 }}>
                ENTER CODE FROM AUTHENTICATOR TO CONFIRM
              </div>
              <input
                type="text"
                value={confirmCode}
                onChange={(e) => setConfirmCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                autoFocus
                maxLength={6}
                inputMode="numeric"
                autoComplete="one-time-code"
                style={inputStyle}
              />
              <button
                type="submit"
                disabled={confirmCode.length < 6 || loading}
                style={{
                  width: '100%',
                  padding: '12px 0',
                  background: confirmCode.length < 6 || loading
                    ? 'rgba(255,255,255,0.03)'
                    : 'linear-gradient(135deg, #aa66ff20, #aa66ff10)',
                  border: `1px solid ${confirmCode.length < 6 || loading ? 'rgba(255,255,255,0.06)' : '#aa66ff50'}`,
                  borderRadius: 6,
                  color: confirmCode.length < 6 || loading ? 'rgba(255,255,255,0.3)' : '#fff',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: confirmCode.length < 6 || loading ? 'default' : 'pointer',
                  fontFamily: 'Rajdhani, sans-serif',
                  letterSpacing: 2,
                  marginBottom: 12,
                }}
              >
                {loading ? 'VERIFYING...' : 'CONFIRM & ENABLE MFA'}
              </button>
            </form>

            {/* Backup codes */}
            <button
              onClick={() => setShowBackupCodes(!showBackupCodes)}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: showBackupCodes ? '#FFD70010' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${showBackupCodes ? '#FFD70040' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: 6,
                color: showBackupCodes ? '#FFD700' : 'rgba(255,255,255,0.5)',
                fontSize: 12,
                cursor: 'pointer',
                fontFamily: 'Rajdhani, sans-serif',
                fontWeight: 600,
                marginBottom: showBackupCodes ? 8 : 0,
              }}
            >
              {showBackupCodes ? 'Hide Backup Codes' : 'Show Backup Codes (save these!)'}
            </button>

            {showBackupCodes && (
              <div style={{
                padding: 12,
                background: 'rgba(255, 170, 0, 0.05)',
                border: '1px solid rgba(255, 170, 0, 0.2)',
                borderRadius: 6,
              }}>
                <div style={{ fontSize: 10, color: '#FFD700', marginBottom: 8, fontWeight: 600 }}>
                  BACKUP CODES — Save these in a safe place
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 4,
                }}>
                  {setup.backupCodes.map((code, i) => (
                    <div key={i} style={{
                      fontSize: 13,
                      color: '#fff',
                      fontFamily: 'monospace',
                      padding: '4px 8px',
                      background: 'rgba(0,0,0,0.2)',
                      borderRadius: 3,
                      textAlign: 'center',
                    }}>
                      {code}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Enable button (initial state, no setup yet) */}
        {!setup && !mfaEnabled && (
          <button
            onClick={handleEnable}
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px 0',
              background: 'linear-gradient(135deg, #aa66ff20, #aa66ff10)',
              border: '1px solid #aa66ff50',
              borderRadius: 6,
              color: loading ? 'rgba(255,255,255,0.3)' : '#fff',
              fontSize: 14,
              fontWeight: 700,
              cursor: loading ? 'default' : 'pointer',
              fontFamily: 'Rajdhani, sans-serif',
              letterSpacing: 2,
            }}
          >
            {loading ? 'PROCESSING...' : 'ENABLE MFA'}
          </button>
        )}

        {/* Disable MFA flow — requires re-authentication */}
        {!setup && mfaEnabled && !showDisableForm && (
          <button
            onClick={() => setShowDisableForm(true)}
            style={{
              width: '100%',
              padding: '12px 0',
              background: 'linear-gradient(135deg, rgba(255,50,50,0.2), rgba(255,50,50,0.1))',
              border: '1px solid rgba(255,50,50,0.4)',
              borderRadius: 6,
              color: '#fff',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'Rajdhani, sans-serif',
              letterSpacing: 2,
            }}
          >
            DISABLE MFA
          </button>
        )}

        {showDisableForm && (
          <form onSubmit={handleDisable}>
            <div style={{ fontSize: 11, color: '#ff6666', marginBottom: 8, fontWeight: 600 }}>
              ENTER YOUR TOTP OR BACKUP CODE TO CONFIRM
            </div>
            <input
              type="text"
              value={disableCode}
              onChange={(e) => setDisableCode(e.target.value.slice(0, 10))}
              placeholder="000000"
              autoFocus
              inputMode="numeric"
              autoComplete="one-time-code"
              style={inputStyle}
            />
            <button
              type="submit"
              disabled={!disableCode.trim() || loading}
              style={{
                width: '100%',
                padding: '12px 0',
                background: !disableCode.trim() || loading
                  ? 'rgba(255,255,255,0.03)'
                  : 'linear-gradient(135deg, rgba(255,50,50,0.2), rgba(255,50,50,0.1))',
                border: `1px solid ${!disableCode.trim() || loading ? 'rgba(255,255,255,0.06)' : 'rgba(255,50,50,0.4)'}`,
                borderRadius: 6,
                color: !disableCode.trim() || loading ? 'rgba(255,255,255,0.3)' : '#fff',
                fontSize: 14,
                fontWeight: 700,
                cursor: !disableCode.trim() || loading ? 'default' : 'pointer',
                fontFamily: 'Rajdhani, sans-serif',
                letterSpacing: 2,
              }}
            >
              {loading ? 'VERIFYING...' : 'CONFIRM DISABLE MFA'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
