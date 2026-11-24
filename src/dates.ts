/**
 * 日付は 'YYYY-MM-DD'（日本時間の暦の日付）で扱う。時刻を持たないので、計算は UTC の 0 時で行う。
 */

export type Ymd = string

/** 予報する日数（今日を含む）。おおよそ 3 か月 */
export const HORIZON_DAYS = 92

export function ymd(year: number, month: number, day: number): Ymd {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function parseYmd(s: Ymd): { y: number; m: number; d: number } {
  const [y, m, d] = s.split('-').map(Number)
  return { y, m, d }
}

function toUtc(s: Ymd): Date {
  const { y, m, d } = parseYmd(s)
  return new Date(Date.UTC(y, m - 1, d))
}

function fromUtc(date: Date): Ymd {
  return ymd(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate())
}

export function addDays(s: Ymd, n: number): Ymd {
  const date = toUtc(s)
  date.setUTCDate(date.getUTCDate() + n)
  return fromUtc(date)
}

/** 0 = 日曜 … 6 = 土曜 */
export function weekday(s: Ymd): number {
  return toUtc(s).getUTCDay()
}

export function diffDays(a: Ymd, b: Ymd): number {
  return Math.round((toUtc(a).getTime() - toUtc(b).getTime()) / 86_400_000)
}

/** 日本時間の今日 */
export function todayJst(now = Date.now()): Ymd {
  return fromUtc(new Date(now + 9 * 3_600_000))
}

/** start から n 日分 */
export function dateRange(start: Ymd, n: number): Ymd[] {
  return Array.from({ length: n }, (_, i) => addDays(start, i))
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}
