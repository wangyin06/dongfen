import { describe, expect, it } from 'vitest';
import type { WorkoutRecord } from '../types';
import { getBackupReminder } from './backupReminder';

function record(date: string): WorkoutRecord {
  return {
    id: `r-${date}`,
    date,
    exerciseId: 'standard_push',
    exerciseName: '标准俯卧撑',
    category: 'push',
    group: '水平推',
    unitType: 'reps',
    unitScore: 0.3,
    perSide: false,
    quality: 1,
    amount: 10,
    createdAt: `${date}T10:00:00.000Z`,
    updatedAt: `${date}T10:00:00.000Z`,
  };
}

describe('getBackupReminder', () => {
  it('reminds when records have never been exported and are old enough', () => {
    expect(getBackupReminder([record('2026-01-01')], undefined, '2026-01-31')).toEqual({
      days: 30,
      neverExported: true,
    });
  });

  it('stays quiet for new data', () => {
    expect(getBackupReminder([record('2026-01-02')], undefined, '2026-01-31')).toBeNull();
    expect(getBackupReminder([], undefined, '2026-01-31')).toBeNull();
  });

  it('reminds based on the most recent export', () => {
    expect(getBackupReminder([record('2025-12-01')], '2026-01-01T08:00:00.000Z', '2026-01-31')).toEqual({
      days: 30,
      neverExported: false,
    });
    expect(getBackupReminder([record('2025-12-01')], '2026-01-21T08:00:00.000Z', '2026-01-31')).toBeNull();
  });

  it('falls back to the oldest record when the export timestamp is invalid', () => {
    expect(getBackupReminder([record('2026-01-01')], 'not-a-date', '2026-01-31')).toEqual({
      days: 30,
      neverExported: true,
    });
  });
});