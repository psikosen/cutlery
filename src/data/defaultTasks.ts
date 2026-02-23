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

  // --- Workout Exercises ---
  // Strength
  { name: '50 Crunches', description: 'Complete 50 crunches in any rep scheme', icon: '🔥', domain: 'health', category: 'strength', difficulty: 2, type: 'daily', gene_type: 'muscle_fiber', xp: 30, gold: 15, repeatable: true },
  { name: '100 Crunches', description: 'Crush 100 crunches — forge your core', icon: '🔥', domain: 'health', category: 'strength', difficulty: 3, type: 'daily', gene_type: 'muscle_fiber', xp: 50, gold: 25, repeatable: true },
  { name: 'Dumbbell Workout', description: 'Complete a full dumbbell training session', icon: '🏋️', domain: 'health', category: 'strength', difficulty: 3, type: 'daily', gene_type: 'muscle_fiber', xp: 50, gold: 25, repeatable: true },
  { name: 'Pull-ups', description: 'Complete a set of pull-ups (any rep scheme)', icon: '💪', domain: 'health', category: 'strength', difficulty: 3, type: 'daily', gene_type: 'muscle_fiber', xp: 45, gold: 25, repeatable: true },
  { name: 'Squats', description: 'Complete a squat session (bodyweight or weighted)', icon: '🦵', domain: 'health', category: 'strength', difficulty: 2, type: 'daily', gene_type: 'muscle_fiber', xp: 35, gold: 20, repeatable: true },
  { name: 'Bench Press', description: 'Complete a bench press session', icon: '🏋️', domain: 'health', category: 'strength', difficulty: 3, type: 'daily', gene_type: 'muscle_fiber', xp: 50, gold: 25, repeatable: true },
  { name: 'Deadlifts', description: 'Complete a deadlift session with proper form', icon: '🏋️', domain: 'health', category: 'strength', difficulty: 4, type: 'daily', gene_type: 'bone_plate', xp: 60, gold: 30, repeatable: true },
  { name: 'Resistance Band Training', description: 'Full resistance band workout session', icon: '🔗', domain: 'health', category: 'strength', difficulty: 2, type: 'daily', gene_type: 'tendon_whip', xp: 30, gold: 15, repeatable: true },
  { name: 'Kettlebell Swings', description: 'Complete a kettlebell swing session', icon: '🔔', domain: 'health', category: 'strength', difficulty: 3, type: 'daily', gene_type: 'muscle_fiber', xp: 45, gold: 25, repeatable: true },

  // Cardio
  { name: 'Aerobics Session', description: 'Complete a 30+ minute aerobics workout', icon: '🤸', domain: 'health', category: 'cardio', difficulty: 2, type: 'daily', gene_type: 'heart_pump', xp: 35, gold: 20, repeatable: true },
  { name: 'Jump Rope', description: 'Jump rope for 15+ minutes', icon: '⏭️', domain: 'health', category: 'cardio', difficulty: 2, type: 'daily', gene_type: 'vein_network', xp: 35, gold: 20, repeatable: true },
  { name: 'Swimming', description: 'Complete a swimming session (30+ minutes)', icon: '🏊', domain: 'health', category: 'cardio', difficulty: 3, type: 'daily', gene_type: 'vein_network', xp: 50, gold: 25, repeatable: true },
  { name: 'HIIT Workout', description: 'Complete a high-intensity interval training session', icon: '⚡', domain: 'health', category: 'cardio', difficulty: 3, type: 'daily', gene_type: 'heart_pump', xp: 50, gold: 25, repeatable: true },
  { name: 'Dancing Workout', description: 'Dance workout session for 30+ minutes', icon: '💃', domain: 'health', category: 'cardio', difficulty: 2, type: 'daily', gene_type: 'heart_pump', xp: 35, gold: 20, repeatable: true },
  { name: 'Stair Climbing', description: 'Climb stairs for 20+ minutes', icon: '🪜', domain: 'health', category: 'cardio', difficulty: 2, type: 'daily', gene_type: 'vein_network', xp: 35, gold: 20, repeatable: true },

  // Agility
  { name: 'Burpees', description: 'Complete a set of burpees (30+ reps)', icon: '🏃', domain: 'health', category: 'agility', difficulty: 3, type: 'daily', gene_type: 'nerve_bundle', xp: 45, gold: 25, repeatable: true },
  { name: 'Mountain Climbers', description: 'Complete mountain climbers for 10+ minutes', icon: '⛰️', domain: 'health', category: 'agility', difficulty: 2, type: 'daily', gene_type: 'nerve_bundle', xp: 30, gold: 15, repeatable: true },
  { name: 'Box Jumps', description: 'Complete a box jump session', icon: '📦', domain: 'health', category: 'agility', difficulty: 3, type: 'daily', gene_type: 'tendon_whip', xp: 45, gold: 25, repeatable: true },
  { name: 'Lunges', description: 'Complete a set of walking or stationary lunges', icon: '🦵', domain: 'health', category: 'agility', difficulty: 2, type: 'daily', gene_type: 'tendon_whip', xp: 30, gold: 15, repeatable: true },
  { name: 'Agility Ladder Drills', description: 'Complete footwork drills on an agility ladder', icon: '👟', domain: 'health', category: 'agility', difficulty: 2, type: 'daily', gene_type: 'nerve_bundle', xp: 35, gold: 20, repeatable: true },

  // Recovery
  { name: 'Foam Rolling', description: 'Foam roll major muscle groups for recovery', icon: '🧴', domain: 'health', category: 'recovery', difficulty: 1, type: 'daily', gene_type: 'blood_shard', xp: 20, gold: 10, repeatable: true },
  { name: 'Post-Workout Stretch', description: 'Complete a 10+ minute cooldown stretch', icon: '🧘', domain: 'health', category: 'recovery', difficulty: 1, type: 'daily', gene_type: 'organ_sac', xp: 20, gold: 10, repeatable: true },

  // --- Compounding Streak Challenges ---
  // Strength Streaks
  { name: '5-Day Push-up Streak', description: 'Do 20+ push-ups every day for 5 days straight', icon: '🔁', domain: 'health', category: 'boss', difficulty: 3, type: 'boss', gene_type: 'muscle_fiber', xp: 120, gold: 60, repeatable: true },
  { name: '7-Day Push-up Streak', description: 'Do 50+ push-ups every day for 7 days straight', icon: '🔁', domain: 'health', category: 'boss', difficulty: 4, type: 'boss', gene_type: 'muscle_fiber', xp: 200, gold: 100, repeatable: true },
  { name: '5-Day Crunch Streak', description: 'Do 30+ crunches every day for 5 days straight', icon: '🔁', domain: 'health', category: 'boss', difficulty: 3, type: 'boss', gene_type: 'muscle_fiber', xp: 120, gold: 60, repeatable: true },
  { name: '7-Day Crunch Streak', description: 'Do 50+ crunches every day for 7 days straight', icon: '🔁', domain: 'health', category: 'boss', difficulty: 4, type: 'boss', gene_type: 'bone_plate', xp: 200, gold: 100, repeatable: true },
  { name: '5-Day Squat Streak', description: 'Complete squats every day for 5 days straight', icon: '🔁', domain: 'health', category: 'boss', difficulty: 3, type: 'boss', gene_type: 'muscle_fiber', xp: 120, gold: 60, repeatable: true },
  { name: '5-Day Pull-up Streak', description: 'Do pull-ups every day for 5 days straight', icon: '🔁', domain: 'health', category: 'boss', difficulty: 4, type: 'boss', gene_type: 'claw_hook', xp: 150, gold: 75, repeatable: true },
  { name: '5-Day Dumbbell Streak', description: 'Dumbbell workout every day for 5 days straight', icon: '🔁', domain: 'health', category: 'boss', difficulty: 4, type: 'boss', gene_type: 'muscle_fiber', xp: 150, gold: 75, repeatable: true },
  { name: '5-Day Plank Streak', description: 'Hold a 2+ min plank every day for 5 days straight', icon: '🔁', domain: 'health', category: 'boss', difficulty: 3, type: 'boss', gene_type: 'bone_plate', xp: 120, gold: 60, repeatable: true },

  // Cardio Streaks
  { name: '5-Day Running Streak', description: 'Run 30+ minutes every day for 5 days straight', icon: '🔁', domain: 'health', category: 'boss', difficulty: 4, type: 'boss', gene_type: 'vein_network', xp: 150, gold: 75, repeatable: true },
  { name: '7-Day Cardio Streak', description: 'Complete any cardio session every day for 7 days', icon: '🔁', domain: 'health', category: 'boss', difficulty: 4, type: 'boss', gene_type: 'heart_pump', xp: 200, gold: 100, repeatable: true },
  { name: '5-Day Aerobics Streak', description: 'Aerobics session every day for 5 days straight', icon: '🔁', domain: 'health', category: 'boss', difficulty: 3, type: 'boss', gene_type: 'heart_pump', xp: 120, gold: 60, repeatable: true },
  { name: '5-Day HIIT Streak', description: 'HIIT workout every day for 5 days straight', icon: '🔁', domain: 'health', category: 'boss', difficulty: 4, type: 'boss', gene_type: 'heart_pump', xp: 150, gold: 75, repeatable: true },
  { name: '5-Day Jump Rope Streak', description: 'Jump rope 15+ min every day for 5 days straight', icon: '🔁', domain: 'health', category: 'boss', difficulty: 3, type: 'boss', gene_type: 'vein_network', xp: 120, gold: 60, repeatable: true },
  { name: '5-Day Swimming Streak', description: 'Swim every day for 5 days straight', icon: '🔁', domain: 'health', category: 'boss', difficulty: 4, type: 'boss', gene_type: 'lung_bellows', xp: 150, gold: 75, repeatable: true },
  { name: '5-Day Cycling Streak', description: 'Cycle 30+ min every day for 5 days straight', icon: '🔁', domain: 'health', category: 'boss', difficulty: 3, type: 'boss', gene_type: 'vein_network', xp: 120, gold: 60, repeatable: true },

  // Agility & Endurance Streaks
  { name: '5-Day Burpee Streak', description: 'Do 30+ burpees every day for 5 days straight', icon: '🔁', domain: 'health', category: 'boss', difficulty: 4, type: 'boss', gene_type: 'nerve_bundle', xp: 150, gold: 75, repeatable: true },
  { name: '7-Day Stretching Streak', description: 'Stretch 15+ min every day for 7 days straight', icon: '🔁', domain: 'health', category: 'boss', difficulty: 2, type: 'boss', gene_type: 'tendon_whip', xp: 100, gold: 50, repeatable: true },
  { name: '7-Day Yoga Streak', description: 'Complete a yoga session every day for 7 days', icon: '🔁', domain: 'health', category: 'boss', difficulty: 3, type: 'boss', gene_type: 'tendon_whip', xp: 150, gold: 75, repeatable: true },

  // Recovery & Wellness Streaks
  { name: '7-Day Hydration Streak', description: 'Drink 8+ glasses of water every day for 7 days', icon: '🔁', domain: 'health', category: 'boss', difficulty: 2, type: 'boss', gene_type: 'organ_sac', xp: 100, gold: 50, repeatable: true },
  { name: '5-Day Clean Eating Streak', description: 'Eat only clean meals every day for 5 days', icon: '🔁', domain: 'health', category: 'boss', difficulty: 3, type: 'boss', gene_type: 'organ_sac', xp: 120, gold: 60, repeatable: true },
  { name: '7-Day Sleep Streak', description: 'Get 8+ hours of sleep every night for 7 days', icon: '🔁', domain: 'health', category: 'boss', difficulty: 3, type: 'boss', gene_type: 'blood_shard', xp: 150, gold: 75, repeatable: true },

  // Ultimate Compounding Challenges
  { name: 'Full Body 7-Day Gauntlet', description: 'Push-ups, squats, crunches, and plank every day for 7 days', icon: '👑', domain: 'health', category: 'boss', difficulty: 5, type: 'boss', gene_type: 'tooth_row', xp: 300, gold: 150, repeatable: true },
  { name: '14-Day Warrior Streak', description: 'Complete any workout every day for 14 days straight', icon: '👑', domain: 'health', category: 'boss', difficulty: 5, type: 'boss', gene_type: 'tooth_row', xp: 400, gold: 200, repeatable: true },
  { name: '30-Day Iron Discipline', description: 'Work out every single day for 30 days — no exceptions', icon: '👑', domain: 'health', category: 'boss', difficulty: 5, type: 'boss', gene_type: 'marrow_core', xp: 750, gold: 400, repeatable: true },

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
  // ===== RESEARCH EXPANSION PACK — 40 GENES =====
  // Health (7)
  { name: 'Sprint Power Intervals', description: 'Complete 8 sprint intervals with full rest', icon: '🏃', domain: 'health', category: 'power', difficulty: 3, type: 'daily', gene_type: 'actn3_fiber', xp: 45, gold: 25, repeatable: true },
  { name: 'Resistance Overload Set', description: 'Push one major lift with progressive overload', icon: '🏋️', domain: 'health', category: 'strength', difficulty: 3, type: 'daily', gene_type: 'mstn_inhibitor', xp: 45, gold: 25, repeatable: true },
  { name: 'Collagen Support Meal', description: 'Eat a recovery-focused meal with protein + micronutrients', icon: '🍲', domain: 'health', category: 'recovery', difficulty: 1, type: 'daily', gene_type: 'col1a1_weave', xp: 20, gold: 10, repeatable: true },
  { name: 'Zone 2 Cardio Session', description: 'Sustain low-intensity cardio for 40+ minutes', icon: '🚴', domain: 'health', category: 'cardio', difficulty: 2, type: 'daily', gene_type: 'vegf_capillary', xp: 35, gold: 20, repeatable: true },
  { name: 'Long Endurance Session', description: 'Complete one 60+ minute endurance workout', icon: '🥾', domain: 'health', category: 'endurance', difficulty: 3, type: 'weekly', gene_type: 'ppargc1a_core', xp: 50, gold: 30, repeatable: true },
  { name: 'Protein Recovery Window', description: 'Refuel with recovery nutrition within 60 minutes of training', icon: '🥤', domain: 'health', category: 'recovery', difficulty: 1, type: 'daily', gene_type: 'igf1_driver', xp: 20, gold: 10, repeatable: true },
  { name: 'Nitric Oxide Walk', description: 'Do a brisk 20-minute post-meal walk', icon: '🚶', domain: 'health', category: 'cardio', difficulty: 1, type: 'daily', gene_type: 'nos3_flow', xp: 20, gold: 10, repeatable: true },
  // Mind (7)
  { name: 'Learn and Recall Drill', description: 'Study new material, then recall it without notes', icon: '🧠', domain: 'mind', category: 'learning', difficulty: 2, type: 'daily', gene_type: 'bdnf_burst', xp: 35, gold: 20, repeatable: true },
  { name: 'Decision Journal Entry', description: 'Log one key decision and your reasoning process', icon: '📓', domain: 'mind', category: 'reflection', difficulty: 1, type: 'daily', gene_type: 'comt_filter', xp: 20, gold: 10, repeatable: true },
  { name: 'Hard Concept Review', description: 'Revisit one difficult concept until you can teach it', icon: '📘', domain: 'mind', category: 'problemsolving', difficulty: 3, type: 'daily', gene_type: 'grin2b_gate', xp: 45, gold: 25, repeatable: true },
  { name: 'Mood Tracking Check-in', description: 'Track mood and triggers at 3 points in the day', icon: '📈', domain: 'mind', category: 'reflection', difficulty: 1, type: 'daily', gene_type: 'slc6a4_tide', xp: 20, gold: 10, repeatable: true },
  { name: 'Speak a New Phrase', description: 'Practice language output by speaking a new phrase set', icon: '🗣️', domain: 'mind', category: 'learning', difficulty: 2, type: 'daily', gene_type: 'foxp2_phrase', xp: 30, gold: 15, repeatable: true },
  { name: 'Memory Palace Practice', description: 'Encode and recall 10 items with a memory palace', icon: '🏛️', domain: 'mind', category: 'memory', difficulty: 2, type: 'daily', gene_type: 'wwc1_trace', xp: 30, gold: 15, repeatable: true },
  { name: 'Deep Focus Sprint', description: 'Do a distraction-free 45-minute focus sprint', icon: '🎯', domain: 'mind', category: 'focus', difficulty: 2, type: 'daily', gene_type: 'chrna4_focus', xp: 35, gold: 20, repeatable: true },
  // Discipline (6)
  { name: 'Consistent Wake Time', description: 'Wake within the same 20-minute window as planned', icon: '⏰', domain: 'discipline', category: 'routine', difficulty: 2, type: 'daily', gene_type: 'clock_anchor', xp: 30, gold: 15, repeatable: true },
  { name: 'Sunlight After Wake', description: 'Get outdoor light within 30 minutes of waking', icon: '🌤️', domain: 'discipline', category: 'routine', difficulty: 1, type: 'daily', gene_type: 'bmal1_cycle', xp: 20, gold: 10, repeatable: true },
  { name: 'Morning Momentum Block', description: 'Finish your first important task before noon', icon: '🚀', domain: 'discipline', category: 'routine', difficulty: 2, type: 'daily', gene_type: 'per3_stride', xp: 30, gold: 15, repeatable: true },
  { name: 'Late-Night Screen Cutoff', description: 'Stop screens 60 minutes before sleep', icon: '🌙', domain: 'discipline', category: 'resistance', difficulty: 2, type: 'daily', gene_type: 'cry1_quiet', xp: 30, gold: 15, repeatable: true },
  { name: 'Caffeine Curfew', description: 'No caffeine after your planned cutoff time', icon: '☕', domain: 'discipline', category: 'resistance', difficulty: 1, type: 'daily', gene_type: 'adora2a_brake', xp: 20, gold: 10, repeatable: true },
  { name: 'Stress Reset Breathwork', description: 'Complete a 10-minute stress regulation breathing session', icon: '🫁', domain: 'discipline', category: 'mindfulness', difficulty: 1, type: 'daily', gene_type: 'nr3c1_steel', xp: 20, gold: 10, repeatable: true },
  // Career (7)
  { name: 'Ship a Micro-Feature', description: 'Deliver one small but complete piece of work', icon: '📦', domain: 'career', category: 'delivery', difficulty: 3, type: 'daily', gene_type: 'creb1_forge', xp: 45, gold: 25, repeatable: true },
  { name: 'High-Output Work Block', description: 'Complete a high-intensity 90-minute work block', icon: '⚙️', domain: 'career', category: 'work', difficulty: 3, type: 'daily', gene_type: 'mtor_engine', xp: 45, gold: 25, repeatable: true },
  { name: 'Energy Audit and Plan', description: 'Adjust schedule based on your energy peaks and dips', icon: '🔋', domain: 'career', category: 'planning', difficulty: 2, type: 'daily', gene_type: 'ampk_switch', xp: 30, gold: 15, repeatable: true },
  { name: 'Error-Proofing Pass', description: 'Do a structured QA pass before shipping', icon: '🛡️', domain: 'career', category: 'quality', difficulty: 2, type: 'daily', gene_type: 'nrf2_shield', xp: 30, gold: 15, repeatable: true },
  { name: 'Stretch Goal Attempt', description: 'Attempt one task beyond your current comfort level', icon: '🧗', domain: 'career', category: 'growth', difficulty: 3, type: 'daily', gene_type: 'hif1a_drive', xp: 45, gold: 25, repeatable: true },
  { name: 'Legacy Cleanup Task', description: 'Improve old work with refactor/docs/cleanup', icon: '🧹', domain: 'career', category: 'maintenance', difficulty: 2, type: 'daily', gene_type: 'klotho_thread', xp: 30, gold: 15, repeatable: true },
  { name: 'Silent Focus Block', description: 'Work 60 minutes in complete silence and no notifications', icon: '🔕', domain: 'career', category: 'focus', difficulty: 2, type: 'daily', gene_type: 'sirt1_focus', xp: 35, gold: 20, repeatable: true },
  // Finance (6)
  { name: 'Portfolio Risk Check', description: 'Review allocation and risk exposure', icon: '📉', domain: 'finance', category: 'analysis', difficulty: 2, type: 'weekly', gene_type: 'apoe_vault', xp: 40, gold: 20, repeatable: true },
  { name: 'Automated Transfer Setup', description: 'Set or verify an automatic saving/investing transfer', icon: '🔁', domain: 'finance', category: 'saving', difficulty: 2, type: 'weekly', gene_type: 'lpl_stream', xp: 35, gold: 20, repeatable: true },
  { name: 'Fee Optimization Review', description: 'Check for hidden fees and lower-cost alternatives', icon: '🧾', domain: 'finance', category: 'analysis', difficulty: 2, type: 'daily', gene_type: 'abca1_cache', xp: 30, gold: 15, repeatable: true },
  { name: 'Subscription Burn-down', description: 'Cancel one unused recurring expense', icon: '🔥', domain: 'finance', category: 'saving', difficulty: 2, type: 'daily', gene_type: 'cpt1_furnace', xp: 30, gold: 15, repeatable: true },
  { name: 'Reinvest Gains', description: 'Move earned surplus toward long-term goals', icon: '📈', domain: 'finance', category: 'investing', difficulty: 2, type: 'daily', gene_type: 'ppara_yield', xp: 35, gold: 20, repeatable: true },
  { name: 'Price Comparison Challenge', description: 'Find the highest-value option before purchase', icon: '🪙', domain: 'finance', category: 'analysis', difficulty: 1, type: 'daily', gene_type: 'hmgcr_mint', xp: 20, gold: 10, repeatable: true },
  // Social (7)
  { name: 'Meaningful Support Moment', description: 'Offer direct support or care to someone today', icon: '🤝', domain: 'social', category: 'empathy', difficulty: 1, type: 'daily', gene_type: 'oxtr_bridge', xp: 20, gold: 10, repeatable: true },
  { name: 'Community Contribution', description: 'Contribute to a group, family, or community effort', icon: '🏘️', domain: 'social', category: 'team', difficulty: 2, type: 'daily', gene_type: 'avpr1a_signal', xp: 30, gold: 15, repeatable: true },
  { name: 'Warm Follow-up Message', description: 'Send a genuine follow-up message to maintain connection', icon: '💬', domain: 'social', category: 'maintain', difficulty: 1, type: 'daily', gene_type: 'cd38_resonance', xp: 20, gold: 10, repeatable: true },
  { name: 'Repair a Misunderstanding', description: 'Clarify and repair one social miscommunication', icon: '🧩', domain: 'social', category: 'authenticity', difficulty: 3, type: 'daily', gene_type: 'shank3_mesh', xp: 40, gold: 20, repeatable: true },
  { name: 'Two-Way Dialogue Practice', description: 'Have a balanced conversation with active turn-taking', icon: '🗨️', domain: 'social', category: 'speaking', difficulty: 2, type: 'daily', gene_type: 'cntnap2_dialogue', xp: 30, gold: 15, repeatable: true },
  { name: 'Group Sync Check-in', description: 'Coordinate plans with a group clearly and calmly', icon: '📡', domain: 'social', category: 'team', difficulty: 2, type: 'daily', gene_type: 'grin2a_sync', xp: 30, gold: 15, repeatable: true },
  { name: 'Calm Conflict Response', description: 'Respond to a tense moment with calm and composure', icon: '🕊️', domain: 'social', category: 'empathy', difficulty: 2, type: 'daily', gene_type: 'gabra2_calm', xp: 30, gold: 15, repeatable: true },

  // ===== LIVE RESEARCH QUEST PACK (CDC/AHA/SLEEP/CFPB/APA) =====
  // Health
  { name: '150-Minute Movement Week', description: 'Accumulate 150+ minutes of moderate cardio this week', icon: '🏃', domain: 'health', category: 'cardio', difficulty: 3, type: 'weekly', gene_type: 'vegf_capillary', xp: 55, gold: 30, repeatable: true },
  { name: 'Strength Days x2', description: 'Complete at least two muscle-strengthening sessions this week', icon: '🏋️', domain: 'health', category: 'strength', difficulty: 3, type: 'weekly', gene_type: 'mstn_inhibitor', xp: 55, gold: 30, repeatable: true },
  { name: 'Movement Snacks x3', description: 'Do three separate 10-minute movement breaks today', icon: '⚡', domain: 'health', category: 'cardio', difficulty: 2, type: 'daily', gene_type: 'nos3_flow', xp: 35, gold: 20, repeatable: true },
  { name: 'Post-Meal Walk Combo', description: 'Take a 10+ minute walk after two different meals today', icon: '🚶', domain: 'health', category: 'recovery', difficulty: 2, type: 'daily', gene_type: 'nos3_flow', xp: 30, gold: 15, repeatable: true },
  { name: 'Limit Sedentary Streaks', description: 'Break up long sitting periods with movement every hour', icon: '🧍', domain: 'health', category: 'endurance', difficulty: 2, type: 'daily', gene_type: 'ppargc1a_core', xp: 35, gold: 20, repeatable: true },

  // Mind
  { name: 'Learn-Retest Loop', description: 'Study for 25 minutes, then self-test from memory', icon: '🧠', domain: 'mind', category: 'learning', difficulty: 2, type: 'daily', gene_type: 'bdnf_burst', xp: 35, gold: 20, repeatable: true },
  { name: 'Focused Reading Block', description: 'Read for 20 minutes with phone notifications off', icon: '📚', domain: 'mind', category: 'reading', difficulty: 1, type: 'daily', gene_type: 'wwc1_trace', xp: 25, gold: 12, repeatable: true },
  { name: 'Hard Problem Round', description: 'Solve one challenging problem without using hints first', icon: '🧩', domain: 'mind', category: 'problemsolving', difficulty: 3, type: 'daily', gene_type: 'grin2b_gate', xp: 45, gold: 25, repeatable: true },
  { name: 'Language Recall Burst', description: 'Practice speaking and recalling 15 new words or phrases', icon: '🗣️', domain: 'mind', category: 'learning', difficulty: 2, type: 'daily', gene_type: 'foxp2_phrase', xp: 35, gold: 20, repeatable: true },

  // Discipline
  { name: 'Sleep 7+ Hours', description: 'Get at least 7 hours of sleep tonight', icon: '🌙', domain: 'discipline', category: 'routine', difficulty: 2, type: 'daily', gene_type: 'per3_stride', xp: 30, gold: 15, repeatable: true },
  { name: 'Fixed Bedtime Window', description: 'Go to bed within your planned 30-minute bedtime window', icon: '🛌', domain: 'discipline', category: 'routine', difficulty: 2, type: 'daily', gene_type: 'clock_anchor', xp: 30, gold: 15, repeatable: true },
  { name: 'Evening Wind-Down 30', description: 'Do a 30-minute pre-sleep wind-down routine', icon: '🕯️', domain: 'discipline', category: 'mindfulness', difficulty: 2, type: 'daily', gene_type: 'cry1_quiet', xp: 30, gold: 15, repeatable: true },
  { name: 'Caffeine Cutoff Hold', description: 'Avoid caffeine at least 8 hours before sleep', icon: '☕', domain: 'discipline', category: 'resistance', difficulty: 1, type: 'daily', gene_type: 'adora2a_brake', xp: 20, gold: 10, repeatable: true },
  { name: 'Morning Light + Night Dim', description: 'Get morning daylight and dim screens before bed', icon: '🌤️', domain: 'discipline', category: 'routine', difficulty: 2, type: 'daily', gene_type: 'bmal1_cycle', xp: 30, gold: 15, repeatable: true },

  // Career
  { name: 'Dual Deep-Work Blocks', description: 'Complete two focused 45-minute work blocks today', icon: '🎯', domain: 'career', category: 'focus', difficulty: 3, type: 'daily', gene_type: 'sirt1_focus', xp: 45, gold: 25, repeatable: true },
  { name: 'Single-Task Sprint', description: 'Work 30 minutes on one task with no context switching', icon: '🔕', domain: 'career', category: 'work', difficulty: 2, type: 'daily', gene_type: 'ampk_switch', xp: 30, gold: 15, repeatable: true },
  { name: 'Ship + Verify', description: 'Deliver one task and run a full quality check before done', icon: '✅', domain: 'career', category: 'quality', difficulty: 2, type: 'daily', gene_type: 'nrf2_shield', xp: 35, gold: 20, repeatable: true },
  { name: 'Daily Process Upgrade', description: 'Improve one repeatable workflow by documenting or automating it', icon: '⚙️', domain: 'career', category: 'innovation', difficulty: 3, type: 'weekly', gene_type: 'creb1_forge', xp: 50, gold: 25, repeatable: true },

  // Finance
  { name: 'Full Expense Capture', description: 'Track every purchase made today', icon: '🧾', domain: 'finance', category: 'tracking', difficulty: 1, type: 'daily', gene_type: 'abca1_cache', xp: 25, gold: 12, repeatable: true },
  { name: '48-Hour Purchase Pause', description: 'Delay one non-essential purchase for at least 48 hours', icon: '⏳', domain: 'finance', category: 'saving', difficulty: 2, type: 'daily', gene_type: 'hmgcr_mint', xp: 30, gold: 15, repeatable: true },
  { name: 'Emergency Buffer Deposit', description: 'Contribute to emergency savings this week', icon: '🏦', domain: 'finance', category: 'saving', difficulty: 2, type: 'weekly', gene_type: 'apoe_vault', xp: 40, gold: 22, repeatable: true },
  { name: 'Subscription Audit Sweep', description: 'Review recurring charges and cancel or downgrade one', icon: '📉', domain: 'finance', category: 'analysis', difficulty: 2, type: 'weekly', gene_type: 'cpt1_furnace', xp: 40, gold: 22, repeatable: true },

  // Social
  { name: '10-Minute Connection Call', description: 'Have a focused voice call with a friend or family member', icon: '📞', domain: 'social', category: 'connection', difficulty: 1, type: 'daily', gene_type: 'oxtr_bridge', xp: 25, gold: 12, repeatable: true },
  { name: 'Appreciation Message', description: 'Send one specific gratitude message to someone', icon: '💌', domain: 'social', category: 'maintain', difficulty: 1, type: 'daily', gene_type: 'cd38_resonance', xp: 25, gold: 12, repeatable: true },
  { name: 'Ask Then Listen', description: 'Ask one meaningful question and listen without interrupting', icon: '👂', domain: 'social', category: 'empathy', difficulty: 2, type: 'daily', gene_type: 'gabra2_calm', xp: 30, gold: 15, repeatable: true },
  { name: 'Community Help Action', description: 'Do one concrete action that helps a group or community', icon: '🤝', domain: 'social', category: 'team', difficulty: 2, type: 'weekly', gene_type: 'avpr1a_signal', xp: 40, gold: 22, repeatable: true },

  // ===== EU + CENTENARIAN NUTRITION PACK =====
  // Health
  { name: 'Lentil Anchor Meal', description: 'Eat one meal today centered on lentils, beans or chickpeas', icon: '🥣', domain: 'health', category: 'nutrition', difficulty: 1, type: 'daily', gene_type: 'nos3_flow', xp: 25, gold: 12, repeatable: true },
  { name: 'Pulse Rhythm x4', description: 'Hit 4 servings of legumes this week', icon: '🫘', domain: 'health', category: 'nutrition', difficulty: 3, type: 'weekly', gene_type: 'vegf_capillary', xp: 50, gold: 28, repeatable: true },
  { name: '400g Produce Floor', description: 'Reach at least 400 g of fruits + vegetables today', icon: '🥬', domain: 'health', category: 'recovery', difficulty: 2, type: 'daily', gene_type: 'col1a1_weave', xp: 30, gold: 15, repeatable: true },
  { name: 'Fibre 25 Target', description: 'Reach at least 25 g naturally occurring dietary fibre today', icon: '🌾', domain: 'health', category: 'recovery', difficulty: 2, type: 'daily', gene_type: 'organ_sac', xp: 30, gold: 15, repeatable: true },
  { name: 'Fish Day', description: 'Eat one fish-forward meal this week (preferably oily fish)', icon: '🐟', domain: 'health', category: 'cardio', difficulty: 2, type: 'weekly', gene_type: 'heart_pump', xp: 35, gold: 20, repeatable: true },
  { name: 'Unsalted Nut Handful', description: 'Have a 15-30 g serving of unsalted nuts today', icon: '🥜', domain: 'health', category: 'recovery', difficulty: 1, type: 'daily', gene_type: 'igf1_driver', xp: 20, gold: 10, repeatable: true },

  // Discipline
  { name: 'Salt Guard <5g', description: 'Keep total salt intake under 5 g for today', icon: '🧂', domain: 'discipline', category: 'resistance', difficulty: 3, type: 'daily', gene_type: 'adora2a_brake', xp: 35, gold: 20, repeatable: true },
  { name: 'Sugar Ceiling', description: 'Keep free/added sugar below your planned cap for the day', icon: '🍬', domain: 'discipline', category: 'resistance', difficulty: 3, type: 'daily', gene_type: 'cry1_quiet', xp: 35, gold: 20, repeatable: true },
  { name: '80% Full Rule', description: 'Stop eating when comfortably full instead of stuffed', icon: '🎚️', domain: 'discipline', category: 'mindfulness', difficulty: 2, type: 'daily', gene_type: 'clock_anchor', xp: 30, gold: 15, repeatable: true },
  { name: 'Hydration Floor', description: 'Hit your daily hydration target (water-first)', icon: '🚰', domain: 'discipline', category: 'routine', difficulty: 1, type: 'daily', gene_type: 'bmal1_cycle', xp: 20, gold: 10, repeatable: true },

  // Mind
  { name: 'Label Intel Run', description: 'Read labels on 3 foods and compare sugar/salt/fibre quality', icon: '🏷️', domain: 'mind', category: 'learning', difficulty: 1, type: 'daily', gene_type: 'chrna4_focus', xp: 20, gold: 10, repeatable: true },
  { name: 'Plant Variety 10', description: 'Eat 10 different plant foods today', icon: '🌈', domain: 'mind', category: 'memory', difficulty: 3, type: 'daily', gene_type: 'wwc1_trace', xp: 45, gold: 25, repeatable: true },
  { name: 'Legume Recipe Mastery', description: 'Learn and cook one new bean/lentil recipe', icon: '📖', domain: 'mind', category: 'learning', difficulty: 2, type: 'weekly', gene_type: 'foxp2_phrase', xp: 40, gold: 20, repeatable: true },
  { name: 'Mediterranean Plate Build', description: 'Build one plate around veg + whole grains + legumes + healthy fat', icon: '🫒', domain: 'mind', category: 'problemsolving', difficulty: 2, type: 'daily', gene_type: 'grin2b_gate', xp: 35, gold: 20, repeatable: true },

  // Career
  { name: 'Meal Prep Sprint', description: 'Prep 3 whole-food meals in one focused block', icon: '🍱', domain: 'career', category: 'delivery', difficulty: 3, type: 'weekly', gene_type: 'output_valve', xp: 50, gold: 25, repeatable: true },
  { name: 'Batch-Cook Pulses', description: 'Cook a batch of legumes for upcoming meals', icon: '🧑‍🍳', domain: 'career', category: 'work', difficulty: 2, type: 'weekly', gene_type: 'creb1_forge', xp: 35, gold: 20, repeatable: true },
  { name: 'Lunch Upgrade', description: 'Replace one ultra-processed lunch with a whole-food option', icon: '🥗', domain: 'career', category: 'quality', difficulty: 2, type: 'daily', gene_type: 'nrf2_shield', xp: 30, gold: 15, repeatable: true },
  { name: 'Pantry System Build', description: 'Set up a reusable shopping + pantry checklist for healthy staples', icon: '🗂️', domain: 'career', category: 'planning', difficulty: 2, type: 'weekly', gene_type: 'ampk_switch', xp: 35, gold: 20, repeatable: true },

  // Finance
  { name: 'Protein Swap Savings', description: 'Swap one red/processed meat meal for legumes and track money saved', icon: '💸', domain: 'finance', category: 'saving', difficulty: 2, type: 'daily', gene_type: 'hmgcr_mint', xp: 30, gold: 18, repeatable: true },
  { name: 'Centenarian Basket Budget', description: 'Buy legumes, whole grains and produce within your planned budget', icon: '🛒', domain: 'finance', category: 'planning', difficulty: 2, type: 'weekly', gene_type: 'abca1_cache', xp: 40, gold: 24, repeatable: true },
  { name: 'Low-Salt Shop Pass', description: 'Choose lower-sodium versions for at least 3 staples while shopping', icon: '🧾', domain: 'finance', category: 'analysis', difficulty: 2, type: 'weekly', gene_type: 'apoe_vault', xp: 35, gold: 20, repeatable: true },
  { name: 'Waste-Free Pot', description: 'Cook with existing pantry leftovers and avoid food waste today', icon: '♻️', domain: 'finance', category: 'saving', difficulty: 2, type: 'daily', gene_type: 'cpt1_furnace', xp: 30, gold: 18, repeatable: true },

  // Social
  { name: 'Shared Bean Table', description: 'Share a legume-based meal with family or friends', icon: '🍲', domain: 'social', category: 'connection', difficulty: 2, type: 'weekly', gene_type: 'oxtr_bridge', xp: 35, gold: 20, repeatable: true },
  { name: 'Potluck Contribution', description: 'Bring a whole-food dish (beans/lentils/veg) to a group setting', icon: '🥘', domain: 'social', category: 'team', difficulty: 3, type: 'weekly', gene_type: 'avpr1a_signal', xp: 45, gold: 25, repeatable: true },
  { name: 'Elder Recipe Archive', description: 'Ask an elder for a traditional longevity recipe and document it', icon: '📜', domain: 'social', category: 'maintain', difficulty: 2, type: 'weekly', gene_type: 'cd38_resonance', xp: 35, gold: 20, repeatable: true },
  { name: 'Slow Table 20', description: 'Have one phone-free shared meal of at least 20 minutes', icon: '🕯️', domain: 'social', category: 'empathy', difficulty: 2, type: 'daily', gene_type: 'gabra2_calm', xp: 30, gold: 15, repeatable: true },

  // ===== NUTRITION V2 + MEDITERRANEAN ARC EXPANSION =====
  // Nutrition V2 targets
  { name: 'Produce Rainbow 5', description: 'Eat at least 5 different colors of fruits/vegetables today', icon: '🌈', domain: 'health', category: 'nutrition', difficulty: 2, type: 'daily', gene_type: 'col1a1_weave', xp: 30, gold: 15, repeatable: true },
  { name: 'Fiber 30 Stretch', description: 'Reach 30 g of natural fiber today', icon: '🌾', domain: 'health', category: 'nutrition', difficulty: 3, type: 'daily', gene_type: 'organ_sac', xp: 35, gold: 18, repeatable: true },
  { name: 'Dual Legume Servings', description: 'Eat legumes in two separate meals today', icon: '🫘', domain: 'health', category: 'nutrition', difficulty: 2, type: 'daily', gene_type: 'nos3_flow', xp: 30, gold: 15, repeatable: true },
  { name: 'Olive First Fat', description: 'Use olive oil as your primary added fat for the day', icon: '🫒', domain: 'health', category: 'nutrition', difficulty: 2, type: 'daily', gene_type: 'heart_pump', xp: 28, gold: 14, repeatable: true },
  { name: 'Zero Sugary Drinks', description: 'Avoid all sugary drinks for the full day', icon: '🚫', domain: 'discipline', category: 'resistance', difficulty: 2, type: 'daily', gene_type: 'cry1_quiet', xp: 30, gold: 15, repeatable: true },
  { name: 'Herb Salt Trade', description: 'Replace salt-heavy seasoning with herbs/spices in two meals', icon: '🌿', domain: 'discipline', category: 'resistance', difficulty: 2, type: 'daily', gene_type: 'adora2a_brake', xp: 30, gold: 15, repeatable: true },
  { name: 'Whole Grain Swap', description: 'Swap one refined grain choice for a whole-grain option', icon: '🌾', domain: 'discipline', category: 'routine', difficulty: 1, type: 'daily', gene_type: 'clock_anchor', xp: 22, gold: 10, repeatable: true },
  { name: 'Water Before Meals', description: 'Drink water before each main meal today', icon: '🚰', domain: 'discipline', category: 'routine', difficulty: 1, type: 'daily', gene_type: 'bmal1_cycle', xp: 20, gold: 10, repeatable: true },
  { name: 'Label Sodium Scan', description: 'Compare sodium and sugar on 5 packaged items', icon: '🏷️', domain: 'mind', category: 'learning', difficulty: 1, type: 'daily', gene_type: 'chrna4_focus', xp: 22, gold: 10, repeatable: true },
  { name: 'Mediterranean Photo Log', description: 'Log one Mediterranean-style plate and explain your macro balance', icon: '📸', domain: 'mind', category: 'memory', difficulty: 2, type: 'daily', gene_type: 'wwc1_trace', xp: 30, gold: 15, repeatable: true },
  { name: 'Pantry Pulse Prep', description: 'Batch-cook legumes and store portions for the next 3 days', icon: '🍱', domain: 'career', category: 'planning', difficulty: 2, type: 'weekly', gene_type: 'ampk_switch', xp: 40, gold: 20, repeatable: true },
  { name: 'Seasonal Basket Budget', description: 'Build a produce+legume basket under your weekly food budget', icon: '🛒', domain: 'finance', category: 'planning', difficulty: 2, type: 'weekly', gene_type: 'abca1_cache', xp: 42, gold: 24, repeatable: true },
  { name: 'Shared Longevity Meal', description: 'Host or join one shared whole-food meal this week', icon: '🍽️', domain: 'social', category: 'connection', difficulty: 2, type: 'weekly', gene_type: 'oxtr_bridge', xp: 36, gold: 20, repeatable: true },

  // Mediterranean healthy-aging arc (weekly questline)
  { name: 'Mediterranean Arc I: Foundation Plate', description: 'Build 3 plates this week with vegetables + legumes + whole grains + olive oil', icon: '🧩', domain: 'health', category: 'arc', difficulty: 3, type: 'weekly', gene_type: 'vegf_capillary', xp: 55, gold: 30, repeatable: true },
  { name: 'Mediterranean Arc II: Pulse Engine', description: 'Hit 5 legume servings across this week', icon: '⚙️', domain: 'health', category: 'arc', difficulty: 3, type: 'weekly', gene_type: 'nos3_flow', xp: 55, gold: 30, repeatable: true },
  { name: 'Mediterranean Arc III: Fish + Olive Week', description: 'Complete 2 fish meals and keep olive oil as your main added fat', icon: '🐟', domain: 'health', category: 'arc', difficulty: 4, type: 'weekly', gene_type: 'heart_pump', xp: 65, gold: 35, repeatable: true },
  { name: 'Mediterranean Arc IV: Whole Grain Lock', description: 'Use only whole-grain starches for five days this week', icon: '🔒', domain: 'discipline', category: 'arc', difficulty: 4, type: 'weekly', gene_type: 'clock_anchor', xp: 65, gold: 35, repeatable: true },
  { name: 'Mediterranean Arc V: Color 30', description: 'Reach 30 unique plant foods over the week', icon: '🎨', domain: 'mind', category: 'arc', difficulty: 5, type: 'boss', gene_type: 'grin2b_gate', xp: 90, gold: 50, repeatable: true },
  { name: 'Mediterranean Arc VI: Family Table Ritual', description: 'Complete 3 phone-free shared meals this week', icon: '🕯️', domain: 'social', category: 'arc', difficulty: 3, type: 'weekly', gene_type: 'gabra2_calm', xp: 55, gold: 30, repeatable: true },
  { name: 'Mediterranean Arc VII: Prep and Protect', description: 'Finish one full meal prep cycle and avoid food waste all week', icon: '🛡️', domain: 'career', category: 'arc', difficulty: 4, type: 'weekly', gene_type: 'nrf2_shield', xp: 60, gold: 32, repeatable: true },
  { name: 'Mediterranean Arc VIII: Budget Longevity Basket', description: 'Complete the full healthy basket plan while staying under budget', icon: '💰', domain: 'finance', category: 'arc', difficulty: 4, type: 'weekly', gene_type: 'apoe_vault', xp: 60, gold: 35, repeatable: true },
  { name: 'Mediterranean Arc IX: Salt & Sugar Discipline', description: 'Hold low-salt and low-added-sugar targets for 6 days this week', icon: '⚖️', domain: 'discipline', category: 'arc', difficulty: 4, type: 'weekly', gene_type: 'adora2a_brake', xp: 65, gold: 36, repeatable: true },
  { name: 'Mediterranean Arc X: Longevity Ascension', description: 'Finish all arc chapters and complete a full centenarian-style week', icon: '👑', domain: 'health', category: 'arc', difficulty: 5, type: 'boss', gene_type: 'vegf_capillary', xp: 140, gold: 80, repeatable: true },
];

export function generateDefaultTasks(): Task[] {
  return TASK_TEMPLATES.map((t, index) => {
    return {
      id: `task_${t.domain}_${index + 1}`,
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
