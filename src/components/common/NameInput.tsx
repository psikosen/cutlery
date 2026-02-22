import React, { useState } from 'react';

interface NameInputProps {
  onSubmit: (name: string) => void;
}

export function NameInput({ onSubmit }: NameInputProps) {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length > 0 && trimmed.length <= 30) {
      onSubmit(trimmed);
    }
  };

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
        You have been chosen. The shadows stir. Your creatures await.
      </div>

      {/* Solo Leveling style notification box */}
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: 320,
        padding: '24px 20px',
        background: 'rgba(10, 15, 30, 0.95)',
        border: '1px solid #00ccff40',
        borderRadius: 4,
        boxShadow: '0 0 30px rgba(0, 204, 255, 0.1)',
      }}>
        {/* Corner brackets */}
        <div style={{ position: 'absolute', top: 4, left: 4, width: 12, height: 12, borderTop: '1px solid #00ccff', borderLeft: '1px solid #00ccff' }} />
        <div style={{ position: 'absolute', top: 4, right: 4, width: 12, height: 12, borderTop: '1px solid #00ccff', borderRight: '1px solid #00ccff' }} />
        <div style={{ position: 'absolute', bottom: 4, left: 4, width: 12, height: 12, borderBottom: '1px solid #00ccff', borderLeft: '1px solid #00ccff' }} />
        <div style={{ position: 'absolute', bottom: 4, right: 4, width: 12, height: 12, borderBottom: '1px solid #00ccff', borderRight: '1px solid #00ccff' }} />

        <div style={{
          fontSize: 12,
          color: '#00ccff',
          marginBottom: 16,
          letterSpacing: 2,
        }}>
          ENTER HUNTER NAME
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={30}
            placeholder="Your name, Hunter..."
            autoFocus
            style={{
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
              boxSizing: 'border-box',
            }}
          />
          <button
            type="submit"
            disabled={name.trim().length === 0}
            style={{
              width: '100%',
              padding: '12px 0',
              background: name.trim().length > 0
                ? 'linear-gradient(135deg, #00ccff20, #00ccff10)'
                : 'rgba(255,255,255,0.03)',
              border: `1px solid ${name.trim().length > 0 ? '#00ccff50' : 'rgba(255,255,255,0.06)'}`,
              borderRadius: 4,
              color: name.trim().length > 0 ? '#fff' : 'rgba(255,255,255,0.2)',
              fontSize: 14,
              fontWeight: 700,
              fontFamily: 'Rajdhani, sans-serif',
              letterSpacing: 3,
              cursor: name.trim().length > 0 ? 'pointer' : 'default',
            }}
          >
            AWAKEN
          </button>
        </form>
      </div>
    </div>
  );
}
