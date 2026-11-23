/**
 * 日本の祝日（国民の祝日に関する法律）を計算する。2020・2021 年の東京五輪の特例は扱わない（2022 年以降が対象）。
 * 春分・秋分の日は、国立天文台の推算に基づく近似式（2099 年まで有効）。
 */
import { addDays, weekday, ymd, type Ymd } from './dates.ts'

export interface Holiday {
  date: Ymd
  name: { ja: string; en: string }
}

/** month 月の n 番目の月曜日 */
function nthMonday(year: number, month: number, n: number): number {
  const first = new Date(Date.UTC(year, month - 1, 1)).getUTCDay()
  const firstMonday = 1 + ((8 - first) % 7)
  return firstMonday + (n - 1) * 7
}

function springEquinox(year: number): number {
  return Math.floor(20.8431 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4))
}

function autumnEquinox(year: number): number {
  return Math.floor(23.2488 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4))
}

const cache = new Map<number, Map<Ymd, Holiday['name']>>()

function holidaysOfYear(year: number): Map<Ymd, Holiday['name']> {
  const hit = cache.get(year)
  if (hit) return hit
  const map = new Map<Ymd, Holiday['name']>()
  const add = (m: number, d: number, ja: string, en: string) => map.set(ymd(year, m, d), { ja, en })

  add(1, 1, '元日', "New Year's Day")
  add(1, nthMonday(year, 1, 2), '成人の日', 'Coming of Age Day')
  add(2, 11, '建国記念の日', 'National Foundation Day')
  add(2, 23, '天皇誕生日', "Emperor's Birthday")
  add(3, springEquinox(year), '春分の日', 'Vernal Equinox Day')
  add(4, 29, '昭和の日', 'Showa Day')
  add(5, 3, '憲法記念日', 'Constitution Day')
  add(5, 4, 'みどりの日', 'Greenery Day')
  add(5, 5, 'こどもの日', "Children's Day")
  add(7, nthMonday(year, 7, 3), '海の日', 'Marine Day')
  add(8, 11, '山の日', 'Mountain Day')
  add(9, nthMonday(year, 9, 3), '敬老の日', 'Respect for the Aged Day')
  add(9, autumnEquinox(year), '秋分の日', 'Autumnal Equinox Day')
  add(10, nthMonday(year, 10, 2), 'スポーツの日', 'Sports Day')
  add(11, 3, '文化の日', 'Culture Day')
  add(11, 23, '勤労感謝の日', 'Labor Thanksgiving Day')

  // 国民の休日: 前後を祝日に挟まれた平日（9 月に起こる）
  const base = [...map.keys()].sort()
  for (const date of base) {
    const next = addDays(date, 1)
    const after = addDays(date, 2)
    if (!map.has(next) && map.has(after) && weekday(next) !== 0) map.set(next, { ja: '国民の休日', en: "Citizens' Holiday" })
  }

  // 振替休日: 祝日が日曜なら、その後のいちばん近い祝日でない日
  for (const date of [...map.keys()].sort()) {
    if (weekday(date) !== 0) continue
    let sub = addDays(date, 1)
    while (map.has(sub)) sub = addDays(sub, 1)
    map.set(sub, { ja: '振替休日', en: 'Substitute Holiday' })
  }

  cache.set(year, map)
  return map
}

export function holidayName(date: Ymd): Holiday['name'] | null {
  return holidaysOfYear(Number(date.slice(0, 4))).get(date) ?? null
}

export function isHoliday(date: Ymd): boolean {
  return holidayName(date) !== null
}

/** 土日・祝日（仕事が休みの日） */
export function isDayOff(date: Ymd): boolean {
  const w = weekday(date)
  return w === 0 || w === 6 || isHoliday(date)
}
