/**
 * 利用者が自分の楽天ウェブサービスのキーで集めた観測（access.ts の own）。
 * 端末から楽天の API に直接問い合わせ（キーは楽天にだけ送る）、結果を端末に覚えておく。
 * 「ふだん」との比べ方（その都市のふだんの料金・空室の多い日の空室数）は、中継サーバーの /baseline を使う
 */
import { searchVacant } from '../worker/src/rakuten.js'
import { cityById, isCityId, type CityId } from './cities.ts'
import { addDays, todayJst, type Ymd } from './dates.ts'
import type { CityData, DayObs, Summary } from './forecast.ts'

export interface RakutenKeys {
  appId: string
  accessKey: string
}

const OWN_KEY = 'hotelyoho-own-obs'

/** これより新しい観測があれば、問い合わせ直さない */
export const OWN_FRESH_MS = 6 * 3_600_000

/** 楽天ウェブサービスの目安（1 秒に 1 回まで）より少し間を空ける */
export const OWN_GAP_MS = 1100

export type OwnObs = Record<string, Record<Ymd, DayObs>>

/** 端末に覚えた観測（今日より前の日付は捨てる） */
export function loadOwn(today: Ymd = todayJst()): OwnObs {
  try {
    const raw = JSON.parse(localStorage.getItem(OWN_KEY) ?? 'null') as unknown
    if (typeof raw !== 'object' || raw === null) return {}
    const out: OwnObs = {}
    for (const [id, days] of Object.entries(raw as Record<string, Record<string, DayObs>>)) {
      if (!isCityId(id) || typeof days !== 'object' || days === null) continue
      const kept: Record<Ymd, DayObs> = {}
      for (const [date, o] of Object.entries(days)) {
        if (date >= today && o && typeof o.v === 'number' && typeof o.at === 'number') kept[date] = o
      }
      if (Object.keys(kept).length > 0) out[id] = kept
    }
    return out
  } catch {
    return {}
  }
}

export function saveOwn(own: OwnObs) {
  try {
    localStorage.setItem(OWN_KEY, JSON.stringify(own))
  } catch {
    // 保存できなくても、その回は表示できる
  }
}

export function clearOwn() {
  try {
    localStorage.removeItem(OWN_KEY)
  } catch {
    // 消せなくても困らない
  }
}

/** 中継サーバーの /baseline: 都市ごとの、ふだんの料金（ref）と、空室の多い日の空室数（vref） */
export interface Baseline {
  updatedAt: number
  cities: Partial<Record<CityId, { ref: number | null; vref: number | null }>>
}

/** 自分の観測に、比べる基準を合わせて、予報が読む形（Summary）にする */
export function ownSummary(own: OwnObs, baseline: Baseline | null): Summary {
  const cities: Summary['cities'] = {}
  let updatedAt = 0
  for (const [id, days] of Object.entries(own)) {
    if (!isCityId(id)) continue
    const base = baseline?.cities[id]
    const data: CityData = { total: null, ref: base?.ref ?? null, vref: base?.vref ?? null, days }
    cities[id] = data
    for (const o of Object.values(days)) updatedAt = Math.max(updatedAt, o.at)
  }
  return { updatedAt, cities }
}

export type FetchOne = { ok: true; obs: DayObs } | { ok: false; retryLater: boolean; error: string }

/** 1 都市・1 泊を、自分のキーで楽天に問い合わせる */
export async function fetchOwn(keys: RakutenKeys, city: CityId, checkin: Ymd, now = Date.now()): Promise<FetchOne> {
  const info = cityById(city)
  if (!info) return { ok: false, retryLater: false, error: 'unknown-city' }
  try {
    const res = await searchVacant({ RAKUTEN_APP_ID: keys.appId, RAKUTEN_ACCESS_KEY: keys.accessKey }, info, checkin, addDays(checkin, 1))
    if (res.obs) return { ok: true, obs: { ...res.obs, at: now } }
    return { ok: false, retryLater: res.retryLater === true, error: res.error }
  } catch (e) {
    // 通信できない時は、あとでやり直す
    return { ok: false, retryLater: true, error: e instanceof Error ? e.message : String(e) }
  }
}
