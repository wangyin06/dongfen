import type { UnitType, WorkoutRecord } from '../types';
import { isValidDateKey, todayKey } from './date';

const QUALITIES = [1, 0.8, 0.5];
const UNIT_TYPES: UnitType[] = ['reps', 'seconds'];
const MAX_REPS = 9999;
const MAX_SECONDS = 86_400;

function isValidAmount(value: number, unitType: UnitType): boolean {
  if (!Number.isFinite(value) || value < 0) return false;
  if (unitType === 'reps') return Number.isInteger(value) && value <= MAX_REPS;
  return value <= MAX_SECONDS;
}

export function validateWorkoutRecord(record: WorkoutRecord): string | null {
  if (!record.id.trim()) return '记录 ID 无效。';
  if (!isValidDateKey(record.date)) return '训练日期不是有效日期。';
  if (record.date > todayKey()) return '训练日期不能晚于今天。';
  if (!record.exerciseId.trim() || !record.exerciseName.trim()) return '训练动作信息不完整。';
  if (!UNIT_TYPES.includes(record.unitType)) return '动作计分方式无效。';
  if (!Number.isFinite(record.unitScore) || record.unitScore <= 0) return '动作单位分无效。';
  if (!QUALITIES.includes(record.quality)) return '质量系数无效。';

  if (record.perSide) {
    const left = record.leftAmount;
    const right = record.rightAmount;
    if (left === undefined && right === undefined) return '请至少记录一侧的训练量。';
    if (left !== undefined && !isValidAmount(left, record.unitType)) return '左侧训练量无效。';
    if (right !== undefined && !isValidAmount(right, record.unitType)) return '右侧训练量无效。';
    if ((left ?? 0) + (right ?? 0) <= 0) return '左右侧训练量不能同时为 0。';
    return null;
  }

  if (record.amount === undefined || !isValidAmount(record.amount, record.unitType)) {
    return record.unitType === 'reps' ? '训练次数需为有效的整数。' : '训练秒数无效。';
  }
  if (record.amount <= 0) return '训练量需要大于 0。';
  return null;
}