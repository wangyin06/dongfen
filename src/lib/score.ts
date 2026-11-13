import type { CategoryId, Exercise, Quality, RecordDraft, UnitType, WorkoutRecord } from '../types';
import { addDays } from './date';

export const BASE_REPS = 10;
export const BASE_SECONDS = 30;
export const WEEKLY_FLOOR = 8;

export const QUALITY_OPTIONS: Array<{ value: Quality; label: string; short: string; hint: string }> = [
  { value: 1, label: '标准完成', short: '标准', hint: '动作完整，节奏可控' },
  { value: 0.8, label: '轻微变形', short: '轻微', hint: '末端略变形，但仍可控' },
  { value: 0.5, label: '明显变形', short: '明显', hint: '半程或借力明显，只计一半' },
];

export function baseUnit(unitType: UnitType): number {
  return unitType === 'seconds' ? BASE_SECONDS : BASE_REPS;
}

export function scoreForAmount(
  unitType: UnitType,
  unitScore: number,
  amount: number,
  quality: Quality,
): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  return (amount / baseUnit(unitType)) * unitScore * quality;
}

export function recordScore(record: WorkoutRecord): number {
  if (record.perSide) {
    const left = scoreForAmount(record.unitType, record.unitScore, record.leftAmount ?? 0, record.quality);
    const right = scoreForAmount(record.unitType, record.unitScore, record.rightAmount ?? 0, record.quality);
    return left + right;
  }
  return scoreForAmount(record.unitType, record.unitScore, record.amount ?? 0, record.quality);
}

export function draftScore(draft: RecordDraft): number {
  const recordLike: WorkoutRecord = {
    id: '',
    date: draft.date,
    exerciseId: draft.exercise.id,
    exerciseName: draft.exercise.name,
    category: draft.exercise.category,
    group: draft.exercise.group,
    unitType: draft.exercise.unitType,
    unitScore: draft.exercise.unitScore,
    perSide: draft.exercise.perSide,
    quality: draft.quality,
    amount: draft.amount,
    leftAmount: draft.leftAmount,
    rightAmount: draft.rightAmount,
    createdAt: '',
    updatedAt: '',
  };
  return recordScore(recordLike);
}

export function formatScore(value: number): string {
  return value.toFixed(2);
}

export function formatCompactScore(value: number): string {
  if (value >= 100) return Math.round(value).toString();
  return value.toFixed(1);
}

export function formatUnitScore(value: number): string {
  return value.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
}

export function qualityLabel(quality: Quality): string {
  return QUALITY_OPTIONS.find((option) => option.value === quality)?.label ?? '标准完成';
}

export function qualityShort(quality: Quality): string {
  return QUALITY_OPTIONS.find((option) => option.value === quality)?.short ?? '标准';
}

export function unitName(unitType: UnitType): string {
  return unitType === 'seconds' ? '秒' : '次';
}

export function unitScoreLabel(exercise: Pick<Exercise, 'unitType' | 'unitScore' | 'perSide'>): string {
  const { unitType, unitScore, perSide } = exercise;
  if (perSide) {
    return `${formatUnitScore(unitScore)} / 每侧${unitType === 'seconds' ? '30 秒' : '10 次'}`;
  }
  if (unitType === 'seconds') {
    return `${formatUnitScore(unitScore)} / 30 秒`;
  }
  return `${formatUnitScore(unitScore)} / 10 次`;
}

export function unitRateHint(exercise: Pick<Exercise, 'unitType' | 'unitScore' | 'perSide'>): string {
  if (exercise.perSide) {
    return `左右侧分别计分，再相加`;
  }
  if (exercise.unitType === 'seconds') {
    return `按 30 秒为一单位，不足或超出按比例折算`;
  }
  return `按 10 次为一单位，不足或超出按比例折算`;
}

export function recordAmountText(record: WorkoutRecord): string {
  const unit = unitName(record.unitType);
  if (record.perSide) {
    const left = record.leftAmount ?? 0;
    const right = record.rightAmount ?? 0;
    if (left === right) return `左右各 ${left} ${unit}`;
    return `左 ${left} / 右 ${right} ${unit}`;
  }
  return `${record.amount ?? 0} ${unit}`;
}

export function draftAmountText(draft: RecordDraft): string {
  const unit = unitName(draft.exercise.unitType);
  if (draft.exercise.perSide) {
    const left = draft.leftAmount ?? 0;
    const right = draft.rightAmount ?? 0;
    if (left === right) return `左右各 ${left} ${unit}`;
    return `左 ${left} / 右 ${right} ${unit}`;
  }
  return `${draft.amount ?? 0} ${unit}`;
}

export function sumRecords(records: WorkoutRecord[]): number {
  return records.reduce((total, record) => total + recordScore(record), 0);
}

export function groupScoreByDate(records: WorkoutRecord[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const record of records) {
    map.set(record.date, (map.get(record.date) ?? 0) + recordScore(record));
  }
  return map;
}

export function groupScoreByCategory(records: WorkoutRecord[]): Map<CategoryId, number> {
  const map = new Map<CategoryId, number>();
  for (const record of records) {
    map.set(record.category, (map.get(record.category) ?? 0) + recordScore(record));
  }
  return map;
}

export function groupRecordsByDate(records: WorkoutRecord[]): Array<{ date: string; records: WorkoutRecord[]; score: number }> {
  const groups = new Map<string, WorkoutRecord[]>();
  for (const record of records) {
    const list = groups.get(record.date) ?? [];
    list.push(record);
    groups.set(record.date, list);
  }
  return Array.from(groups.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, items]) => ({
      date,
      records: items.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      score: sumRecords(items),
    }));
}

export function streakDays(records: WorkoutRecord[], reference: string): number {
  const dates = new Set(records.map((record) => record.date));
  let cursor = dates.has(reference) ? reference : addDays(reference, -1);
  let count = 0;
  while (dates.has(cursor)) {
    count += 1;
    cursor = addDays(cursor, -1);
  }
  return count;
}

export function topExercises(
  records: WorkoutRecord[],
  limit = 5,
): Array<{ exerciseId: string; name: string; score: number; count: number }> {
  const map = new Map<string, { name: string; score: number; count: number }>();
  for (const record of records) {
    const current = map.get(record.exerciseId) ?? { name: record.exerciseName, score: 0, count: 0 };
    current.score += recordScore(record);
    current.count += 1;
    map.set(record.exerciseId, current);
  }
  return Array.from(map.entries())
    .map(([exerciseId, value]) => ({ exerciseId, ...value }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
