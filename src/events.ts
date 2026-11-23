/**
 * 大型イベント（public/data/events.json）。主催者・会場の公式発表で日程を確かめたものだけを載せる（手で更新する）。
 */
import type { CityId } from './cities.ts'
import { addDays, type Ymd } from './dates.ts'

export type EventCategory = 'live' | 'fes' | 'concert' | 'sports' | 'expo' | 'festival'

export const EVENT_CATEGORIES: EventCategory[] = ['live', 'fes', 'concert', 'sports', 'expo', 'festival']

export interface BigEvent {
  id: string
  city: CityId
  start: Ymd
  end: Ymd
  venue: { ja: string; en: string }
  title: { ja: string; en: string }
  category: EventCategory
  /** 規模: 1 = 1〜2 万人/日（アリーナ）、2 = 2〜5 万人/日（ドーム・大型展示会）、3 = 5 万人/日以上、または何日も続く巨大なもの */
  scale: 1 | 2 | 3
  url: string
}

export function isValidEvent(e: unknown): e is BigEvent {
  if (typeof e !== 'object' || e === null) return false
  const v = e as Partial<BigEvent>
  return (
    typeof v.id === 'string' &&
    typeof v.city === 'string' &&
    typeof v.start === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(v.start) &&
    typeof v.end === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(v.end) &&
    typeof v.title?.ja === 'string' &&
    typeof v.category === 'string' &&
    EVENT_CATEGORIES.includes(v.category as EventCategory)
  )
}

/** その日に開かれているイベント */
export function eventsOn(events: BigEvent[], date: Ymd, city?: CityId): BigEvent[] {
  return events.filter((e) => (!city || e.city === city) && e.start <= date && date <= e.end)
}

/**
 * その夜（date にチェックイン）の宿泊需要への、イベントの影響の重み。
 * 開催日の夜は 1、前夜（遠くから前日に来る人）は 0.5
 */
export function eventWeightForNight(e: BigEvent, night: Ymd): number {
  if (e.start <= night && night <= e.end) return 1
  if (night === addDays(e.start, -1)) return 0.5
  return 0
}

export async function loadEvents(): Promise<BigEvent[]> {
  const res = await fetch('./data/events.json', { cache: 'no-cache' })
  if (!res.ok) throw new Error(`events-${res.status}`)
  const data = (await res.json()) as unknown
  return Array.isArray(data) ? data.filter(isValidEvent).sort((a, b) => a.start.localeCompare(b.start)) : []
}
