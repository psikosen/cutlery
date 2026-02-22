import type { Task, Domain, GeneType } from '../types';

interface TaskTemplate {
  name: string;
  description: string;
  icon: string;
  domain: Domain;
  category: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  type: 'daily' | 'weekly' | 'boss' | 'emergency';
  gene_type: GeneType;
  xp: number;
  gold: number;
  repeatable: boolean;
}

const TASK_TEMPLATES: TaskTemplate[] = [
  // ===== HEALTH & FITNESS — GORE MAW =====
  { name: '50 Push-ups', description: 'Complete 50 push-ups in any rep scheme', icon: '💪', domain: 'health', category: 'strength', difficulty: 2, type: 'daily', gene_type: 'muscle_fiber', xp: 30, gold: 15, repeatable: true },
  { name: '100 Push-ups', description: 'Complete 100 push-ups — the warrior\'s training', icon: '💪', domain: 'health', category: 'strength', difficulty: 3, type: 'daily', gene_type: 'muscle_fiber', xp: 50, gold: 25, repeatable: true },
  { name: 'Weight Training', description: 'Complete a full weight training session', icon: '🏋️', domain: 'health', category: 'strength', difficulty: 3, type: 'daily', gene_type: 'muscle_fiber', xp: 50, gold: 25, repeatable: true },
  { name: '2-Min Plank Hold', description: 'Hold a plank position for 2 minutes', icon: '🛡️', domain: 'health', category: 'endurance', difficulty: 2, type: 'daily', gene_type: 'bone_plate', xp: 30, gold: 15, repeatable: true },
  { name: '5-Min Plank Challenge', description: 'Hold a plank for 5 minutes total', icon: '🛡️', domain: 'health', category: 'endurance', difficulty: 4, type: 'daily', gene_type: 'bone_plate', xp: 60, gold: 30, repeatable: true },
  { name: '30-Min Run', description: 'Run for at least 30 minutes', icon: '🏃', domain: 'health', category: 'cardio', difficulty: 2, type: 'daily', gene_type: 'vein_network', xp: 35, gold: 20, repeatable: true },
  { name: '5K Run', description: 'Complete a 5 kilometer run', icon: '🏃', domain: 'health', category: 'cardio', difficulty: 3, type: 'daily', gene_type: 'vein_network', xp: 50, gold: 25, repeatable: true },
  { name: 'Cycling Session', description: 'Bike for at least 30 minutes', icon: '🚴', domain: 'health', category: 'cardio', difficulty: 2, type: 'daily', gene_type: 'vein_network', xp: 35, gold: 20, repeatable: true },
  { name: 'Yoga Flow', description: 'Complete a full yoga session', icon: '🧘', domain: 'health', category: 'flexibility', difficulty: 2, type: 'daily', gene_type: 'tendon_whip', xp: 30, gold: 15, repeatable: true },
  { name: 'Stretching Routine', description: '15 minutes of focused stretching', icon: '🤸', domain: 'health', category: 'flexibility', difficulty: 1, type: 'daily', gene_type: 'tendon_whip', xp: 20, gold: 10, repeatable: true },
  { name: '8 Hours Sleep', description: 'Get a full 8 hours of quality sleep', icon: '😴', domain: 'health', category: 'recovery', difficulty: 1, type: 'daily', gene_type: 'organ_sac', xp: 20, gold: 10, repeatable: true },
  { name: 'Drink 8 Glasses Water', description: 'Stay hydrated — 8 glasses minimum', icon: '💧', domain: 'health', category: 'recovery', difficulty: 1, type: 'daily', gene_type: 'organ_sac', xp: 15, gold: 10, repeatable: true },
  { name: 'Clean Meal Day', description: 'Every meal today was healthy and balanced', icon: '🥗', domain: 'health', category: 'recovery', difficulty: 2, type: 'daily', gene_type: 'organ_sac', xp: 30, gold: 15, repeatable: true },
  { name: 'Personal Record Day', description: 'Beat a personal best in any exercise', icon: '🔥', domain: 'health', category: 'boss', difficulty: 5, type: 'weekly', gene_type: 'tooth_row', xp: 100, gold: 50, repeatable: true },
  { name: 'Iron Week', description: 'Complete 5 workout sessions this week', icon: '⚔️', domain: 'health', category: 'boss', difficulty: 4, type: 'boss', gene_type: 'tooth_row', xp: 150, gold: 75, repeatable: true },

  // ===== MIND & KNOWLEDGE — MIND WEAVER =====
  { name: 'Read 30 Minutes', description: 'Read a book or article for 30 minutes', icon: '📖', domain: 'mind', category: 'reading', difficulty: 1, type: 'daily', gene_type: 'eye_cluster', xp: 25, gold: 10, repeatable: true },
  { name: 'Read 1 Hour', description: 'Deep reading session — 1 full hour', icon: '📚', domain: 'mind', category: 'reading', difficulty: 2, type: 'daily', gene_type: 'eye_cluster', xp: 40, gold: 20, repeatable: true },
  { name: 'Online Course Lesson', description: 'Complete one lesson from an online course', icon: '🎓', domain: 'mind', category: 'learning', difficulty: 2, type: 'daily', gene_type: 'neural_tendril', xp: 35, gold: 15, repeatable: true },
  { name: 'Learn Something New', description: 'Study a topic you know nothing about', icon: '🧠', domain: 'mind', category: 'learning', difficulty: 2, type: 'daily', gene_type: 'neural_tendril', xp: 30, gold: 15, repeatable: true },
  { name: 'Finish a Book', description: 'Complete an entire book this week', icon: '📕', domain: 'mind', category: 'reading', difficulty: 3, type: 'weekly', gene_type: 'skull_graft', xp: 80, gold: 40, repeatable: true },
  { name: 'Coding Challenge', description: 'Complete a programming challenge or puzzle', icon: '💻', domain: 'mind', category: 'problemsolving', difficulty: 3, type: 'daily', gene_type: 'synapse_arc', xp: 45, gold: 25, repeatable: true },
  { name: 'Brain Puzzle', description: 'Complete a sudoku, crossword, or logic puzzle', icon: '🧩', domain: 'mind', category: 'problemsolving', difficulty: 1, type: 'daily', gene_type: 'synapse_arc', xp: 20, gold: 10, repeatable: true },
  { name: 'Journal Entry', description: 'Write a reflective journal entry', icon: '✍️', domain: 'mind', category: 'reflection', difficulty: 1, type: 'daily', gene_type: 'memory_sac', xp: 20, gold: 10, repeatable: true },
  { name: '15-Min Meditation', description: 'Meditate for 15 minutes', icon: '🧘', domain: 'mind', category: 'reflection', difficulty: 2, type: 'daily', gene_type: 'memory_sac', xp: 30, gold: 15, repeatable: true },
  { name: 'Teach Someone', description: 'Explain a concept you know to someone else', icon: '👨‍🏫', domain: 'mind', category: 'mentoring', difficulty: 3, type: 'daily', gene_type: 'psychic_crown', xp: 45, gold: 25, repeatable: true },
  { name: 'Knowledge Week', description: 'Complete 7 mind tasks this week', icon: '🌌', domain: 'mind', category: 'boss', difficulty: 4, type: 'boss', gene_type: 'psychic_crown', xp: 150, gold: 75, repeatable: true },

  // ===== DISCIPLINE & HABITS — CHAIN WRAITH =====
  { name: 'Morning Routine', description: 'Complete your full morning routine', icon: '🌅', domain: 'discipline', category: 'routine', difficulty: 2, type: 'daily', gene_type: 'ember_node', xp: 30, gold: 15, repeatable: true },
  { name: 'No Social Media', description: 'Avoid social media for the entire day', icon: '📵', domain: 'discipline', category: 'resistance', difficulty: 3, type: 'daily', gene_type: 'iron_plate', xp: 40, gold: 20, repeatable: true },
  { name: 'Cold Shower', description: 'Take a cold shower — test your resolve', icon: '🥶', domain: 'discipline', category: 'resistance', difficulty: 2, type: 'daily', gene_type: 'iron_plate', xp: 30, gold: 15, repeatable: true },
  { name: 'Stick to Schedule', description: 'Follow your planned schedule all day', icon: '📋', domain: 'discipline', category: 'routine', difficulty: 2, type: 'daily', gene_type: 'chain_link', xp: 30, gold: 15, repeatable: true },
  { name: 'No Junk Food', description: 'Avoid all junk food and sugary drinks', icon: '🚫', domain: 'discipline', category: 'resistance', difficulty: 2, type: 'daily', gene_type: 'iron_plate', xp: 30, gold: 15, repeatable: true },
  { name: 'Mindfulness Session', description: '10 minutes of mindful awareness', icon: '🕊️', domain: 'discipline', category: 'mindfulness', difficulty: 1, type: 'daily', gene_type: 'spectral_layer', xp: 20, gold: 10, repeatable: true },
  { name: 'Track All Habits', description: 'Log every habit in your tracker', icon: '📊', domain: 'discipline', category: 'tracking', difficulty: 1, type: 'daily', gene_type: 'wardens_eye', xp: 20, gold: 10, repeatable: true },
  { name: 'Evening Review', description: 'Review your day and plan tomorrow', icon: '🌙', domain: 'discipline', category: 'tracking', difficulty: 1, type: 'daily', gene_type: 'wardens_eye', xp: 20, gold: 10, repeatable: true },
  { name: 'Unbroken Week', description: 'Complete all daily discipline tasks for 7 days', icon: '⛓️', domain: 'discipline', category: 'boss', difficulty: 5, type: 'boss', gene_type: 'lock_core', xp: 200, gold: 100, repeatable: true },

  // ===== CAREER & SKILLS — ROT ENGINE =====
  { name: 'Complete Work Task', description: 'Finish a meaningful work/project task', icon: '⚙️', domain: 'career', category: 'work', difficulty: 2, type: 'daily', gene_type: 'gear_assembly', xp: 35, gold: 20, repeatable: true },
  { name: 'Deep Work Session', description: '2+ hours of uninterrupted focused work', icon: '🔥', domain: 'career', category: 'focus', difficulty: 3, type: 'daily', gene_type: 'furnace_core', xp: 50, gold: 25, repeatable: true },
  { name: 'Network Contact', description: 'Reach out to a professional contact', icon: '🤝', domain: 'career', category: 'networking', difficulty: 2, type: 'daily', gene_type: 'cable_nerve', xp: 30, gold: 15, repeatable: true },
  { name: 'Practice Your Craft', description: '1 hour of deliberate skill practice', icon: '🔨', domain: 'career', category: 'practice', difficulty: 2, type: 'daily', gene_type: 'piston_limb', xp: 35, gold: 20, repeatable: true },
  { name: 'Plan & Strategize', description: 'Spend 30 min planning your week/project', icon: '📐', domain: 'career', category: 'planning', difficulty: 1, type: 'daily', gene_type: 'blueprint_glyph', xp: 25, gold: 10, repeatable: true },
  { name: 'Ship Something', description: 'Complete and deliver a project or milestone', icon: '🚀', domain: 'career', category: 'delivery', difficulty: 3, type: 'weekly', gene_type: 'exhaust_vent', xp: 60, gold: 30, repeatable: true },
  { name: 'Productivity Beast', description: 'Complete 5 career tasks this week', icon: '🏭', domain: 'career', category: 'boss', difficulty: 4, type: 'boss', gene_type: 'exhaust_vent', xp: 150, gold: 75, repeatable: true },

  // ===== FINANCE & WEALTH — GILT HORROR =====
  { name: 'Track Expenses', description: 'Log all spending for today', icon: '📝', domain: 'finance', category: 'tracking', difficulty: 1, type: 'daily', gene_type: 'coin_disc', xp: 20, gold: 10, repeatable: true },
  { name: 'Save Money', description: 'Put money into savings today', icon: '💰', domain: 'finance', category: 'saving', difficulty: 2, type: 'daily', gene_type: 'gold_scale', xp: 35, gold: 20, repeatable: true },
  { name: 'Budget Review', description: 'Review and adjust your budget', icon: '📊', domain: 'finance', category: 'planning', difficulty: 2, type: 'weekly', gene_type: 'ledger_glyph', xp: 40, gold: 20, repeatable: true },
  { name: 'No Impulse Buy', description: 'Resist an unnecessary purchase today', icon: '🛑', domain: 'finance', category: 'saving', difficulty: 2, type: 'daily', gene_type: 'vault_door', xp: 30, gold: 15, repeatable: true },
  { name: 'Research Investment', description: 'Learn about a new investment opportunity', icon: '📈', domain: 'finance', category: 'investing', difficulty: 2, type: 'daily', gene_type: 'investment_tendril', xp: 30, gold: 15, repeatable: true },
  { name: 'Savings Milestone', description: 'Hit a savings goal or milestone', icon: '🏦', domain: 'finance', category: 'boss', difficulty: 4, type: 'boss', gene_type: 'crown_jewel', xp: 150, gold: 100, repeatable: true },

  // ===== SOCIAL & RELATIONSHIPS — HOLLOW SINGER =====
  { name: 'Reach Out', description: 'Message or call someone you care about', icon: '📱', domain: 'social', category: 'connection', difficulty: 1, type: 'daily', gene_type: 'mouth', xp: 20, gold: 10, repeatable: true },
  { name: 'Meet Someone New', description: 'Introduce yourself to someone new', icon: '👋', domain: 'social', category: 'expand', difficulty: 3, type: 'daily', gene_type: 'face_mask', xp: 40, gold: 20, repeatable: true },
  { name: 'Give a Presentation', description: 'Present or speak to a group', icon: '🎤', domain: 'social', category: 'speaking', difficulty: 4, type: 'weekly', gene_type: 'vocal_cord', xp: 60, gold: 30, repeatable: true },
  { name: 'Active Listening', description: 'Have a conversation focused on truly listening', icon: '👂', domain: 'social', category: 'empathy', difficulty: 1, type: 'daily', gene_type: 'echo_chamber', xp: 20, gold: 10, repeatable: true },
  { name: 'Group Activity', description: 'Participate in a team sport or group event', icon: '🤼', domain: 'social', category: 'team', difficulty: 2, type: 'daily', gene_type: 'harmony_thread', xp: 35, gold: 20, repeatable: true },
  { name: 'Follow Up', description: 'Follow up with someone you recently met', icon: '🔄', domain: 'social', category: 'maintain', difficulty: 1, type: 'daily', gene_type: 'memory_face', xp: 20, gold: 10, repeatable: true },
  { name: 'Social Butterfly', description: 'Complete 5 social tasks this week', icon: '🦋', domain: 'social', category: 'boss', difficulty: 4, type: 'boss', gene_type: 'vocal_cord', xp: 150, gold: 75, repeatable: true },
];

let taskCounter = 0;

export function generateDefaultTasks(): Task[] {
  return TASK_TEMPLATES.map((t) => {
    taskCounter++;
    return {
      id: `task_${t.domain}_${taskCounter}`,
      name: t.name,
      description: t.description,
      icon: t.icon,
      domain: t.domain,
      category: t.category,
      difficulty: t.difficulty,
      type: t.type,
      rewards: {
        xp: t.xp,
        gold: t.gold,
        gene_type: t.gene_type,
        gene_count: t.type === 'boss' ? 2 : 1,
      },
      repeatable: t.repeatable,
      completed_today: false,
      completed_count: 0,
    };
  });
}
