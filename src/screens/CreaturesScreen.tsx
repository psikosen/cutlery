import { useState } from 'react';
import { useGame } from '../hooks/useGameState';
import { CreatureCanvas } from '../components/creatures/CreatureCanvas';
import type { CreatureId, Creature, GeneType } from '../types';
import {
  CREATURE_NAMES, EVOLUTION_STAGE_NAMES, DOMAIN_COLORS, GENE_STAT_KEYS,
} from '../types';
import { getAllTraits } from '../data/traits';
import { getNextEvolutionThreshold } from '../services/gameEngine';

export function CreaturesScreen() {
  const { state } = useGame();
  const [detailCreature, setDetailCreature] = useState<CreatureId | null>(state.selectedCreature);

  const creature = detailCreature
    ? state.creatures.find(c => c.id === detailCreature)
    : null;

  if (creature) {
    return <CreatureDetail creature={creature} onBack={() => setDetailCreature(null)} />;
  }

  return (
    <div style={{ padding: '16px 16px 80px', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ fontSize: 11, letterSpacing: 3, color: '#aa66ff', marginBottom: 16, fontWeight: 600 }}>
        ⌜ SHADOW ARMY ⌝
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 12,
      }}>
        {state.creatures.map(c => {
          const color = DOMAIN_COLORS[c.domain];
          const nextThreshold = getNextEvolutionThreshold(c.evolution_stage);
          const progress = nextThreshold === Infinity ? 100 :
            (c.total_genes / nextThreshold) * 100;

          return (
            <div
              key={c.id}
              onClick={() => setDetailCreature(c.id)}
              style={{
                background: 'rgba(10, 15, 30, 0.9)',
                borderRadius: 12,
                border: `1px solid ${color}30`,
                padding: 12,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <CreatureCanvas
                creature={c}
                width={120}
                height={120}
                style={{ margin: '0 auto', display: 'block' }}
              />
              <div style={{
                textAlign: 'center',
                marginTop: 8,
              }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'Cinzel, serif' }}>
                  {c.custom_name?.trim() || CREATURE_NAMES[c.id]}
                </div>
                <div style={{ fontSize: 11, color: color, fontWeight: 600 }}>
                  {EVOLUTION_STAGE_NAMES[c.evolution_stage]}
                </div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                  {c.total_genes} Genes — {c.total_power} Power
                </div>
                {/* Evolution progress */}
                <div style={{
                  marginTop: 6,
                  height: 4,
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: 2,
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.min(100, progress)}%`,
                    background: color,
                    borderRadius: 2,
                  }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CreatureDetail({ creature, onBack }: { creature: Creature; onBack: () => void }) {
  const color = DOMAIN_COLORS[creature.domain];
  const nextThreshold = getNextEvolutionThreshold(creature.evolution_stage);
  const progress = nextThreshold === Infinity ? 100 : (creature.total_genes / nextThreshold) * 100;
  const allTraits = getAllTraits();

  const unlockedTraits = allTraits.filter(t => creature.traits.includes(t.id));
  const geneEntries = Object.entries(creature.genes).sort(
    (a, b) => b[1].count - a[1].count
  );

  // Compute stats from genes
  const stats: Record<string, number> = {};
  for (const [geneType, entry] of geneEntries) {
    const statKey = GENE_STAT_KEYS[geneType as GeneType] || 'Power';
    stats[statKey] = (stats[statKey] || 0) + entry.total_stat_value;
  }

  return (
    <div style={{ padding: '16px 16px 80px', maxWidth: 480, margin: '0 auto' }}>
      {/* Back button */}
      <button
        onClick={onBack}
        style={{
          background: 'none',
          border: 'none',
          color: 'rgba(255,255,255,0.5)',
          fontSize: 13,
          cursor: 'pointer',
          padding: '4px 0',
          marginBottom: 8,
          fontFamily: 'Rajdhani, sans-serif',
        }}
      >
        ← Back to Army
      </button>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 11, letterSpacing: 3, color: color, fontWeight: 600 }}>
          {creature.domain.toUpperCase()}
        </div>
        <div style={{ fontSize: 24, fontWeight: 700, color: '#fff', fontFamily: 'Cinzel, serif' }}>
          {creature.custom_name?.trim() || CREATURE_NAMES[creature.id]}
        </div>
      </div>

      {/* Full creature view */}
      <div style={{
        background: 'rgba(10, 15, 30, 0.6)',
        borderRadius: 12,
        border: `1px solid ${color}30`,
        padding: 16,
        marginBottom: 16,
        textAlign: 'center',
      }}>
        <CreatureCanvas
          creature={creature}
          width={280}
          height={280}
          style={{ margin: '0 auto', display: 'block' }}
        />
      </div>

      {/* Evolution Progress */}
      <div style={{
        background: 'rgba(10, 15, 30, 0.8)',
        borderRadius: 8,
        padding: '12px 14px',
        marginBottom: 16,
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{ fontSize: 12, color: color, fontWeight: 600 }}>
            {EVOLUTION_STAGE_NAMES[creature.evolution_stage]}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
            {creature.evolution_stage < 5
              ? `${creature.total_genes} / ${nextThreshold} genes`
              : 'MAX EVOLUTION'}
          </div>
        </div>
        <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${Math.min(100, progress)}%`,
            background: `linear-gradient(90deg, ${color}, ${color}80)`,
            borderRadius: 3,
          }} />
        </div>
        {creature.evolution_stage < 5 && (
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
            Next: {EVOLUTION_STAGE_NAMES[creature.evolution_stage + 1]}
          </div>
        )}
      </div>

      {/* Stats Panel */}
      <div style={{
        background: 'rgba(10, 15, 30, 0.8)',
        borderRadius: 8,
        padding: '12px 14px',
        marginBottom: 16,
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ fontSize: 11, letterSpacing: 2, color: color, marginBottom: 8 }}>STATS</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {Object.entries(stats).map(([key, val]) => (
            <div key={key} style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '4px 8px',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: 4,
            }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{key}</span>
              <span style={{ fontSize: 12, color: '#fff', fontWeight: 600 }}>{val}</span>
            </div>
          ))}
        </div>
        {Object.keys(stats).length === 0 && (
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: 8 }}>
            No stats yet — complete tasks to grow
          </div>
        )}
      </div>

      {/* Gene Inventory */}
      <div style={{
        background: 'rgba(10, 15, 30, 0.8)',
        borderRadius: 8,
        padding: '12px 14px',
        marginBottom: 16,
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ fontSize: 11, letterSpacing: 2, color: color, marginBottom: 8 }}>GENE INVENTORY</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {geneEntries.map(([geneType, entry]) => {
            const traitThresholds = [3, 7, 15, 30];
            const nextTrait = traitThresholds.find(t => entry.count < t) || 30;
            const traitProgress = Math.min(100, (entry.count / nextTrait) * 100);

            return (
              <div key={geneType} style={{
                padding: '8px 10px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 6,
                border: `1px solid ${color}15`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: '#fff', fontWeight: 600 }}>
                    🧬 {geneType.replace(/_/g, ' ')}
                  </span>
                  <span style={{ fontSize: 11, color: color }}>x{entry.count}</span>
                </div>
                <div style={{ height: 3, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${traitProgress}%`,
                    background: color + '80',
                    borderRadius: 2,
                  }} />
                </div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
                  Trait: {entry.count}/{nextTrait}
                </div>
                {/* Tier breakdown */}
                <div style={{ display: 'flex', gap: 4, marginTop: 3 }}>
                  {entry.tier_breakdown.base > 0 && <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>B:{entry.tier_breakdown.base}</span>}
                  {entry.tier_breakdown.dense > 0 && <span style={{ fontSize: 9, color: '#00ccff' }}>D:{entry.tier_breakdown.dense}</span>}
                  {entry.tier_breakdown.hyper > 0 && <span style={{ fontSize: 9, color: '#aa66ff' }}>H:{entry.tier_breakdown.hyper}</span>}
                  {entry.tier_breakdown.titan > 0 && <span style={{ fontSize: 9, color: '#FFD700' }}>T:{entry.tier_breakdown.titan}</span>}
                </div>
              </div>
            );
          })}
        </div>
        {geneEntries.length === 0 && (
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: 8 }}>
            No genes acquired yet
          </div>
        )}
      </div>

      {/* Traits */}
      <div style={{
        background: 'rgba(10, 15, 30, 0.8)',
        borderRadius: 8,
        padding: '12px 14px',
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ fontSize: 11, letterSpacing: 2, color: color, marginBottom: 8 }}>TRAITS</div>
        {unlockedTraits.length > 0 ? (
          unlockedTraits.map(trait => (
            <div key={trait.id} style={{
              padding: '8px 10px',
              background: `${color}08`,
              borderRadius: 6,
              border: `1px solid ${color}20`,
              marginBottom: 6,
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
                ✨ {trait.name}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                {trait.description}
              </div>
              <div style={{ fontSize: 10, fontStyle: 'italic', color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
                "{trait.lore_text}"
              </div>
            </div>
          ))
        ) : (
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: 8 }}>
            Stack 3 genes of the same type to unlock traits
          </div>
        )}
      </div>
    </div>
  );
}
