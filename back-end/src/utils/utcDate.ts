import {
  addDateOnlyDays,
  formatDateOnly,
  parseDateOnlyToUtcDate,
  todayDateOnlyUtc,
} from './dateOnly';

export function parseUtcDateOnly(value: string | Date): Date {
  return parseDateOnlyToUtcDate(value);
}

export function formatUtcDateOnly(value: string | Date): string {
  return formatDateOnly(value);
}

export function addUtcDays(value: string | Date, days: number): Date {
  return parseDateOnlyToUtcDate(addDateOnlyDays(value, days));
}

export function startOfUtcToday(): Date {
  return parseDateOnlyToUtcDate(todayDateOnlyUtc());
}

export function formatUtcDateTimeForSql(value: string | Date): string {
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`유효하지 않은 날짜입니다: ${value}`);
  }

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
