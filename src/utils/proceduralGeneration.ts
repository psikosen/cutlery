import type { Domain, Task, TaskType } from '../types';

export interface TaskSelectionOptions {
  targetCount: number;
  daySeed: string;
  baseScore: (task: Task) => number;
  preferIncomplete?: boolean;
  maxPerDomain?: number;
  maxPerType?: number;
  maxPerCategory?: number;
  excludeTaskIds?: string[];
}

interface CandidateState {
  task: Task;
  score: number;
}

function hashText(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function countByDomain(tasks: Task[]): Record<Domain, number> {
  const counts: Record<Domain, number> = {
    health: 0,
    mind: 0,
    discipline: 0,
    career: 0,
    finance: 0,
    social: 0,
  };
  for (const task of tasks) {
    counts[task.domain] += 1;
  }
  return counts;
}

function countByType(tasks: Task[]): Record<TaskType, number> {
  const counts: Record<TaskType, number> = {
    daily: 0,
    weekly: 0,
    boss: 0,
    emergency: 0,
  };
  for (const task of tasks) {
    counts[task.type] += 1;
  }
  return counts;
}

function scoreCandidateTask(
  task: Task,
  selected: Task[],
  domainPool: Record<Domain, number>,
  options: TaskSelectionOptions,
): number {
  let score = options.baseScore(task);

  const deterministicRoll = hashText(`${options.daySeed}:${task.id}`) % 13;
  score += deterministicRoll - 6;

  if (options.preferIncomplete) {
    score += task.completed_today ? -36 : 14;
  }

  // Penalize highly repeated quests so daily generation rotates naturally.
  const fatiguePenalty = Math.min(44, Math.log2(task.completed_count + 1) * 10);
  score -= fatiguePenalty;

  // Reward underrepresented domains in the candidate pool.
  const domainWeight = domainPool[task.domain];
  score += Math.max(0, 14 - (domainWeight * 2));

  const selectedInDomain = selected.filter((entry) => entry.domain === task.domain).length;
  if (typeof options.maxPerDomain === 'number' && selectedInDomain >= options.maxPerDomain) {
    score -= 400;
  } else if (selectedInDomain === 0) {
    score += 16;
  } else {
    score -= selectedInDomain * 20;
  }

  const selectedInType = selected.filter((entry) => entry.type === task.type).length;
  if (typeof options.maxPerType === 'number' && selectedInType >= options.maxPerType) {
    score -= 220;
  } else if (selectedInType > 0) {
    score -= selectedInType * 12;
  }

  const selectedInCategory = selected.filter((entry) => entry.category === task.category).length;
  if (typeof options.maxPerCategory === 'number' && selectedInCategory >= options.maxPerCategory) {
    score -= 120;
  } else if (selectedInCategory > 0) {
    score -= selectedInCategory * 8;
  }

  return score;
}

export function selectTasksWithConstraints(tasks: Task[], options: TaskSelectionOptions): Task[] {
  if (options.targetCount <= 0 || tasks.length === 0) return [];
  const excluded = new Set(options.excludeTaskIds ?? []);

  const candidates = tasks.filter((task) => !excluded.has(task.id));
  const domainPool = countByDomain(candidates);
  const selected: Task[] = [];

  while (selected.length < options.targetCount) {
    const remaining = candidates.filter((task) => !selected.some((entry) => entry.id === task.id));
    if (remaining.length === 0) break;

    const scored: CandidateState[] = remaining.map((task) => ({
      task,
      score: scoreCandidateTask(task, selected, domainPool, options),
    }));

    scored.sort((a, b) => b.score - a.score);
    const viable = scored.find((entry) => entry.score > -180) ?? scored[0];
    selected.push(viable.task);
  }

  return selected.slice(0, options.targetCount);
}

export function summarizeTaskMix(tasks: Task[]): {
  byDomain: Record<Domain, number>;
  byType: Record<TaskType, number>;
} {
  return {
    byDomain: countByDomain(tasks),
    byType: countByType(tasks),
  };
}
