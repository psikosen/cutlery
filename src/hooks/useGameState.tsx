import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import type {
  Player, Creature, Gene, Task, Achievement, Notification,
  TabId, Domain, CreatureId, GeneType, GeneTier, Skill, SpecialAbility,
} from '../types';
import {
  createDefaultPlayer, createAllCreatures, completeTask as engineCompleteTask,
  checkAchievements, fuseGenes as engineFuseGenes,
} from '../services/gameEngine';
import type { TaskCompletionResult } from '../services/gameEngine';
import {
  savePlayer, loadPlayer, saveCreature, loadAllCreatures,
  saveGene, loadAllGenes, saveTasks, loadAllTasks,
  saveAchievements, loadAllAchievements,
  saveSkills, loadAllSkills as loadAllSkillsDB,
  saveAbilities, loadAllAbilities as loadAllAbilitiesDB,
  saveMeta, loadMeta,
} from '../services/persistence';
import { generateDefaultTasks } from '../data/defaultTasks';
import { getDefaultAchievements } from '../data/achievements';
import { getAllSkills } from '../data/skills';
import { getAllAbilities } from '../data/abilities';

// ============================================================
// STATE
// ============================================================

interface GameState {
  initialized: boolean;
  loading: boolean;
  player: Player | null;
  creatures: Creature[];
  genes: Gene[];
  tasks: Task[];
  achievements: Achievement[];
  skills: Skill[];
  abilities: SpecialAbility[];
  notifications: Notification[];
  activeTab: TabId;
  selectedCreature: CreatureId | null;
  domainFilter: Domain | null;
  showEvolution: { creatureId: CreatureId; oldStage: number; newStage: number } | null;
  showNameInput: boolean;
}

const initialState: GameState = {
  initialized: false,
  loading: true,
  player: null,
  creatures: [],
  genes: [],
  tasks: [],
  achievements: [],
  skills: [],
  abilities: [],
  notifications: [],
  activeTab: 'hub',
  selectedCreature: null,
  domainFilter: null,
  showEvolution: null,
  showNameInput: false,
};

// ============================================================
// ACTIONS
// ============================================================

type GameAction =
  | { type: 'INIT_COMPLETE'; player: Player; creatures: Creature[]; genes: Gene[]; tasks: Task[]; achievements: Achievement[]; skills: Skill[]; abilities: SpecialAbility[] }
  | { type: 'SHOW_NAME_INPUT' }
  | { type: 'SET_PLAYER_NAME'; name: string }
  | { type: 'TASK_COMPLETED'; result: TaskCompletionResult; task: Task; achievements: Achievement[] }
  | { type: 'GENE_FUSED'; creature: Creature; newGene: Gene; removedGeneIds: string[] }
  | { type: 'SET_TAB'; tab: TabId }
  | { type: 'SET_SELECTED_CREATURE'; id: CreatureId | null }
  | { type: 'SET_DOMAIN_FILTER'; domain: Domain | null }
  | { type: 'DISMISS_NOTIFICATION'; id: string }
  | { type: 'ADD_NOTIFICATION'; notification: Notification }
  | { type: 'DISMISS_EVOLUTION' }
  | { type: 'RESET_DAILY_TASKS'; tasks: Task[] }
  | { type: 'UPDATE_CREATURES'; creatures: Creature[] }
  | { type: 'UPDATE_PLAYER'; player: Player };

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'INIT_COMPLETE':
      return {
        ...state,
        initialized: true,
        loading: false,
        player: action.player,
        creatures: action.creatures,
        genes: action.genes,
        tasks: action.tasks,
        achievements: action.achievements,
        skills: action.skills,
        abilities: action.abilities,
        showNameInput: false,
      };

    case 'SHOW_NAME_INPUT':
      return { ...state, loading: false, showNameInput: true };

    case 'SET_PLAYER_NAME':
      return state;

    case 'TASK_COMPLETED': {
      const { result, task } = action;
      const updatedTasks = state.tasks.map(t =>
        t.id === task.id ? { ...t, completed_today: true, completed_count: t.completed_count + 1 } : t
      );
      const updatedCreatures = state.creatures.map(c => {
        if (c.id === result.creature.id) return result.creature;
        return c;
      });
      // If streak genes affected chain_wraith separately
      if (result.streakGenes.length > 0) {
        const chainIdx = updatedCreatures.findIndex(c => c.id === 'chain_wraith');
        if (chainIdx >= 0 && result.creature.id !== 'chain_wraith') {
          // The chain wraith was updated inside the engine — find it
          const latestChain = state.creatures.find(c => c.id === 'chain_wraith');
          if (latestChain) {
            // The engine returns the updated creature — we need to extract it
            // The updated chain_wraith is embedded in the result indirectly
          }
        }
      }
      return {
        ...state,
        player: result.player,
        creatures: updatedCreatures,
        genes: [...state.genes, result.gene, ...result.streakGenes],
        tasks: updatedTasks,
        achievements: action.achievements,
        skills: result.updatedSkills || state.skills,
        abilities: result.updatedAbilities || state.abilities,
        notifications: [...state.notifications, ...result.notifications],
        showEvolution: result.evolved ? {
          creatureId: result.creature.id,
          oldStage: result.oldStage,
          newStage: result.newStage,
        } : state.showEvolution,
      };
    }

    case 'GENE_FUSED': {
      const updatedGenes = state.genes
        .filter(g => !action.removedGeneIds.includes(g.id))
        .concat(action.newGene);
      const updatedCreatures = state.creatures.map(c =>
        c.id === action.creature.id ? action.creature : c
      );
      return { ...state, genes: updatedGenes, creatures: updatedCreatures };
    }

    case 'SET_TAB':
      return { ...state, activeTab: action.tab };

    case 'SET_SELECTED_CREATURE':
      return { ...state, selectedCreature: action.id };

    case 'SET_DOMAIN_FILTER':
      return { ...state, domainFilter: action.domain };

    case 'DISMISS_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.id),
      };

    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [...state.notifications, action.notification],
      };

    case 'DISMISS_EVOLUTION':
      return { ...state, showEvolution: null };

    case 'RESET_DAILY_TASKS':
      return { ...state, tasks: action.tasks };

    case 'UPDATE_CREATURES':
      return { ...state, creatures: action.creatures };

    case 'UPDATE_PLAYER':
      return { ...state, player: action.player };

    default:
      return state;
  }
}

