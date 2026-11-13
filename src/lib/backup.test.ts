import { describe, expect, it } from 'vitest';
import type { BackupData } from '../types';
import { backupToJson, parseBackupJson } from './backup';

const now = new Date().toISOString();

const backup: BackupData = {
  app: 'dongfen',
  schemaVersion: 1,
  exportedAt: now,
  settings: {
    weeklyGoal: 13,
    hardDayLimit: 4,
    easyDayLimit: 2,
    weekStartsOn: 1,
    defaultQuality: 1,
  },
  customExercises: [],
  records: [
    {
      id: 'record-1',
      date: '2026-11-11',
      exerciseId: 'standard_push',
      exerciseName: '标准俯卧撑',
      category: 'push',
      group: '水平推',
      unitType: 'reps',
      unitScore: 0.3,
      perSide: false,
      quality: 1,
      amount: 10,
      createdAt: now,
      updatedAt: now,
    },
  ],
};

describe('backup validation', () => {
  it('round-trips a valid backup', () => {
    const result = parseBackupJson(backupToJson(backup));
    expect(result.error).toBeUndefined();
    expect(result.data?.records).toHaveLength(1);
  });

  it('rejects impossible dates', () => {
    const invalid = {
      ...backup,
      records: [{ ...backup.records[0], date: '2026-02-30' }],
    };
    expect(parseBackupJson(JSON.stringify(invalid)).data).toBeUndefined();
  });

  it('rejects records without an amount', () => {
    const invalid = {
      ...backup,
      records: [{ ...backup.records[0], amount: undefined }],
    };
    expect(parseBackupJson(JSON.stringify(invalid)).data).toBeUndefined();
  });
});