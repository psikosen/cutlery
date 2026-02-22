import type { Achievement } from '../types';

export const DEFAULT_ACHIEVEMENTS: Omit<Achievement, 'unlocked' | 'unlocked_at'>[] = [
  // Gene milestones
  { id: 'first_mutation', name: 'First Mutation', description: 'Acquire your first gene', hint: 'Complete any task', icon: '🧬', rarity: 'common', condition: { type: 'total_genes', target: 'player', value: 1 }, reward: { xp: 50, gold: 25 }, lore_text: 'The shadow stirs. Something is growing.' },
  { id: 'ten_genes', name: 'Gene Collector', description: 'Acquire 10 genes', hint: 'Keep completing tasks', icon: '🧬', rarity: 'common', condition: { type: 'total_genes', target: 'player', value: 10 }, reward: { xp: 100, gold: 50 }, lore_text: 'The mutations accumulate. The creature hungers for more.' },
  { id: 'fifty_genes', name: 'Mutation Hoard', description: 'Acquire 50 genes', hint: 'Dedicated task completion', icon: '🧬', rarity: 'rare', condition: { type: 'total_genes', target: 'player', value: 50 }, reward: { xp: 250, gold: 100 }, lore_text: 'Fifty genes. Fifty marks of effort carved into shadow flesh.' },
  { id: 'hundred_genes', name: 'Centurion', description: 'Acquire 100 genes', hint: 'A hundred mutations strong', icon: '🧬', rarity: 'epic', condition: { type: 'total_genes', target: 'player', value: 100 }, reward: { xp: 500, gold: 250 }, lore_text: 'One hundred mutations. The creature barely resembles what it was.' },
  { id: 'three_hundred_genes', name: 'Gene Sovereign', description: 'Acquire 300 genes total', hint: 'Reach the pinnacle of mutation', icon: '🧬', rarity: 'legendary', condition: { type: 'total_genes', target: 'player', value: 300 }, reward: { xp: 1000, gold: 500 }, lore_text: 'Three hundred genes. You have transcended biology.' },

  // Evolution milestones
  { id: 'first_evolution', name: 'Awakening', description: 'Evolve a creature to Spawn stage', hint: 'Earn 10 genes on one creature', icon: '🌟', rarity: 'common', condition: { type: 'evolution', target: 'any', value: 1 }, reward: { xp: 100, gold: 50 }, lore_text: 'It opens its eyes for the first time.' },
  { id: 'whelp_stage', name: 'Growing Horror', description: 'Evolve a creature to Whelp stage', hint: '30 genes on one creature', icon: '🌟', rarity: 'rare', condition: { type: 'evolution', target: 'any', value: 2 }, reward: { xp: 200, gold: 100 }, lore_text: 'It has a body now. Limbs. Purpose.' },
  { id: 'beast_stage', name: 'Unleashed', description: 'Evolve a creature to Beast stage', hint: '75 genes on one creature', icon: '🌟', rarity: 'epic', condition: { type: 'evolution', target: 'any', value: 3 }, reward: { xp: 400, gold: 200 }, lore_text: 'The beast has awakened. Run.' },
  { id: 'monstrosity_stage', name: 'Monstrosity', description: 'Evolve a creature to Monstrosity stage', hint: '150 genes on one creature', icon: '🌟', rarity: 'legendary', condition: { type: 'evolution', target: 'any', value: 4 }, reward: { xp: 750, gold: 400 }, lore_text: 'Reality bends around it. This is no longer natural.' },
  { id: 'eldritch_stage', name: 'Eldritch Ascension', description: 'Evolve a creature to Eldritch stage', hint: '300 genes on one creature', icon: '🌟', rarity: 'mythic', condition: { type: 'evolution', target: 'any', value: 5 }, reward: { xp: 2000, gold: 1000 }, lore_text: 'It has transcended. The boundary between worlds means nothing to it now.' },

  // Streak milestones
  { id: 'streak_3', name: 'Spark', description: 'Maintain a 3-day streak', hint: 'Complete tasks 3 days in a row', icon: '🔥', rarity: 'common', condition: { type: 'streak', target: 'player', value: 3 }, reward: { xp: 50, gold: 25 }, lore_text: 'A spark catches. Feed it.' },
  { id: 'streak_7', name: 'Flame', description: 'Maintain a 7-day streak', hint: 'One full week of consistency', icon: '🔥', rarity: 'common', condition: { type: 'streak', target: 'player', value: 7 }, reward: { xp: 100, gold: 50 }, lore_text: 'The flame grows steady. It will not be easily snuffed.' },
  { id: 'streak_14', name: 'Blaze', description: 'Maintain a 14-day streak', hint: 'Two weeks without breaking', icon: '🔥', rarity: 'rare', condition: { type: 'streak', target: 'player', value: 14 }, reward: { xp: 200, gold: 100 }, lore_text: 'Two weeks. The chains hold fast.' },
  { id: 'streak_30', name: 'Inferno', description: 'Maintain a 30-day streak', hint: 'One full month of fire', icon: '🔥', rarity: 'epic', condition: { type: 'streak', target: 'player', value: 30 }, reward: { xp: 500, gold: 250 }, lore_text: 'A month of unbroken will. The Chain Wraith sings.' },
  { id: 'streak_66', name: 'Forged in Fire', description: 'Maintain a 66-day streak', hint: 'The habit formation threshold', icon: '🔥', rarity: 'legendary', condition: { type: 'streak', target: 'player', value: 66 }, reward: { xp: 1000, gold: 500 }, lore_text: 'Sixty-six days. The habit is now part of your soul.' },

  // Task milestones
  { id: 'ten_tasks', name: 'Getting Started', description: 'Complete 10 tasks', hint: 'Keep grinding', icon: '⚔️', rarity: 'common', condition: { type: 'total_tasks', target: 'player', value: 10 }, reward: { xp: 50, gold: 25 }, lore_text: 'The journey of a thousand miles begins with a single step.' },
  { id: 'fifty_tasks', name: 'Dedicated', description: 'Complete 50 tasks', hint: 'Half a hundred battles won', icon: '⚔️', rarity: 'rare', condition: { type: 'total_tasks', target: 'player', value: 50 }, reward: { xp: 200, gold: 100 }, lore_text: 'Fifty battles. Each one made you stronger.' },
  { id: 'hundred_tasks', name: 'Centurion Hunter', description: 'Complete 100 tasks', hint: 'Triple digits', icon: '⚔️', rarity: 'epic', condition: { type: 'total_tasks', target: 'player', value: 100 }, reward: { xp: 500, gold: 250 }, lore_text: 'One hundred tasks completed. The shadows recognize your name.' },
  { id: 'five_hundred_tasks', name: 'Shadow Legend', description: 'Complete 500 tasks', hint: 'Only the most dedicated reach this', icon: '⚔️', rarity: 'legendary', condition: { type: 'total_tasks', target: 'player', value: 500 }, reward: { xp: 2000, gold: 1000 }, lore_text: 'Five hundred. You are no longer playing a game. You are the game.' },

  // Domain variety
  { id: 'all_domains', name: 'Renaissance Hunter', description: 'Complete at least one task in every domain', hint: 'Try all 6 life domains', icon: '🌈', rarity: 'rare', condition: { type: 'all_domains', target: 'player', value: 1 }, reward: { xp: 200, gold: 100 }, lore_text: 'A hunter who fights on all fronts.' },

  // Trait milestones
  { id: 'first_trait', name: 'Emergent', description: 'Unlock your first trait', hint: 'Stack 3 genes of the same type', icon: '✨', rarity: 'common', condition: { type: 'total_traits', target: 'player', value: 1 }, reward: { xp: 100, gold: 50 }, lore_text: 'The genes resonate. Something new emerges.' },
  { id: 'five_traits', name: 'Trait Collector', description: 'Unlock 5 traits', hint: 'Focus your gene stacking', icon: '✨', rarity: 'rare', condition: { type: 'total_traits', target: 'player', value: 5 }, reward: { xp: 300, gold: 150 }, lore_text: 'Five traits unlocked. The creatures are evolving beyond their base forms.' },

  // Rank milestones
  { id: 'rank_d', name: 'Rising Hunter', description: 'Reach Hunter Rank D', hint: 'Accumulate 51 total power', icon: '🏅', rarity: 'common', condition: { type: 'rank', target: 'player', value: 51 }, reward: { xp: 50, gold: 25 }, lore_text: 'The system recognizes your growth.' },
  { id: 'rank_c', name: 'Dungeon Crawler', description: 'Reach Hunter Rank C', hint: 'Accumulate 201 total power', icon: '🏅', rarity: 'common', condition: { type: 'rank', target: 'player', value: 201 }, reward: { xp: 100, gold: 50 }, lore_text: 'The dungeons hold no fear for you.' },
  { id: 'rank_b', name: 'Elite Hunter', description: 'Reach Hunter Rank B', hint: 'Accumulate 601 total power', icon: '🏅', rarity: 'rare', condition: { type: 'rank', target: 'player', value: 601 }, reward: { xp: 200, gold: 100 }, lore_text: 'You stand among the elite.' },
  { id: 'rank_a', name: 'Raid Captain', description: 'Reach Hunter Rank A', hint: 'Accumulate 1501 total power', icon: '🏅', rarity: 'epic', condition: { type: 'rank', target: 'player', value: 1501 }, reward: { xp: 500, gold: 250 }, lore_text: 'Others look to you for guidance in the darkness.' },
  { id: 'rank_s', name: 'Shadow Commander', description: 'Reach Hunter Rank S', hint: 'Accumulate 3501 total power', icon: '🏅', rarity: 'legendary', condition: { type: 'rank', target: 'player', value: 3501 }, reward: { xp: 1000, gold: 500 }, lore_text: 'S-Rank. The shadows themselves bow to your command.' },

  // Skill milestones
  { id: 'first_skill', name: 'Skill Awakened', description: 'Unlock your first creature skill', hint: 'Evolve a creature to Spawn stage', icon: '⚡', rarity: 'common', condition: { type: 'total_skills', target: 'player', value: 1 }, reward: { xp: 100, gold: 50 }, lore_text: 'The creature stirs. New power flows through its veins.' },
  { id: 'six_skills', name: 'Multi-Skilled', description: 'Unlock 6 creature skills', hint: 'Evolve multiple creatures', icon: '⚡', rarity: 'rare', condition: { type: 'total_skills', target: 'player', value: 6 }, reward: { xp: 250, gold: 125 }, lore_text: 'Six skills. The army grows more capable.' },
  { id: 'twelve_skills', name: 'Skill Adept', description: 'Unlock 12 creature skills', hint: 'Push your creatures further', icon: '⚡', rarity: 'epic', condition: { type: 'total_skills', target: 'player', value: 12 }, reward: { xp: 500, gold: 250 }, lore_text: 'Twelve skills mastered. The shadows sharpen.' },
  { id: 'twentyfour_skills', name: 'Skill Sovereign', description: 'Unlock 24 creature skills', hint: 'Master the skill trees', icon: '⚡', rarity: 'legendary', condition: { type: 'total_skills', target: 'player', value: 24 }, reward: { xp: 1000, gold: 500 }, lore_text: 'Twenty-four skills. Your creatures have ascended beyond mortal limits.' },

  // Ability milestones
  { id: 'first_ability', name: 'Power Awakening', description: 'Unlock your first special ability', hint: 'Build cross-domain synergies or reach power milestones', icon: '🌟', rarity: 'rare', condition: { type: 'total_abilities', target: 'player', value: 1 }, reward: { xp: 200, gold: 100 }, lore_text: 'A power beyond skills. Beyond genes. The system itself yields.' },
  { id: 'five_abilities', name: 'Ability Collector', description: 'Unlock 5 special abilities', hint: 'Diversify your progression', icon: '🌟', rarity: 'epic', condition: { type: 'total_abilities', target: 'player', value: 5 }, reward: { xp: 500, gold: 250 }, lore_text: 'Five abilities. The shadow realm bends to your will.' },
  { id: 'ten_abilities', name: 'Shadow Sovereign', description: 'Unlock 10 special abilities', hint: 'Master all domains', icon: '🌟', rarity: 'legendary', condition: { type: 'total_abilities', target: 'player', value: 10 }, reward: { xp: 1500, gold: 750 }, lore_text: 'Ten abilities. You are no longer playing the system. You are the system.' },

  // Gene diversity milestones
  { id: 'gene_diversity', name: 'Genetic Polymath', description: 'Acquire genes of 30 or more different types', hint: 'Complete tasks across all categories', icon: '🧬', rarity: 'epic', condition: { type: 'gene_diversity', target: 'player', value: 30 }, reward: { xp: 500, gold: 250 }, lore_text: 'Thirty gene types. A library of mutations inscribed in shadow flesh.' },
  { id: 'full_genome', name: 'Complete Genome', description: 'Acquire at least one gene of every type', hint: 'Experience all 54 gene types', icon: '🧬', rarity: 'legendary', condition: { type: 'gene_diversity', target: 'player', value: 54 }, reward: { xp: 2000, gold: 1000 }, lore_text: 'Every gene type acquired. The genome is complete. Evolution has no more secrets.' },
];

export function getDefaultAchievements(): Achievement[] {
  return DEFAULT_ACHIEVEMENTS.map(a => ({
    ...a,
    unlocked: false,
  }));
}