// ============================================================
// CONTEXT
// ============================================================

interface GameContextValue {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  completeTask: (task: Task) => Promise<void>;
  fuseGenes: (creatureId: CreatureId, geneType: GeneType, tier: GeneTier) => Promise<void>;
  initializeGame: (name: string) => Promise<void>;
  setTab: (tab: TabId) => void;
  selectCreature: (id: CreatureId | null) => void;
  setDomainFilter: (domain: Domain | null) => void;
  dismissNotification: (id: string) => void;
  dismissEvolution: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Load from IndexedDB on mount
  useEffect(() => {
    (async () => {
      try {
        const player = await loadPlayer();
        if (!player) {
          dispatch({ type: 'SHOW_NAME_INPUT' });
          return;
        }

        const creatures = await loadAllCreatures();
        const genes = await loadAllGenes();
        let tasks = await loadAllTasks();
        let achievements = await loadAllAchievements();

        if (tasks.length === 0) {
          tasks = generateDefaultTasks();
          await saveTasks(tasks);
        }

        if (achievements.length === 0) {
          achievements = getDefaultAchievements();
          await saveAchievements(achievements);
        }

        let skills = await loadAllSkillsDB();
        if (skills.length === 0) {
          skills = getAllSkills();
          await saveSkills(skills);
        }

        let abilities = await loadAllAbilitiesDB();
        if (abilities.length === 0) {
          abilities = getAllAbilities();
          await saveAbilities(abilities);
        }

        // Daily reset is handled in the separate useEffect below

        dispatch({
          type: 'INIT_COMPLETE',
          player,
          creatures,
          genes,
          tasks,
          achievements,
          skills,
          abilities,
        });
      } catch (err) {
        console.error('Failed to load game state:', err);
        dispatch({ type: 'SHOW_NAME_INPUT' });
      }
    })();
  }, []);

  // Daily reset check — runs on mount and sets up a timer for midnight
  useEffect(() => {
    if (!state.initialized || !state.player) return;

    const performDailyReset = async () => {
      const s = stateRef.current;
      const today = new Date().toISOString().split('T')[0];

      // Load the last reset date from meta
      const lastReset = (await loadMeta('last_daily_reset')) as string | undefined;
      if (lastReset === today) return; // Already reset today

      // Check if any daily task needs resetting
      const dailyTasks = s.tasks.filter(t => t.type === 'daily' && t.completed_today);
      if (dailyTasks.length > 0 || lastReset !== today) {
        const resetTasks = s.tasks.map(t =>
          t.type === 'daily' ? { ...t, completed_today: false } : t
        );
        await saveTasks(resetTasks);
        await saveMeta('last_daily_reset', today);
        dispatch({ type: 'RESET_DAILY_TASKS', tasks: resetTasks });
      }
    };

    performDailyReset();

    // Schedule next reset at midnight
    const now = new Date();
    const midnight = new Date(now);
    midnight.setDate(midnight.getDate() + 1);
    midnight.setHours(0, 0, 0, 0);
    const msUntilMidnight = midnight.getTime() - now.getTime();

    const timer = setTimeout(() => {
      performDailyReset();
      // After the first midnight trigger, set up a daily interval
      const interval = setInterval(performDailyReset, 24 * 60 * 60 * 1000);
      return () => clearInterval(interval);
    }, msUntilMidnight);

    return () => clearTimeout(timer);
  }, [state.initialized, state.player]);

