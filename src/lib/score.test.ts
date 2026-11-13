import { describe, expect, it } from 'vitest';
import type { WorkoutRecord } from '../types';
import { recordScore, scoreForAmount, streakDays } from './score';

function record(overrides: Partial<WorkoutRecord> = {}): WorkoutRecord {
  return {
    id: 'record-1',
    date: '2026-11-12',
    exerciseId: 'standard_push',
    exerciseName: '标准俯卧撑',
    category: 'push',
    group: '水平推',
    unitType: 'reps',
    unitScore: 0.3,
    perSide: false,
    quality: 1,
    amount: 10,
    createdAt: '2026-11-12T08:00:00.000Z',
    updatedAt: '2026-11-12T08:00:00.000Z',
    ...overrides,
  };
}

describe('scoreForAmount', () => {
  it('uses 10 reps as one base unit and applies quality', () => {
    expect(scoreForAmount('reps', 0.3, 20, 1)).toBeCloseTo(0.6);
    expect(scoreForAmount('reps', 0.3, 20, 0.8)).toBeCloseTo(0.48);
    expect(scoreForAmount('reps', 0.3, 20, 0.5)).toBeCloseTo(0.3);
  });

  it('uses 30 seconds as one base unit', () => {
    expect(scoreForAmount('seconds', 0.1, 30, 1)).toBeCloseTo(0.1);
    expect(scoreForAmount('seconds', 0.1, 45, 1)).toBeCloseTo(0.15);
  });
});

describe('recordScore', () => {
  it('adds left and right side scores separately', () => {
    const sideRecord = record({
      unitType: 'seconds',
      unitScore: 0.1,
      perSide: true,
      amount: undefined,
      leftAmount: 15,
      rightAmount: 30,
      quality: 0.8,
    });
    expect(recordScore(sideRecord)).toBeCloseTo(0.12);
  });
});

describe('streakDays', () => {
  it('counts today and consecutive previous days', () => {
    expect(streakDays([record({ date: '2026-11-12' }), record({ id: 'r2', date: '2026-11-11' })], '2026-11-12')).toBe(2);
  });

  it('keeps yesterday streak before today is trained', () => {
    expect(streakDays([record({ date: '2026-11-11' })], '2026-11-12')).toBe(1);
  });

  it('returns zero with no recent training', () => {
    expect(streakDays([record({ date: '2026-11-09' })], '2026-11-12')).toBe(0);
  });
});