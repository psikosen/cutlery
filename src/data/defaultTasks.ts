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
  { name: 'Ice Bath', description: 'Take a cold immersion for recovery', icon: '🧊', domain: 'health', category: 'recovery', difficulty: 3, type: 'daily', gene_type: 'blood_shard', xp: 40, gold: 20, repeatable: true },
  { name: 'First Aid Practice', description: 'Practice or study first aid techniques', icon: '🩹', domain: 'health', category: 'recovery', difficulty: 2, type: 'daily', gene_type: 'blood_shard', xp: 30, gold: 15, repeatable: true },
  { name: 'Reaction Training', description: 'Practice reaction speed drills or sports', icon: '⚡', domain: 'health', category: 'agility', difficulty: 2, type: 'daily', gene_type: 'nerve_bundle', xp: 30, gold: 15, repeatable: true },
  { name: 'Sprint Intervals', description: 'Complete high-intensity sprint intervals', icon: '🏎️', domain: 'health', category: 'agility', difficulty: 3, type: 'daily', gene_type: 'nerve_bundle', xp: 45, gold: 25, repeatable: true },
  { name: 'Endurance Run', description: 'Run for 60+ minutes without stopping', icon: '🏃', domain: 'health', category: 'endurance', difficulty: 4, type: 'daily', gene_type: 'marrow_core', xp: 60, gold: 30, repeatable: true },
  { name: 'Multi-Hour Hike', description: 'Complete a long hike (2+ hours)', icon: '🥾', domain: 'health', category: 'endurance', difficulty: 3, type: 'weekly', gene_type: 'marrow_core', xp: 50, gold: 25, repeatable: true },

  // --- New Health Organs & Appendages ---
  { name: 'Breathing Exercises', description: 'Practice deep breathing for 10 minutes', icon: '🌬️', domain: 'health', category: 'recovery', difficulty: 1, type: 'daily', gene_type: 'lung_bellows', xp: 20, gold: 10, repeatable: true },
  { name: 'Breath Hold Training', description: 'Practice CO2 tolerance breath holds', icon: '💨', domain: 'health', category: 'endurance', difficulty: 3, type: 'daily', gene_type: 'lung_bellows', xp: 40, gold: 20, repeatable: true },
  { name: 'Cardio Endurance', description: 'Maintain elevated heart rate for 45+ minutes', icon: '❤️', domain: 'health', category: 'cardio', difficulty: 3, type: 'daily', gene_type: 'heart_pump', xp: 45, gold: 25, repeatable: true },
  { name: 'Resting Heart Rate Check', description: 'Track and record your resting heart rate', icon: '💓', domain: 'health', category: 'tracking', difficulty: 1, type: 'daily', gene_type: 'heart_pump', xp: 15, gold: 10, repeatable: true },
  { name: 'Rock Climbing', description: 'Complete a climbing session (indoor or outdoor)', icon: '🧗', domain: 'health', category: 'strength', difficulty: 3, type: 'daily', gene_type: 'claw_hook', xp: 50, gold: 25, repeatable: true },
  { name: 'Grip Strength Training', description: 'Dedicated grip and forearm training', icon: '✊', domain: 'health', category: 'strength', difficulty: 2, type: 'daily', gene_type: 'claw_hook', xp: 30, gold: 15, repeatable: true },

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
  { name: 'Creative Project', description: 'Work on a creative project (art, music, writing)', icon: '🎨', domain: 'mind', category: 'creativity', difficulty: 2, type: 'daily', gene_type: 'cortex_fold', xp: 35, gold: 15, repeatable: true },
  { name: 'Brainstorm Session', description: 'Spend 20 minutes brainstorming new ideas', icon: '💡', domain: 'mind', category: 'creativity', difficulty: 1, type: 'daily', gene_type: 'cortex_fold', xp: 25, gold: 10, repeatable: true },
  { name: 'Dream Journal', description: 'Record and reflect on your dreams', icon: '🌙', domain: 'mind', category: 'reflection', difficulty: 1, type: 'daily', gene_type: 'dream_gland', xp: 20, gold: 10, repeatable: true },
  { name: 'Follow Your Intuition', description: 'Make a decision by trusting your gut today', icon: '🔮', domain: 'mind', category: 'reflection', difficulty: 2, type: 'daily', gene_type: 'dream_gland', xp: 30, gold: 15, repeatable: true },
  { name: 'Plan Next Month', description: 'Create a detailed plan for the upcoming month', icon: '📅', domain: 'mind', category: 'planning', difficulty: 3, type: 'weekly', gene_type: 'third_eye', xp: 50, gold: 25, repeatable: true },
  { name: 'Strategic Analysis', description: 'Analyze a situation and predict outcomes', icon: '🎯', domain: 'mind', category: 'planning', difficulty: 2, type: 'daily', gene_type: 'third_eye', xp: 35, gold: 15, repeatable: true },

  // --- New Mind Brain Power Genes ---
  { name: 'Logic Puzzle Deep Dive', description: 'Spend 30 min on advanced logic problems', icon: '🧮', domain: 'mind', category: 'problemsolving', difficulty: 3, type: 'daily', gene_type: 'cerebral_lobe', xp: 45, gold: 25, repeatable: true },
  { name: 'Study Complex Topic', description: 'Study something that stretches your understanding', icon: '🔬', domain: 'mind', category: 'learning', difficulty: 3, type: 'daily', gene_type: 'cerebral_lobe', xp: 50, gold: 25, repeatable: true },
  { name: 'Mental Math Sprint', description: 'Practice rapid mental calculations for 15 minutes', icon: '🧠', domain: 'mind', category: 'problemsolving', difficulty: 2, type: 'daily', gene_type: 'logic_matrix', xp: 30, gold: 15, repeatable: true },
  { name: 'Debate or Argue a Position', description: 'Construct and defend an argument on any topic', icon: '⚖️', domain: 'mind', category: 'problemsolving', difficulty: 3, type: 'daily', gene_type: 'logic_matrix', xp: 45, gold: 25, repeatable: true },
  { name: 'Focused Visualization', description: 'Spend 15 min vividly visualizing a goal or scenario', icon: '🔮', domain: 'mind', category: 'reflection', difficulty: 2, type: 'daily', gene_type: 'psionic_node', xp: 30, gold: 15, repeatable: true },
  { name: 'Concentration Challenge', description: 'Maintain single-point focus for 20+ minutes', icon: '🎯', domain: 'mind', category: 'reflection', difficulty: 3, type: 'daily', gene_type: 'psionic_node', xp: 40, gold: 20, repeatable: true },
  { name: 'Time Blocking Session', description: 'Plan and execute a fully time-blocked day', icon: '⏰', domain: 'mind', category: 'planning', difficulty: 2, type: 'daily', gene_type: 'temporal_gland', xp: 35, gold: 20, repeatable: true },
  { name: 'Predict and Review', description: 'Make 3 predictions today and review accuracy', icon: '🔭', domain: 'mind', category: 'planning', difficulty: 2, type: 'daily', gene_type: 'temporal_gland', xp: 30, gold: 15, repeatable: true },
  { name: 'Sensory Awareness Walk', description: 'Walk for 20 min paying attention to every sense', icon: '👁️', domain: 'mind', category: 'reflection', difficulty: 1, type: 'daily', gene_type: 'astral_fiber', xp: 25, gold: 10, repeatable: true },
  { name: 'Body Scan Meditation', description: 'Complete a full body awareness meditation', icon: '🧘', domain: 'mind', category: 'reflection', difficulty: 2, type: 'daily', gene_type: 'astral_fiber', xp: 30, gold: 15, repeatable: true },
  { name: 'Root Cause Analysis', description: 'Analyze a problem down to its root cause', icon: '🔍', domain: 'mind', category: 'problemsolving', difficulty: 3, type: 'daily', gene_type: 'insight_lens', xp: 45, gold: 25, repeatable: true },
  { name: 'Perspective Switch', description: 'Examine a situation from 3 different viewpoints', icon: '🔄', domain: 'mind', category: 'creativity', difficulty: 2, type: 'daily', gene_type: 'insight_lens', xp: 30, gold: 15, repeatable: true },
  { name: 'Brain Mastery Week', description: 'Complete 10 mind tasks this week', icon: '🧬', domain: 'mind', category: 'boss', difficulty: 5, type: 'boss', gene_type: 'cerebral_lobe', xp: 200, gold: 100, repeatable: true },

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
  { name: 'Push Through', description: 'Complete a task you were avoiding', icon: '🎯', domain: 'discipline', category: 'resistance', difficulty: 3, type: 'daily', gene_type: 'anchor_bone', xp: 40, gold: 20, repeatable: true },
  { name: 'No Excuses Day', description: 'Complete every planned task without exceptions', icon: '🚫', domain: 'discipline', category: 'routine', difficulty: 3, type: 'daily', gene_type: 'anchor_bone', xp: 45, gold: 25, repeatable: true },
  { name: 'Discomfort Challenge', description: 'Deliberately do something uncomfortable', icon: '💥', domain: 'discipline', category: 'resistance', difficulty: 3, type: 'daily', gene_type: 'scar_tissue', xp: 40, gold: 20, repeatable: true },
  { name: 'Delayed Gratification', description: 'Postpone a reward you could have now', icon: '⏳', domain: 'discipline', category: 'resistance', difficulty: 2, type: 'daily', gene_type: 'scar_tissue', xp: 30, gold: 15, repeatable: true },
  { name: 'Same Time Every Day', description: 'Do a key habit at the exact same time', icon: '🕐', domain: 'discipline', category: 'routine', difficulty: 2, type: 'daily', gene_type: 'ritual_glyph', xp: 30, gold: 15, repeatable: true },
  { name: 'Build a New Ritual', description: 'Establish and perform a new daily ritual', icon: '🕯️', domain: 'discipline', category: 'routine', difficulty: 2, type: 'daily', gene_type: 'ritual_glyph', xp: 35, gold: 20, repeatable: true },

  // --- New Discipline Organs & Appendages ---
  { name: 'Posture Check Day', description: 'Maintain perfect posture all day', icon: '🦴', domain: 'discipline', category: 'routine', difficulty: 2, type: 'daily', gene_type: 'iron_spine', xp: 30, gold: 15, repeatable: true },
  { name: 'Stand Your Ground', description: 'Maintain a boundary you set, no exceptions', icon: '🏔️', domain: 'discipline', category: 'resistance', difficulty: 3, type: 'daily', gene_type: 'iron_spine', xp: 45, gold: 25, repeatable: true },
  { name: 'Willpower Test', description: 'Resist your strongest temptation for the full day', icon: '🔥', domain: 'discipline', category: 'resistance', difficulty: 3, type: 'daily', gene_type: 'will_node', xp: 40, gold: 20, repeatable: true },
  { name: 'Decision and Commit', description: 'Make a difficult decision and fully commit', icon: '⚡', domain: 'discipline', category: 'mindfulness', difficulty: 2, type: 'daily', gene_type: 'will_node', xp: 30, gold: 15, repeatable: true },

  // ===== CAREER & SKILLS — ROT ENGINE =====
  { name: 'Complete Work Task', description: 'Finish a meaningful work/project task', icon: '⚙️', domain: 'career', category: 'work', difficulty: 2, type: 'daily', gene_type: 'gear_assembly', xp: 35, gold: 20, repeatable: true },
  { name: 'Deep Work Session', description: '2+ hours of uninterrupted focused work', icon: '🔥', domain: 'career', category: 'focus', difficulty: 3, type: 'daily', gene_type: 'furnace_core', xp: 50, gold: 25, repeatable: true },
  { name: 'Network Contact', description: 'Reach out to a professional contact', icon: '🤝', domain: 'career', category: 'networking', difficulty: 2, type: 'daily', gene_type: 'cable_nerve', xp: 30, gold: 15, repeatable: true },
  { name: 'Practice Your Craft', description: '1 hour of deliberate skill practice', icon: '🔨', domain: 'career', category: 'practice', difficulty: 2, type: 'daily', gene_type: 'piston_limb', xp: 35, gold: 20, repeatable: true },
  { name: 'Plan & Strategize', description: 'Spend 30 min planning your week/project', icon: '📐', domain: 'career', category: 'planning', difficulty: 1, type: 'daily', gene_type: 'blueprint_glyph', xp: 25, gold: 10, repeatable: true },
  { name: 'Ship Something', description: 'Complete and deliver a project or milestone', icon: '🚀', domain: 'career', category: 'delivery', difficulty: 3, type: 'weekly', gene_type: 'exhaust_vent', xp: 60, gold: 30, repeatable: true },
  { name: 'Productivity Beast', description: 'Complete 5 career tasks this week', icon: '🏭', domain: 'career', category: 'boss', difficulty: 4, type: 'boss', gene_type: 'exhaust_vent', xp: 150, gold: 75, repeatable: true },
  { name: 'Try Something New', description: 'Experiment with a new tool, method, or approach', icon: '🧪', domain: 'career', category: 'innovation', difficulty: 2, type: 'daily', gene_type: 'spark_plug', xp: 35, gold: 15, repeatable: true },
  { name: 'Solve a Problem Creatively', description: 'Find an unconventional solution to a work problem', icon: '💡', domain: 'career', category: 'innovation', difficulty: 3, type: 'daily', gene_type: 'spark_plug', xp: 45, gold: 25, repeatable: true },
  { name: 'Adapt to Change', description: 'Successfully pivot when plans change', icon: '🔀', domain: 'career', category: 'adaptability', difficulty: 2, type: 'daily', gene_type: 'conduit_wire', xp: 30, gold: 15, repeatable: true },
  { name: 'Learn a New Tool', description: 'Spend time learning a new professional tool', icon: '🔧', domain: 'career', category: 'adaptability', difficulty: 2, type: 'daily', gene_type: 'conduit_wire', xp: 35, gold: 20, repeatable: true },
  { name: 'Finish What You Started', description: 'Complete a task from start to finish today', icon: '🏁', domain: 'career', category: 'delivery', difficulty: 2, type: 'daily', gene_type: 'output_valve', xp: 35, gold: 20, repeatable: true },
  { name: 'Clear the Backlog', description: 'Complete 3+ outstanding tasks', icon: '📋', domain: 'career', category: 'delivery', difficulty: 3, type: 'daily', gene_type: 'output_valve', xp: 50, gold: 25, repeatable: true },

  // --- New Career Mechanical Appendages ---
  { name: 'High-Volume Work Day', description: 'Complete 3x your normal task output in one day', icon: '🌪️', domain: 'career', category: 'delivery', difficulty: 4, type: 'daily', gene_type: 'turbine_arm', xp: 60, gold: 30, repeatable: true },
  { name: 'Automate a Task', description: 'Create automation for a repetitive process', icon: '🤖', domain: 'career', category: 'innovation', difficulty: 3, type: 'weekly', gene_type: 'turbine_arm', xp: 50, gold: 25, repeatable: true },
  { name: 'Detail-Oriented Review', description: 'Thoroughly review work for errors and polish', icon: '🔎', domain: 'career', category: 'practice', difficulty: 2, type: 'daily', gene_type: 'crane_claw', xp: 30, gold: 15, repeatable: true },
  { name: 'Precision Task', description: 'Complete work requiring extreme attention to detail', icon: '🎯', domain: 'career', category: 'practice', difficulty: 3, type: 'daily', gene_type: 'crane_claw', xp: 45, gold: 25, repeatable: true },

  // ===== FINANCE & WEALTH — GILT HORROR =====
  { name: 'Track Expenses', description: 'Log all spending for today', icon: '📝', domain: 'finance', category: 'tracking', difficulty: 1, type: 'daily', gene_type: 'coin_disc', xp: 20, gold: 10, repeatable: true },
  { name: 'Save Money', description: 'Put money into savings today', icon: '💰', domain: 'finance', category: 'saving', difficulty: 2, type: 'daily', gene_type: 'gold_scale', xp: 35, gold: 20, repeatable: true },
  { name: 'Budget Review', description: 'Review and adjust your budget', icon: '📊', domain: 'finance', category: 'planning', difficulty: 2, type: 'weekly', gene_type: 'ledger_glyph', xp: 40, gold: 20, repeatable: true },
  { name: 'No Impulse Buy', description: 'Resist an unnecessary purchase today', icon: '🛑', domain: 'finance', category: 'saving', difficulty: 2, type: 'daily', gene_type: 'vault_door', xp: 30, gold: 15, repeatable: true },
  { name: 'Research Investment', description: 'Learn about a new investment opportunity', icon: '📈', domain: 'finance', category: 'investing', difficulty: 2, type: 'daily', gene_type: 'investment_tendril', xp: 30, gold: 15, repeatable: true },
  { name: 'Savings Milestone', description: 'Hit a savings goal or milestone', icon: '🏦', domain: 'finance', category: 'boss', difficulty: 4, type: 'boss', gene_type: 'crown_jewel', xp: 150, gold: 100, repeatable: true },
  { name: 'Evaluate a Risk', description: 'Analyze the risk/reward of a financial decision', icon: '⚖️', domain: 'finance', category: 'analysis', difficulty: 2, type: 'daily', gene_type: 'debt_fang', xp: 30, gold: 15, repeatable: true },
  { name: 'Negotiate a Better Deal', description: 'Successfully negotiate a price or rate', icon: '🤝', domain: 'finance', category: 'negotiation', difficulty: 3, type: 'weekly', gene_type: 'trade_tendril', xp: 50, gold: 30, repeatable: true },
  { name: 'Compare Before Buying', description: 'Research alternatives before a purchase', icon: '🔍', domain: 'finance', category: 'analysis', difficulty: 1, type: 'daily', gene_type: 'debt_fang', xp: 20, gold: 10, repeatable: true },
  { name: 'Long-Term Investment', description: 'Make or maintain a long-term investment', icon: '💎', domain: 'finance', category: 'investing', difficulty: 3, type: 'weekly', gene_type: 'compound_crystal', xp: 50, gold: 25, repeatable: true },
  { name: 'Wait 24 Hours', description: 'Delay a non-essential purchase by 24 hours', icon: '⏰', domain: 'finance', category: 'saving', difficulty: 2, type: 'daily', gene_type: 'compound_crystal', xp: 30, gold: 15, repeatable: true },
  { name: 'Sell Something', description: 'Sell an unused item for extra income', icon: '🏷️', domain: 'finance', category: 'negotiation', difficulty: 2, type: 'weekly', gene_type: 'trade_tendril', xp: 40, gold: 20, repeatable: true },

  // --- New Finance Organs & Appendages ---
  { name: 'Find a Deal', description: 'Find and take advantage of a money-saving opportunity', icon: '🦅', domain: 'finance', category: 'saving', difficulty: 2, type: 'daily', gene_type: 'gilded_claw', xp: 30, gold: 20, repeatable: true },
  { name: 'Claim a Reward', description: 'Collect a cashback, reward, or benefit you earned', icon: '🏆', domain: 'finance', category: 'saving', difficulty: 1, type: 'daily', gene_type: 'gilded_claw', xp: 20, gold: 15, repeatable: true },
  { name: 'Build an Emergency Fund', description: 'Add money to your emergency savings', icon: '🏦', domain: 'finance', category: 'saving', difficulty: 2, type: 'weekly', gene_type: 'treasure_organ', xp: 40, gold: 25, repeatable: true },
  { name: 'Net Worth Review', description: 'Calculate and record your current net worth', icon: '📊', domain: 'finance', category: 'tracking', difficulty: 2, type: 'weekly', gene_type: 'treasure_organ', xp: 35, gold: 20, repeatable: true },

  // ===== SOCIAL & RELATIONSHIPS — HOLLOW SINGER =====
  { name: 'Reach Out', description: 'Message or call someone you care about', icon: '📱', domain: 'social', category: 'connection', difficulty: 1, type: 'daily', gene_type: 'mouth', xp: 20, gold: 10, repeatable: true },
  { name: 'Meet Someone New', description: 'Introduce yourself to someone new', icon: '👋', domain: 'social', category: 'expand', difficulty: 3, type: 'daily', gene_type: 'face_mask', xp: 40, gold: 20, repeatable: true },
  { name: 'Give a Presentation', description: 'Present or speak to a group', icon: '🎤', domain: 'social', category: 'speaking', difficulty: 4, type: 'weekly', gene_type: 'vocal_cord', xp: 60, gold: 30, repeatable: true },
  { name: 'Active Listening', description: 'Have a conversation focused on truly listening', icon: '👂', domain: 'social', category: 'empathy', difficulty: 1, type: 'daily', gene_type: 'echo_chamber', xp: 20, gold: 10, repeatable: true },
  { name: 'Group Activity', description: 'Participate in a team sport or group event', icon: '🤼', domain: 'social', category: 'team', difficulty: 2, type: 'daily', gene_type: 'harmony_thread', xp: 35, gold: 20, repeatable: true },
  { name: 'Follow Up', description: 'Follow up with someone you recently met', icon: '🔄', domain: 'social', category: 'maintain', difficulty: 1, type: 'daily', gene_type: 'memory_face', xp: 20, gold: 10, repeatable: true },
  { name: 'Social Butterfly', description: 'Complete 5 social tasks this week', icon: '🦋', domain: 'social', category: 'boss', difficulty: 4, type: 'boss', gene_type: 'vocal_cord', xp: 150, gold: 75, repeatable: true },
  { name: 'Be Vulnerable', description: 'Share something honest and personal with someone', icon: '💔', domain: 'social', category: 'authenticity', difficulty: 3, type: 'daily', gene_type: 'mirror_shard', xp: 40, gold: 20, repeatable: true },
  { name: 'Give Honest Feedback', description: 'Provide constructive and truthful feedback', icon: '🪞', domain: 'social', category: 'authenticity', difficulty: 2, type: 'daily', gene_type: 'mirror_shard', xp: 30, gold: 15, repeatable: true },
  { name: 'Motivate Someone', description: 'Actively encourage or inspire someone today', icon: '🔥', domain: 'social', category: 'leadership', difficulty: 2, type: 'daily', gene_type: 'pulse_drum', xp: 30, gold: 15, repeatable: true },
  { name: 'Lead a Group Activity', description: 'Organize and lead a group event or discussion', icon: '📢', domain: 'social', category: 'leadership', difficulty: 3, type: 'weekly', gene_type: 'pulse_drum', xp: 50, gold: 25, repeatable: true },
  { name: 'Check on Someone', description: 'Check in on someone who might need support', icon: '💌', domain: 'social', category: 'maintain', difficulty: 1, type: 'daily', gene_type: 'bond_marrow', xp: 20, gold: 10, repeatable: true },
  { name: 'Strengthen a Bond', description: 'Do something meaningful for a close relationship', icon: '🔗', domain: 'social', category: 'maintain', difficulty: 2, type: 'daily', gene_type: 'bond_marrow', xp: 35, gold: 20, repeatable: true },
  // --- New Social Organs & Appendages ---
  { name: 'Comfort Someone', description: 'Offer genuine emotional support to someone in need', icon: '🤗', domain: 'social', category: 'empathy', difficulty: 2, type: 'daily', gene_type: 'empathy_lobe', xp: 30, gold: 15, repeatable: true },
  { name: 'Walk in Their Shoes', description: 'Spend time understanding someone else\'s perspective', icon: '👟', domain: 'social', category: 'empathy', difficulty: 2, type: 'daily', gene_type: 'empathy_lobe', xp: 35, gold: 20, repeatable: true },
  { name: 'Share Your Story', description: 'Tell a meaningful personal story to someone', icon: '📢', domain: 'social', category: 'speaking', difficulty: 2, type: 'daily', gene_type: 'resonance_horn', xp: 30, gold: 15, repeatable: true },
  { name: 'Public Speaking Practice', description: 'Practice speaking clearly to a group or camera', icon: '🎙️', domain: 'social', category: 'speaking', difficulty: 3, type: 'daily', gene_type: 'resonance_horn', xp: 45, gold: 25, repeatable: true },
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
