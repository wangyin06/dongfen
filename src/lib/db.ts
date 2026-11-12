import { openDB, type DBSchema } from 'idb';
import type { AppSettings, BackupData, Exercise, WorkoutRecord } from '../types';

interface DongfenDB extends DBSchema {
  records: {
    key: string;
    value: WorkoutRecord;
    indexes: { 'by-date': string; 'by-exercise': string };
  };
  settings: {
    key: string;
    value: AppSettings;
  };
  customExercises: {
    key: string;
    value: Exercise;
    indexes: { 'by-category': string };
  };
}

export const DEFAULT_SETTINGS: AppSettings = {
  weeklyGoal: 13,
  hardDayLimit: 4,
  easyDayLimit: 2,
  weekStartsOn: 1,
  defaultQuality: 1,
};

const DB_NAME = 'dongfen-db';
const DB_VERSION = 1;

let dbPromise: ReturnType<typeof openDB<DongfenDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<DongfenDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const records = db.createObjectStore('records', { keyPath: 'id' });
        records.createIndex('by-date', 'date');
        records.createIndex('by-exercise', 'exerciseId');
        db.createObjectStore('settings');
        const custom = db.createObjectStore('customExercises', { keyPath: 'id' });
        custom.createIndex('by-category', 'category');
      },
    });
  }
  return dbPromise;
}

export function createId(prefix = 'rec'): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function normalizeSettings(input?: Partial<AppSettings> | null): AppSettings {
  const merged = { ...DEFAULT_SETTINGS, ...(input ?? {}) };
  return {
    weeklyGoal: clampNumber(merged.weeklyGoal, 1, 50, DEFAULT_SETTINGS.weeklyGoal),
    hardDayLimit: clampNumber(merged.hardDayLimit, 1, 20, DEFAULT_SETTINGS.hardDayLimit),
    easyDayLimit: clampNumber(merged.easyDayLimit, 0.5, 20, DEFAULT_SETTINGS.easyDayLimit),
    weekStartsOn: merged.weekStartsOn === 0 ? 0 : 1,
    defaultQuality: merged.defaultQuality === 0.8 || merged.defaultQuality === 0.5 ? merged.defaultQuality : 1,
    lastExportAt: typeof merged.lastExportAt === 'string' ? merged.lastExportAt : undefined,
  };
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(max, Math.max(min, numeric));
}

export async function getSettings(): Promise<AppSettings> {
  const db = await getDB();
  return normalizeSettings(await db.get('settings', 'app'));
}

export async function saveSettings(settings: AppSettings): Promise<AppSettings> {
  const db = await getDB();
  const normalized = normalizeSettings(settings);
  await db.put('settings', normalized, 'app');
  return normalized;
}

export async function getAllRecords(): Promise<WorkoutRecord[]> {
  const db = await getDB();
  const records = await db.getAll('records');
  return records.sort((a, b) => {
    const byDate = b.date.localeCompare(a.date);
    return byDate !== 0 ? byDate : b.createdAt.localeCompare(a.createdAt);
  });
}

export async function putRecord(record: WorkoutRecord): Promise<void> {
  const db = await getDB();
  await db.put('records', record);
}

export async function deleteRecord(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('records', id);
}

export async function getCustomExercises(): Promise<Exercise[]> {
  const db = await getDB();
  return db.getAll('customExercises');
}

export async function putCustomExercise(exercise: Exercise): Promise<void> {
  const db = await getDB();
  await db.put('customExercises', exercise);
}

export async function deleteCustomExercise(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('customExercises', id);
}

export async function getCounts(): Promise<{ records: number; customExercises: number }> {
  const db = await getDB();
  return {
    records: await db.count('records'),
    customExercises: await db.count('customExercises'),
  };
}

export async function exportAllData(): Promise<BackupData> {
  const [settings, customExercises, records] = await Promise.all([
    getSettings(),
    getCustomExercises(),
    getAllRecords(),
  ]);
  return {
    app: 'dongfen',
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    settings,
    customExercises,
    records,
  };
}

export async function replaceAllData(data: BackupData): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['records', 'customExercises', 'settings'], 'readwrite');
  await tx.objectStore('records').clear();
  await tx.objectStore('customExercises').clear();
  for (const record of data.records) {
    await tx.objectStore('records').put(record);
  }
  for (const exercise of data.customExercises) {
    await tx.objectStore('customExercises').put(exercise);
  }
  await tx.objectStore('settings').put(normalizeSettings(data.settings), 'app');
  await tx.done;
}

export async function mergeAllData(data: BackupData): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['records', 'customExercises'], 'readwrite');
  for (const record of data.records) {
    await tx.objectStore('records').put(record);
  }
  for (const exercise of data.customExercises) {
    await tx.objectStore('customExercises').put(exercise);
  }
  await tx.done;
}

export async function clearAllData(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['records', 'customExercises', 'settings'], 'readwrite');
  await tx.objectStore('records').clear();
  await tx.objectStore('customExercises').clear();
  await tx.objectStore('settings').put({ ...DEFAULT_SETTINGS }, 'app');
  await tx.done;
}