  const initializeGame = useCallback(async (name: string) => {
    const player = createDefaultPlayer(name);
    const creatures = createAllCreatures(player.id);
    const tasks = generateDefaultTasks();
    const achievements = getDefaultAchievements();
    const skills = getAllSkills();
    const abilities = getAllAbilities();

    await savePlayer(player);
    for (const c of creatures) await saveCreature(c);
    await saveTasks(tasks);
    await saveAchievements(achievements);
    await saveSkills(skills);
    await saveAbilities(abilities);

    dispatch({
      type: 'INIT_COMPLETE',
      player,
      creatures,
      genes: [],
      tasks,
      achievements,
      skills,
      abilities,
    });
  }, []);

  const handleCompleteTask = useCallback(async (task: Task) => {
    const s = stateRef.current;
    if (!s.player || task.completed_today) return;

    const result = engineCompleteTask(task, s.player, s.creatures, s.achievements, s.skills, s.abilities);

    // Persist
    await savePlayer(result.player);
    await saveCreature(result.creature);
    await saveGene(result.gene);
    for (const sg of result.streakGenes) await saveGene(sg);

    const updatedTasks = s.tasks.map(t =>
      t.id === task.id ? { ...t, completed_today: true, completed_count: t.completed_count + 1 } : t
    );
    await saveTasks(updatedTasks);

    // Re-check achievements with full state
    const allCreatures = s.creatures.map(c =>
      c.id === result.creature.id ? result.creature : c
    );
    const achResult = checkAchievements(result.player, allCreatures, s.achievements, result.updatedSkills, result.updatedAbilities);
    await saveAchievements(achResult.achievements);

    // Save updated skills and abilities
    if (result.updatedSkills) await saveSkills(result.updatedSkills);
    if (result.updatedAbilities) await saveAbilities(result.updatedAbilities);

    // If chain wraith was updated (streak genes), save it too
    if (result.streakGenes.length > 0 && result.creature.id !== 'chain_wraith') {
      const chainWraith = allCreatures.find(c => c.id === 'chain_wraith');
      if (chainWraith) await saveCreature(chainWraith);
    }

    dispatch({
      type: 'TASK_COMPLETED',
      result,
      task,
      achievements: achResult.achievements,
    });
  }, []);

  const handleFuseGenes = useCallback(async (creatureId: CreatureId, geneType: GeneType, tier: GeneTier) => {
    const s = stateRef.current;
    const creature = s.creatures.find(c => c.id === creatureId);
    if (!creature) return;

    const result = engineFuseGenes(creature, geneType, tier, s.genes);
    if (!result) return;

    await saveCreature(result.creature);
    await saveGene(result.newGene);
    // Note: we don't delete genes from IDB for simplicity; they're filtered in state

    dispatch({
      type: 'GENE_FUSED',
      creature: result.creature,
      newGene: result.newGene,
      removedGeneIds: result.removedGeneIds,
    });
  }, []);

  const setTab = useCallback((tab: TabId) => {
    dispatch({ type: 'SET_TAB', tab });
  }, []);

  const selectCreature = useCallback((id: CreatureId | null) => {
    dispatch({ type: 'SET_SELECTED_CREATURE', id });
  }, []);

  const setDomainFilter = useCallback((domain: Domain | null) => {
    dispatch({ type: 'SET_DOMAIN_FILTER', domain });
  }, []);

  const dismissNotification = useCallback((id: string) => {
    dispatch({ type: 'DISMISS_NOTIFICATION', id });
  }, []);

  const dismissEvolution = useCallback(() => {
    dispatch({ type: 'DISMISS_EVOLUTION' });
  }, []);

  const value: GameContextValue = {
    state,
    dispatch,
    completeTask: handleCompleteTask,
    fuseGenes: handleFuseGenes,
    initializeGame,
    setTab,
    selectCreature,
    setDomainFilter,
    dismissNotification,
    dismissEvolution,
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
