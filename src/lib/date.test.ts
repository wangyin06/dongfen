import { describe, expect, it } from 'vitest';
import { addDays, daysBetween, isValidDateKey, startOfWeek } from './date';

describe('isValidDateKey', () => {
  it('accepts real calendar dates', () => {
    expect(isValidDateKey('2026-02-28')).toBe(true);
    expect(isValidDateKey('2024-02-29')).toBe(true);
  });

  it('rejects impossible or malformed dates', () => {
    expect(isValidDateKey('2026-02-30')).toBe(false);
    expect(isValidDateKey('2026-13-01')).toBe(false);
    expect(isValidDateKey('2026-99-99')).toBe(false);
    expect(isValidDateKey('2026-1-1')).toBe(false);
  });
});

describe('date helpers', () => {
  it('moves across month boundaries', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('counts inclusive day distance', () => {
    expect(daysBetween('2026-11-09', '2026-11-12')).toBe(3);
  });

  it('starts weeks on Monday by default', () => {
    expect(startOfWeek('2026-11-12', 1)).toBe('2026-11-09');
  });
});