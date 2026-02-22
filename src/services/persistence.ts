import { openDB, type IDBPDatabase } from 'idb';
import type { Player, Creature, Gene, Task, Achievement, Skill, SpecialAbility } from '../types';

const DB_NAME = 'shadow_system';
const DB_VERSION = 2;

let dbInstance: IDBPDatabase | null = null;

async function getDB(): Promise<IDBPDatabase> {
  if (dbInstance) return dbInstance;
  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('player')) {
        db.createObjectStore('player', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('creatures')) {
        db.createObjectStore('creatures', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('genes')) {
        const geneStore = db.createObjectStore('genes', { keyPath: 'id' });
        geneStore.createIndex('by_domain', 'domain');
        geneStore.createIndex('by_type', 'type');
      }
      if (!db.objectStoreNames.contains('tasks')) {
        db.createObjectStore('tasks', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('achievements')) {
        db.createObjectStore('achievements', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('meta')) {
        db.createObjectStore('meta', { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains('skills')) {
        db.createObjectStore('skills', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('abilities')) {
        db.createObjectStore('abilities', { keyPath: 'id' });
      }
    },
  });
  return dbInstance;
}

// --- Player ---
export async function savePlayer(player: Player): Promise<void> {
  const db = await getDB();
  await db.put('player', player);
}

export async function loadPlayer(): Promise<Player | undefined> {
  const db = await getDB();
  const all = await db.getAll('player');
  return all[0] as Player | undefined;
}

// --- Creatures ---
export async function saveCreature(creature: Creature): Promise<void> {
  const db = await getDB();
  await db.put('creatures', creature);
}

export async function loadAllCreatures(): Promise<Creature[]> {
  const db = await getDB();
  return (await db.getAll('creatures')) as Creature[];
}

export async function loadCreature(id: string): Promise<Creature | undefined> {
  const db = await getDB();
  return (await db.get('creatures', id)) as Creature | undefined;
}

// --- Genes ---
export async function saveGene(gene: Gene): Promise<void> {
  const db = await getDB();
  await db.put('genes', gene);
}

export async function loadAllGenes(): Promise<Gene[]> {
  const db = await getDB();
  return (await db.getAll('genes')) as Gene[];
}

export async function loadGenesByDomain(domain: string): Promise<Gene[]> {
  const db = await getDB();
  return (await db.getAllFromIndex('genes', 'by_domain', domain)) as Gene[];
}

export async function deleteGenes(geneIds: string[]): Promise<void> {
  if (geneIds.length === 0) return;
  const db = await getDB();
  const tx = db.transaction('genes', 'readwrite');
  for (const id of geneIds) {
    await tx.store.delete(id);
  }
  await tx.done;
}

export async function saveCreaturesBatch(creatures: Creature[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('creatures', 'readwrite');
  for (const c of creatures) {
    await tx.store.put(c);
  }
  await tx.done;
}

// --- Tasks ---
export async function saveTasks(tasks: Task[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('tasks', 'readwrite');
  for (const task of tasks) {
    await tx.store.put(task);
  }
  await tx.done;
}

export async function loadAllTasks(): Promise<Task[]> {
  const db = await getDB();
  return (await db.getAll('tasks')) as Task[];
}

// --- Achievements ---
export async function saveAchievements(achievements: Achievement[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('achievements', 'readwrite');
  for (const a of achievements) {
    await tx.store.put(a);
  }
  await tx.done;
}

export async function loadAllAchievements(): Promise<Achievement[]> {
  const db = await getDB();
  return (await db.getAll('achievements')) as Achievement[];
}

// --- Skills ---
export async function saveSkills(skills: Skill[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('skills', 'readwrite');
  for (const s of skills) {
    await tx.store.put(s);
  }
  await tx.done;
}

export async function loadAllSkills(): Promise<Skill[]> {
  const db = await getDB();
  return (await db.getAll('skills')) as Skill[];
}

// --- Abilities ---
export async function saveAbilities(abilities: SpecialAbility[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('abilities', 'readwrite');
  for (const a of abilities) {
    await tx.store.put(a);
  }
  await tx.done;
}

export async function loadAllAbilities(): Promise<SpecialAbility[]> {
  const db = await getDB();
  return (await db.getAll('abilities')) as SpecialAbility[];
}

// --- Meta ---
export async function saveMeta(key: string, value: unknown): Promise<void> {
  const db = await getDB();
  await db.put('meta', { key, value });
}

export async function loadMeta(key: string): Promise<unknown> {
  const db = await getDB();
  const entry = await db.get('meta', key);
  return entry?.value;
}

// --- Export/Import ---
export async function exportAllData(): Promise<string> {
  const db = await getDB();
  const data = {
    player: await db.getAll('player'),
    creatures: await db.getAll('creatures'),
    genes: await db.getAll('genes'),
    tasks: await db.getAll('tasks'),
    achievements: await db.getAll('achievements'),
    skills: await db.getAll('skills'),
    abilities: await db.getAll('abilities'),
    meta: await db.getAll('meta'),
    exportedAt: new Date().toISOString(),
  };
  return JSON.stringify(data, null, 2);
}

export async function clearAllData(): Promise<void> {
  const db = await getDB();
  const storeNames = ['player', 'creatures', 'genes', 'tasks', 'achievements', 'skills', 'abilities', 'meta'];
  for (const name of storeNames) {
    const tx = db.transaction(name, 'readwrite');
    await tx.store.clear();
    await tx.done;
  }
}
