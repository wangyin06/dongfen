import { describe, expect, it } from 'vitest';
import type { WorkoutRecord } from '../types';
import { todayKey } from './date';
import { validateWorkoutRecord } from './validation';

function record(overrides: Partial<WorkoutRecord> = {}): WorkoutRecord {
  return {
    id: 'record-1',
    date: todayKey(),
    exerciseId: 'standard_push',
    exerciseName: '标准俯卧撑',
    category: 'push',
    group: '水平推',
    unitType: 'reps',
    unitScore: 0.3,
    perSide: false,
    quality: 1,
    amount: 10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('validateWorkoutRecord', () => {
  it('accepts a normal record', () => {
    expect(validateWorkoutRecord(record())).toBeNull();
  });

  it('rejects future and impossible dates', () => {
    expect(validateWorkoutRecord(record({ date: '2099-01-01' }))).toContain('不能晚于今天');
    expect(validateWorkoutRecord(record({ date: '2026-02-30' }))).toContain('有效日期');
  });

  it('requires positive integer reps', () => {
    expect(validateWorkoutRecord(record({ amount: 2.5 }))).toContain('整数');
    expect(validateWorkoutRecord(record({ amount: -1 }))).toContain('整数');
    expect(validateWorkoutRecord(record({ amount: 0 }))).toContain('大于 0');
  });

  it('validates side records', () => {
    expect(
      validateWorkoutRecord(record({ perSide: true, amount: undefined, leftAmount: 0, rightAmount: 0 })),
    ).toContain('不能同时为 0');
    expect(
      validateWorkoutRecord(record({ perSide: true, amount: undefined, leftAmount: 12, rightAmount: 0 })),
    ).toBeNull();
  });
});