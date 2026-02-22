import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import type { MFASetupResponse } from '../../services/auth/types';

interface MFASetupProps {
  userId: string;
  mfaEnabled: boolean;
  onClose: () => void;
}

export function MFASetup({ userId, mfaEnabled, onClose }: MFASetupProps) {
  const { enableUserMFA, disableUserMFA } = useAuth();
  const [setup, setSetup] = useState<MFASetupResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showBackupCodes, setShowBackupCodes] = useState(false);

  const handleEnable = async () => {
    setLoading(true);
    setMessage('');
    const result = await enableUserMFA(userId);
    setLoading(false);
    if (result.success && result.setup) {
      setSetup(result.setup);
      setMessage('MFA enabled. Save your backup codes!');
    } else {
      setMessage(result.message);
    }
  };

  const handleDisable = async () => {
    setLoading(true);
    const result = await disableUserMFA(userId);
    setLoading(false);
    setMessage(result.message);
    if (result.success) {
      setTimeout(onClose, 1000);
    }
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
            background: message.includes('enabled') || message.includes('disabled')
              ? 'rgba(0, 204, 255, 0.1)' : 'rgba(255, 50, 50, 0.1)',
            border: `1px solid ${message.includes('enabled') || message.includes('disabled')
              ? 'rgba(0, 204, 255, 0.2)' : 'rgba(255, 50, 50, 0.3)'}`,
            borderRadius: 4,
            color: message.includes('enabled') || message.includes('disabled') ? '#00ccff' : '#ff6666',
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

        {/* Action buttons */}
        {!setup && (
          <button
            onClick={mfaEnabled ? handleDisable : handleEnable}
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px 0',
              background: mfaEnabled
                ? 'linear-gradient(135deg, rgba(255,50,50,0.2), rgba(255,50,50,0.1))'
                : 'linear-gradient(135deg, #aa66ff20, #aa66ff10)',
              border: `1px solid ${mfaEnabled ? 'rgba(255,50,50,0.4)' : '#aa66ff50'}`,
              borderRadius: 6,
              color: loading ? 'rgba(255,255,255,0.3)' : '#fff',
              fontSize: 14,
              fontWeight: 700,
              cursor: loading ? 'default' : 'pointer',
              fontFamily: 'Rajdhani, sans-serif',
              letterSpacing: 2,
            }}
          >
            {loading ? 'PROCESSING...' : mfaEnabled ? 'DISABLE MFA' : 'ENABLE MFA'}
          </button>
        )}

        {setup && (
          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: '12px 0',
              background: 'linear-gradient(135deg, #00ccff20, #00ccff10)',
              border: '1px solid #00ccff50',
              borderRadius: 6,
              color: '#fff',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'Rajdhani, sans-serif',
              letterSpacing: 2,
            }}
          >
            DONE
          </button>
        )}
      </div>
    </div>
  );
}
