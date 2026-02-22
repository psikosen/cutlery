import React, { useState, useMemo } from 'react';
import { useGame } from '../hooks/useGameState';
import type { CreatureId, GeneType, GeneTier } from '../types';
import { CREATURE_NAMES, DOMAIN_COLORS, CREATURE_TO_DOMAIN, GENE_STAT_KEYS } from '../types';
import { canFuseGenes, getNextTier } from '../services/gameEngine';

const TIER_LABELS: Record<GeneTier, string> = {
  base: 'Base',
  dense: 'Dense',
  hyper: 'Hyper',
  titan: 'Titan',
};

const TIER_COLORS: Record<GeneTier, string> = {
  base: 'rgba(255,255,255,0.5)',
  dense: '#00ccff',
  hyper: '#aa66ff',
  titan: '#FFD700',
};

export function LabScreen() {
  const { state, fuseGenes } = useGame();
  const [selectedCreature, setSelectedCreature] = useState<CreatureId>('gore_maw');
  const [fusing, setFusing] = useState(false);

  const creature = state.creatures.find(c => c.id === selectedCreature);
  const domain = creature ? CREATURE_TO_DOMAIN[creature.id] : 'health';
  const color = DOMAIN_COLORS[domain];

  // Find fuseable genes
  const fuseableGenes = useMemo(() => {
    if (!creature) return [];
    const result: { geneType: GeneType; tier: GeneTier; count: number; nextTier: GeneTier }[] = [];

    for (const [geneType, entry] of Object.entries(creature.genes)) {
      for (const tier of ['base', 'dense', 'hyper'] as GeneTier[]) {
        const count = entry.tier_breakdown[tier];
        if (count >= 3) {
          const next = getNextTier(tier);
          if (next) {
            result.push({
              geneType: geneType as GeneType,
              tier,
              count,
              nextTier: next,
            });
          }
        }
      }
    }
    return result;
  }, [creature]);

  const handleFuse = async (geneType: GeneType, tier: GeneTier) => {
    if (fusing) return;
    setFusing(true);
    await fuseGenes(selectedCreature, geneType, tier);
    setTimeout(() => setFusing(false), 300);
  };

  return (
    <div style={{ padding: '16px 16px 80px', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ fontSize: 11, letterSpacing: 3, color: '#ff44ff', marginBottom: 16, fontWeight: 600 }}>
        ⌜ MUTATION LAB ⌝
      </div>

      {/* Creature selector */}
      <div style={{
        display: 'flex',
        gap: 6,
        marginBottom: 16,
        overflowX: 'auto',
        paddingBottom: 4,
      }}>
        {state.creatures.map(c => {
          const cColor = DOMAIN_COLORS[c.domain];
          const isSelected = c.id === selectedCreature;
          return (
            <button
              key={c.id}
              onClick={() => setSelectedCreature(c.id)}
              style={{
                padding: '6px 12px',
                border: `1px solid ${isSelected ? cColor : 'rgba(255,255,255,0.06)'}`,
                background: isSelected ? cColor + '15' : 'transparent',
                color: isSelected ? cColor : 'rgba(255,255,255,0.4)',
                borderRadius: 20,
                fontSize: 11,
                cursor: 'pointer',
                fontFamily: 'Rajdhani, sans-serif',
                whiteSpace: 'nowrap',
                fontWeight: isSelected ? 700 : 400,
              }}
            >
              {CREATURE_NAMES[c.id]}
            </button>
          );
        })}
      </div>

      {/* Fusion Info */}
      <div style={{
        background: 'rgba(10, 15, 30, 0.8)',
        borderRadius: 8,
        padding: '12px 14px',
        marginBottom: 16,
        border: `1px solid ${color}20`,
      }}>
        <div style={{ fontSize: 13, color: '#fff', fontWeight: 600, marginBottom: 4 }}>
          Gene Fusion
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
          Combine 3 genes of the same type and tier into 1 higher-tier gene.
          Fused genes are larger, more powerful, and visually distinct.
        </div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 8 }}>
          3× Base → 1× Dense (2.7× stat) · 3× Dense → 1× Hyper (2.5× stat) · 3× Hyper → 1× Titan (2.5× stat)
        </div>
      </div>

      {/* Fuseable genes */}
      <div style={{ fontSize: 11, letterSpacing: 2, color: color, marginBottom: 8 }}>AVAILABLE FUSIONS</div>

      {fuseableGenes.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {fuseableGenes.map((fg, i) => (
            <div key={`${fg.geneType}-${fg.tier}-${i}`} style={{
              background: 'rgba(10, 15, 30, 0.9)',
              borderRadius: 8,
              padding: '12px 14px',
              border: `1px solid ${color}20`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
                    🧬 {fg.geneType.replace(/_/g, ' ')}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                    {GENE_STAT_KEYS[fg.geneType]}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: TIER_COLORS[fg.tier] }}>
                    {fg.count}× {TIER_LABELS[fg.tier]}
                  </div>
                </div>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 10,
                justifyContent: 'center',
              }}>
                <div style={{
                  padding: '4px 10px',
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: 4,
                  fontSize: 12,
                  color: TIER_COLORS[fg.tier],
                }}>
                  3× {TIER_LABELS[fg.tier]}
                </div>
                <span style={{ color: '#ff44ff', fontSize: 14 }}>→</span>
                <div style={{
                  padding: '4px 10px',
                  background: TIER_COLORS[fg.nextTier] + '15',
                  border: `1px solid ${TIER_COLORS[fg.nextTier]}40`,
                  borderRadius: 4,
                  fontSize: 12,
                  color: TIER_COLORS[fg.nextTier],
                  fontWeight: 700,
                }}>
                  1× {TIER_LABELS[fg.nextTier]}
                </div>
              </div>

              <button
                onClick={() => handleFuse(fg.geneType, fg.tier)}
                disabled={fusing}
                style={{
                  width: '100%',
                  padding: '8px 0',
                  background: `linear-gradient(135deg, #ff44ff20, #ff44ff10)`,
                  border: '1px solid #ff44ff40',
                  borderRadius: 6,
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: fusing ? 'default' : 'pointer',
                  fontFamily: 'Rajdhani, sans-serif',
                  letterSpacing: 2,
                }}
              >
                {fusing ? 'FUSING...' : 'FUSE'}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          background: 'rgba(10, 15, 30, 0.6)',
          borderRadius: 8,
          padding: 24,
          textAlign: 'center',
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🧪</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>
            No fusions available
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
            Collect 3 or more genes of the same type on {CREATURE_NAMES[selectedCreature]} to unlock fusion
          </div>
        </div>
      )}

      {/* Gene catalog */}
      {creature && Object.keys(creature.genes).length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 11, letterSpacing: 2, color: color, marginBottom: 8 }}>GENE CATALOG</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
            {Object.entries(creature.genes).map(([geneType, entry]) => (
              <div key={geneType} style={{
                padding: '8px',
                background: 'rgba(10, 15, 30, 0.8)',
                borderRadius: 6,
                border: `1px solid ${color}15`,
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 10, color: '#fff', fontWeight: 600 }}>
                  {geneType.replace(/_/g, ' ')}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: color, marginTop: 2 }}>
                  {entry.count}
                </div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>
                  +{entry.total_stat_value}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
