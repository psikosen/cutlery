// ============================================================
// API CLIENT — HTTP client for the PostgreSQL backend
// ============================================================
// Provides a thin wrapper over fetch() to call the server API.
// Falls back to IndexedDB (via persistence.ts) when offline
// or when the server is unavailable.

import type { Player, Creature, Gene, Task, Achievement } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) {
    localStorage.setItem('shadow_auth_token', token);
  } else {
    localStorage.removeItem('shadow_auth_token');
  }
}

export function getAuthToken(): string | null {
  if (authToken) return authToken;
  authToken = localStorage.getItem('shadow_auth_token');
  return authToken;
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || body.message || `API error: ${res.status}`);
  }

  return res.json();
}

// ============================================================
// AUTH API
// ============================================================

export async function apiRequestOTP(email: string, purpose = 'login') {
  return apiFetch<{ success: boolean; message: string }>('/auth/otp/request', {
    method: 'POST',
    body: JSON.stringify({ email, purpose }),
  });
}

export async function apiVerifyOTP(email: string, code: string) {
  return apiFetch<{
    success: boolean;
    message: string;
    token?: string;
    requiresMFA?: boolean;
    userId?: string;
    user?: { id: string; email: string; emailVerified: boolean; mfaEnabled: boolean };
  }>('/auth/otp/verify', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  });
}

export async function apiVerifyMFA(code: string) {
  return apiFetch<{
    success: boolean;
    message: string;
    token?: string;
    user?: { id: string; email: string; emailVerified: boolean; mfaEnabled: boolean };
  }>('/auth/mfa/verify', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}

export async function apiSetupMFA() {
  return apiFetch<{
    success: boolean;
    message: string;
    setup?: { secret: string; qrCodeUrl: string; backupCodes: string[] };
  }>('/auth/mfa/setup', { method: 'POST' });
}

export async function apiConfirmMFA(code: string) {
  return apiFetch<{ success: boolean; message: string }>('/auth/mfa/confirm', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}

export async function apiDisableMFA(code: string) {
  return apiFetch<{ success: boolean; message: string }>('/auth/mfa/disable', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}

export async function apiGetMe() {
  return apiFetch<{
    id: string;
    email: string;
    emailVerified: boolean;
    mfaEnabled: boolean;
    createdAt: string;
    lastLoginAt: string;
  }>('/auth/me');
}

export async function apiLogout() {
  return apiFetch<{ success: boolean }>('/auth/logout', { method: 'POST' });
}

// ============================================================
// GAME API
// ============================================================

export async function apiLoadGameState() {
  return apiFetch<{
    initialized: boolean;
    player?: Player;
    creatures?: Creature[];
    genes?: Gene[];
    tasks?: Task[];
    achievements?: Achievement[];
  }>('/game/state');
}

export async function apiInitializeGame(data: {
  name: string;
  player: Player;
  creatures: Creature[];
  tasks: Task[];
  achievements: Achievement[];
}) {
  return apiFetch<{ success: boolean; playerId: string }>('/game/initialize', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiSavePlayer(player: Player) {
  return apiFetch<{ success: boolean }>('/game/player', {
    method: 'PUT',
    body: JSON.stringify(player),
  });
}

export async function apiSaveCreature(creature: Creature) {
  return apiFetch<{ success: boolean }>(`/game/creature/${creature.id}`, {
    method: 'PUT',
    body: JSON.stringify(creature),
  });
}

export async function apiSaveGene(gene: Gene) {
  return apiFetch<{ success: boolean }>('/game/gene', {
    method: 'POST',
    body: JSON.stringify(gene),
  });
}

export async function apiSaveTasks(tasks: Task[]) {
  return apiFetch<{ success: boolean }>('/game/tasks', {
    method: 'PUT',
    body: JSON.stringify({ tasks }),
  });
}

export async function apiSaveAchievements(achievements: Achievement[]) {
  return apiFetch<{ success: boolean }>('/game/achievements', {
    method: 'PUT',
    body: JSON.stringify({ achievements }),
  });
}

export async function apiDailyReset() {
  return apiFetch<{ success: boolean }>('/game/daily-reset', { method: 'POST' });
}

// ============================================================
// CONNECTIVITY CHECK
// ============================================================

export async function isServerAvailable(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE.replace('/api', '')}/health`, { method: 'GET' });
    return res.ok;
  } catch {
    return false;
  }
}
