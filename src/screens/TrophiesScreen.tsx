import React from 'react';
import { useGame } from '../hooks/useGameState';
import type { AchievementRarity } from '../types';

const RARITY_COLORS: Record<AchievementRarity, string> = {
  common: '#888888',
  rare: '#00ccff',
  epic: '#aa66ff',
  legendary: '#FFD700',
  mythic: '#ff44ff',
};

const RARITY_LABELS: Record<AchievementRarity, string> = {
  common: 'Common',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
  mythic: 'Mythic',
};

export function TrophiesScreen() {
  const { state } = useGame();
  const { achievements, player } = state;

  const unlocked = achievements.filter(a => a.unlocked);
  const locked = achievements.filter(a => !a.unlocked);

  return (
    <div style={{ padding: '16px 16px 80px', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ fontSize: 11, letterSpacing: 3, color: '#FFD700', marginBottom: 8, fontWeight: 600 }}>
        ⌜ TROPHIES ⌝
      </div>

      {/* Stats summary */}
      <div style={{
        display: 'flex',
        gap: 12,
        marginBottom: 16,
        padding: '10px 14px',
        background: 'rgba(10, 15, 30, 0.8)',
        borderRadius: 8,
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#FFD700' }}>{unlocked.length}</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>UNLOCKED</div>
        </div>
        <div style={{ width: 1, background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>{locked.length}</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>LOCKED</div>
        </div>
        <div style={{ width: 1, background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>{achievements.length}</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>TOTAL</div>
        </div>
      </div>

      {/* Unlocked achievements */}
      {unlocked.length > 0 && (
        <>
          <div style={{ fontSize: 11, letterSpacing: 2, color: '#FFD700', marginBottom: 8 }}>ACHIEVED</div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
            marginBottom: 20,
          }}>
            {unlocked.map(a => {
              const rarColor = RARITY_COLORS[a.rarity];
              return (
                <div key={a.id} style={{
                  background: 'rgba(10, 15, 30, 0.9)',
                  borderRadius: 8,
                  border: `1px solid ${rarColor}40`,
                  padding: '12px 10px',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  {/* Glow corner */}
                  <div style={{
                    position: 'absolute',
                    top: -10,
                    right: -10,
                    width: 30,
                    height: 30,
                    background: `radial-gradient(circle, ${rarColor}30, transparent)`,
                  }} />
                  <div style={{ fontSize: 24, marginBottom: 6 }}>{a.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 2 }}>
                    {a.name}
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginBottom: 4, lineHeight: 1.3 }}>
                    {a.description}
                  </div>
                  <div style={{
                    fontSize: 9,
                    color: rarColor,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                  }}>
                    {RARITY_LABELS[a.rarity]}
                  </div>
                  {a.lore_text && (
                    <div style={{
                      fontSize: 9,
                      fontStyle: 'italic',
                      color: 'rgba(255,255,255,0.25)',
                      marginTop: 6,
                      lineHeight: 1.3,
                    }}>
                      "{a.lore_text}"
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Locked achievements */}
      <div style={{ fontSize: 11, letterSpacing: 2, color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>LOCKED</div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 8,
      }}>
        {locked.map(a => {
          const rarColor = RARITY_COLORS[a.rarity];
          return (
            <div key={a.id} style={{
              background: 'rgba(10, 15, 30, 0.6)',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.04)',
              padding: '12px 10px',
              opacity: 0.6,
            }}>
              <div style={{ fontSize: 24, marginBottom: 6, filter: 'grayscale(1) brightness(0.4)' }}>
                {a.icon}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.3)', marginBottom: 2 }}>
                ???
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginBottom: 4, lineHeight: 1.3 }}>
                {a.hint}
              </div>
              <div style={{
                fontSize: 9,
                color: rarColor + '60',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}>
                {RARITY_LABELS[a.rarity]}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
