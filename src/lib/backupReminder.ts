import type { WorkoutRecord } from '../types';
import { daysBetween, isValidDateKey, toDateKey } from './date';

export const BACKUP_REMINDER_DAYS = 30;

export type BackupReminder = {
  days: number;
  neverExported: boolean;
};

function exportDateKey(value: string): string | null {
  const trimmed = value.trim();
  if (isValidDateKey(trimmed)) return trimmed;
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return null;
  return toDateKey(date);
}

/**
 * 只在“确实很久没有备份”时返回提示：
 * - 有记录，且最近一次导出距今 >= 30 天；
 * - 从没导出过，但最早一条记录距今 >= 30 天。
 */
export function getBackupReminder(
  records: WorkoutRecord[],
  lastExportAt: string | undefined,
  today: string,
): BackupReminder | null {
  if (records.length === 0) return null;

  if (lastExportAt) {
    const exportedOn = exportDateKey(lastExportAt);
    if (exportedOn) {
      const days = daysBetween(exportedOn, today);
      return days >= BACKUP_REMINDER_DAYS ? { days, neverExported: false } : null;
    }
  }

  const oldest = records.reduce(
    (min, record) => (record.date < min ? record.date : min),
    records[0].date,
  );
  const days = daysBetween(oldest, today);
  return days >= BACKUP_REMINDER_DAYS ? { days, neverExported: true } : null;
}