import type { AppSettings, BackupData, CategoryId, Exercise, Quality, UnitType, WorkoutRecord } from '../types';
import { CATEGORY_META } from '../data/exercises';
import { formatScore, qualityLabel, recordAmountText, recordScore } from './score';
import { normalizeSettings } from './db';

const CATEGORY_IDS: CategoryId[] = ['push', 'pull', 'legs', 'core', 'grip'];
const UNIT_TYPES: UnitType[] = ['reps', 'seconds'];
const QUALITIES: Quality[] = [1, 0.8, 0.5];
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export interface BackupValidationResult {
  data?: BackupData;
  error?: string;
  summary?: {
    records: number;
    customExercises: number;
    dateFrom?: string;
    dateTo?: string;
  };
}

export function parseBackupJson(text: string): BackupValidationResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { error: '文件不是有效的 JSON，可能已损坏或选错了文件。' };
  }
  return validateBackup(raw);
}

export function validateBackup(raw: unknown): BackupValidationResult {
  if (!raw || typeof raw !== 'object') return { error: '备份内容为空或格式不正确。' };
  const source = raw as Record<string, unknown>;
  if (source.app !== 'dongfen') {
    return { error: '这不是「动分」导出的备份文件。' };
  }
  if (source.schemaVersion !== 1) {
    return { error: `暂不支持这个备份版本（${String(source.schemaVersion)}）。` };
  }
  if (!Array.isArray(source.records) || !Array.isArray(source.customExercises)) {
    return { error: '备份缺少 records 或 customExercises 数据。' };
  }

  const customExercises: Exercise[] = [];
  for (const item of source.customExercises) {
    const exercise = normalizeExercise(item);
    if (!exercise) return { error: '备份中有无法识别的自定义动作。' };
    customExercises.push(exercise);
  }

  const records: WorkoutRecord[] = [];
  for (const item of source.records) {
    const record = normalizeRecord(item);
    if (!record) return { error: '备份中有无法识别的训练记录。' };
    records.push(record);
  }

  const settings = normalizeSettings(
    source.settings && typeof source.settings === 'object' ? (source.settings as Partial<AppSettings>) : undefined,
  );
  const dates = records.map((record) => record.date).sort();
  return {
    data: {
      app: 'dongfen',
      schemaVersion: 1,
      exportedAt: typeof source.exportedAt === 'string' ? source.exportedAt : new Date().toISOString(),
      settings,
      customExercises,
      records,
    },
    summary: {
      records: records.length,
      customExercises: customExercises.length,
      dateFrom: dates[0],
      dateTo: dates[dates.length - 1],
    },
  };
}

function normalizeExercise(raw: unknown): Exercise | null {
  if (!raw || typeof raw !== 'object') return null;
  const source = raw as Record<string, unknown>;
  const id = stringValue(source.id);
  const name = stringValue(source.name);
  const category = categoryValue(source.category);
  const unitType = unitTypeValue(source.unitType);
  const unitScore = positiveNumber(source.unitScore);
  if (!id || !name || !category || !unitType || unitScore === null) return null;
  return {
    id,
    name,
    category,
    group: stringValue(source.group) || '自定义',
    unitType,
    unitScore,
    perSide: Boolean(source.perSide),
    level: Math.min(5, Math.max(1, Number(source.level) || 2)),
    aliases: Array.isArray(source.aliases) ? source.aliases.filter((item): item is string => typeof item === 'string') : [],
    cue: stringValue(source.cue),
    equipment: stringValue(source.equipment) || '无器械',
    custom: true,
  };
}

function normalizeRecord(raw: unknown): WorkoutRecord | null {
  if (!raw || typeof raw !== 'object') return null;
  const source = raw as Record<string, unknown>;
  const id = stringValue(source.id);
  const date = stringValue(source.date);
  const exerciseId = stringValue(source.exerciseId);
  const exerciseName = stringValue(source.exerciseName);
  const category = categoryValue(source.category);
  const unitType = unitTypeValue(source.unitType);
  const unitScore = positiveNumber(source.unitScore);
  const quality = qualityValue(source.quality);
  if (!id || !isValidDateKey(date) || !exerciseId || !exerciseName || !category || !unitType || unitScore === null || !quality) {
    return null;
  }
  const perSide = Boolean(source.perSide);
  const amount = optionalNumber(source.amount);
  const leftAmount = optionalNumber(source.leftAmount);
  const rightAmount = optionalNumber(source.rightAmount);
  if (perSide) {
    if (leftAmount === null && rightAmount === null) return null;
  } else if (amount === null) {
    return null;
  }
  return {
    id,
    date,
    exerciseId,
    exerciseName,
    category,
    group: stringValue(source.group) || '训练',
    unitType,
    unitScore,
    perSide,
    quality,
    amount: amount ?? undefined,
    leftAmount: leftAmount ?? undefined,
    rightAmount: rightAmount ?? undefined,
    note: stringValue(source.note) || undefined,
    createdAt: stringValue(source.createdAt) || new Date().toISOString(),
    updatedAt: stringValue(source.updatedAt) || new Date().toISOString(),
  };
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function isValidDateKey(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function positiveNumber(value: unknown): number | null {
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function optionalNumber(value: unknown): number | null {
  if (value === undefined || value === null) return null;
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

function categoryValue(value: unknown): CategoryId | null {
  return CATEGORY_IDS.includes(value as CategoryId) ? (value as CategoryId) : null;
}

function unitTypeValue(value: unknown): UnitType | null {
  return UNIT_TYPES.includes(value as UnitType) ? (value as UnitType) : null;
}

function qualityValue(value: unknown): Quality | null {
  const number = typeof value === 'number' ? value : Number(value);
  return QUALITIES.includes(number as Quality) ? (number as Quality) : null;
}

export function backupToJson(data: BackupData): string {
  return JSON.stringify(data, null, 2);
}

export function recordsToCsv(records: WorkoutRecord[]): string {
  const header = ['日期', '动作', '类别', '组别', '数量', '质量系数', '质量', '得分', '备注'];
  const rows = records.map((record) => [
    record.date,
    record.exerciseName,
    CATEGORY_META[record.category].label,
    record.group,
    recordAmountText(record),
    record.quality.toFixed(1),
    qualityLabel(record.quality),
    formatScore(recordScore(record)),
    record.note ?? '',
  ]);
  return `\uFEFF${[header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n')}`;
}

function csvCell(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

export function downloadTextFile(filename: string, content: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function backupFilename(): string {
  const now = new Date();
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    '-',
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
  ].join('');
  return `dongfen-backup-${stamp}.json`;
}

export function csvFilename(): string {
  return backupFilename().replace('.json', '.csv');
}

export function readTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('读取文件失败'));
    reader.readAsText(file, 'utf-8');
  });
}
