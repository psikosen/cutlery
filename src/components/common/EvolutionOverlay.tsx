import { useState, useEffect } from 'react';
import type { CreatureId } from '../../types';
import { CREATURE_NAMES, DOMAIN_COLORS, CREATURE_TO_DOMAIN, EVOLUTION_STAGE_NAMES } from '../../types';

interface EvolutionOverlayProps {
  creatureId: CreatureId;
  oldStage: number;
  newStage: number;
  onDismiss: () => void;
}

export function EvolutionOverlay({ creatureId, oldStage, newStage, onDismiss }: EvolutionOverlayProps) {
  const [phase, setPhase] = useState<'dissolve' | 'flash' | 'materialize' | 'done'>('dissolve');
  const domain = CREATURE_TO_DOMAIN[creatureId];
  const color = DOMAIN_COLORS[domain];

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase('flash'), 1200),
      setTimeout(() => setPhase('materialize'), 1800),
      setTimeout(() => setPhase('done'), 3000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const bgOpacity = phase === 'flash' ? 0.95 : 0.85;
  const flashOpacity = phase === 'flash' ? 1 : 0;

  return (
    <div
      onClick={phase === 'done' ? onDismiss : undefined}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: `rgba(5, 2, 8, ${bgOpacity})`,
        cursor: phase === 'done' ? 'pointer' : 'default',
        fontFamily: 'Cinzel, serif',
        transition: 'background 0.5s ease',
      }}
    >
      {/* Flash effect */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(circle, ${color}40, transparent)`,
        opacity: flashOpacity,
        transition: 'opacity 0.3s ease',
      }} />

      {/* Particle ring */}
      <div style={{
        width: 200,
        height: 200,
        borderRadius: '50%',
        border: `2px solid ${color}60`,
        boxShadow: `0 0 40px ${color}30, inset 0 0 40px ${color}20`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
        animation: phase === 'flash' ? undefined : undefined,
        opacity: phase === 'dissolve' ? 0.5 : 1,
        transform: phase === 'dissolve' ? 'scale(0.8)' : phase === 'flash' ? 'scale(1.2)' : 'scale(1)',
        transition: 'all 0.6s ease',
      }}>
        <div style={{
          fontSize: 64,
          color: color,
          textShadow: `0 0 30px ${color}`,
          opacity: phase === 'materialize' || phase === 'done' ? 1 : 0,
          transition: 'opacity 0.5s ease',
        }}>
          {newStage >= 5 ? '👁️' : newStage >= 3 ? '🔥' : '⚡'}
        </div>
      </div>

      {/* Title */}
      <div style={{
        fontSize: 12,
        letterSpacing: 6,
        color: color,
        marginBottom: 8,
        opacity: phase === 'materialize' || phase === 'done' ? 1 : 0,
        transition: 'opacity 0.5s ease 0.2s',
      }}>
        ⌜ EVOLUTION ⌝
      </div>

      <div style={{
        fontSize: 28,
        fontWeight: 700,
        color: '#fff',
        textShadow: `0 0 20px ${color}60`,
        marginBottom: 8,
        opacity: phase === 'materialize' || phase === 'done' ? 1 : 0,
        transform: phase === 'done' ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.5s ease 0.3s',
      }}>
        {CREATURE_NAMES[creatureId]}
      </div>

      <div style={{
        fontSize: 16,
        color: 'rgba(255,255,255,0.6)',
        fontFamily: 'Rajdhani, sans-serif',
        opacity: phase === 'done' ? 1 : 0,
        transition: 'opacity 0.5s ease 0.5s',
      }}>
        {EVOLUTION_STAGE_NAMES[oldStage]} → <span style={{ color: color, fontWeight: 700 }}>{EVOLUTION_STAGE_NAMES[newStage]}</span>
      </div>

      {phase === 'done' && (
        <div style={{
          marginTop: 32,
          fontSize: 12,
          color: 'rgba(255,255,255,0.3)',
          fontFamily: 'Rajdhani, sans-serif',
        }}>
          Tap to continue
        </div>
      )}
    </div>
  );
}
