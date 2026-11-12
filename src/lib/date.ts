export const WEEKDAYS_CN = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

export function isValidDateKey(key: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
  const [year, month, day] = key.split('-').map(Number);
  const date = new Date(year, month - 1, day, 12, 0, 0, 0);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

export function todayKey(): string {
  return toDateKey(new Date());
}

export function addDays(key: string, amount: number): string {
  const date = parseDateKey(key);
  date.setDate(date.getDate() + amount);
  return toDateKey(date);
}

export function addMonths(key: string, amount: number): string {
  const date = parseDateKey(key);
  date.setDate(1);
  date.setMonth(date.getMonth() + amount);
  return toDateKey(date);
}

export function startOfWeek(key: string, weekStartsOn: 0 | 1 = 1): string {
  const date = parseDateKey(key);
  const diff = (date.getDay() - weekStartsOn + 7) % 7;
  date.setDate(date.getDate() - diff);
  return toDateKey(date);
}

export function endOfWeek(key: string, weekStartsOn: 0 | 1 = 1): string {
  return addDays(startOfWeek(key, weekStartsOn), 6);
}

export function startOfMonth(key: string): string {
  const date = parseDateKey(key);
  date.setDate(1);
  return toDateKey(date);
}

export function endOfMonth(key: string): string {
  const date = parseDateKey(key);
  date.setMonth(date.getMonth() + 1, 0);
  return toDateKey(date);
}

export function getWeekDates(key: string, weekStartsOn: 0 | 1 = 1): string[] {
  const start = startOfWeek(key, weekStartsOn);
  return Array.from({ length: 7 }, (_, index) => addDays(start, index));
}

export function getLastNDays(endKey: string, count: number): string[] {
  return Array.from({ length: count }, (_, index) => addDays(endKey, index - count + 1));
}

export function getMonthDates(key: string): string[] {
  const start = startOfMonth(key);
  const end = endOfMonth(key);
  const dates: string[] = [];
  let cursor = start;
  while (cursor <= end) {
    dates.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return dates;
}

export function daysBetween(startKey: string, endKey: string): number {
  const start = parseDateKey(startKey).getTime();
  const end = parseDateKey(endKey).getTime();
  return Math.round((end - start) / 86_400_000);
}

export function isToday(key: string): boolean {
  return key === todayKey();
}

export function isFuture(key: string): boolean {
  return key > todayKey();
}

export function formatDate(key: string, options: { withYear?: boolean; withWeekday?: boolean } = {}): string {
  const date = parseDateKey(key);
  const base = `${date.getMonth() + 1}月${date.getDate()}日`;
  const weekday = options.withWeekday === false ? '' : ` ${WEEKDAYS_CN[date.getDay()]}`;
  return `${options.withYear ? `${date.getFullYear()}年` : ''}${base}${weekday}`;
}

export function formatRelativeDate(key: string): string {
  const today = todayKey();
  if (key === today) return '今天';
  if (key === addDays(today, -1)) return '昨天';
  if (key === addDays(today, 1)) return '明天';
  return formatDate(key);
}

export function formatWeekRange(key: string, weekStartsOn: 0 | 1 = 1): string {
  const start = startOfWeek(key, weekStartsOn);
  const end = endOfWeek(key, weekStartsOn);
  return `${formatDate(start, { withWeekday: false })} – ${formatDate(end, { withWeekday: false })}`;
}

export function formatMonth(key: string): string {
  const date = parseDateKey(key);
  return `${date.getFullYear()}年${date.getMonth() + 1}月`;
}

export function formatMonthShort(key: string): string {
  const date = parseDateKey(key);
  return `${date.getMonth() + 1}月`;
}

export function formatTime(iso: string): string {
  const date = new Date(iso);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function weekdayShort(key: string): string {
  return WEEKDAYS_CN[parseDateKey(key).getDay()].replace('周', '');
}

export function isSameMonth(a: string, b: string): boolean {
  return a.slice(0, 7) === b.slice(0, 7);
}

export type StatsPeriod = 'week' | 'month' | '30d';

export function getPeriodRange(
  period: StatsPeriod,
  reference: string,
  weekStartsOn: 0 | 1,
): { start: string; end: string; label: string } {
  if (period === 'week') {
    return {
      start: startOfWeek(reference, weekStartsOn),
      end: endOfWeek(reference, weekStartsOn),
      label: formatWeekRange(reference, weekStartsOn),
    };
  }
  if (period === 'month') {
    return {
      start: startOfMonth(reference),
      end: endOfMonth(reference),
      label: formatMonth(reference),
    };
  }
  return {
    start: addDays(reference, -29),
    end: reference,
    label: '最近 30 天',
  };
}

export function getLastMonths(reference: string, count: number): string[] {
  const current = startOfMonth(reference);
  return Array.from({ length: count }, (_, index) => addMonths(current, index - count + 1));
}
