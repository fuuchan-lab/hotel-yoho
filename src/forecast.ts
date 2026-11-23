/**
 * ホテルの「予報」: 都市・日付（その日にチェックインして 1 泊）ごとに、5 段階の顔で表す。
 *
 * - 実データ（live）: 中継サーバー（worker/）が楽天トラベルの空室検索 API で集めた、空室のあるホテルの数と、
 *   安いほうから 30 軒の料金の中央値。その都市のふだんの料金（ref）・空室の多い日の数と比べる。
 * - 推定（estimate）: 実データがまだない日は、曜日・祝日・年末年始などの時期・大型イベントから見積もる。
 *   画面には「推定」と明記する。
 */
import { CITIES, type City, type CityId } from './cities.ts'
import { addDays, diffDays, parseYmd, weekday, type Ymd } from './dates.ts'
import { eventWeightForNight, type BigEvent } from './events.ts'
import { isDayOff, isHoliday } from './holidays.ts'

/** 0 = とても空いている（笑顔）… 4 = 満室に近く高騰（困った顔） */
export type Mood = 0 | 1 | 2 | 3 | 4

export const MOODS: Mood[] = [0, 1, 2, 3, 4]

/** 中継サーバーが返す、1 日分の観測 */
export interface DayObs {
  /** 空室のあるホテルの数 */
  v: number
  /** 安いほうから最大 30 軒の、1 人 1 泊の料金の中央値（円）。空室がなければ null */
  p: number | null
  /** いちばん安い料金（円） */
  lo: number | null
  /** 観測した時刻（ミリ秒） */
  at: number
}

export interface CityData {
  /** 検索範囲のホテルの総数（楽天トラベルに載っている施設） */
  total: number | null
  /** ふだんの料金（観測した中央値の長期の平均） */
  ref: number | null
  days: Record<Ymd, DayObs>
}

export interface Summary {
  updatedAt: number
  cities: Partial<Record<CityId, CityData>>
}

export type ReasonKey =
  | 'weekend'
  | 'holidayEve'
  | 'sundayNight'
  | 'yearEnd'
  | 'newYear'
  | 'christmas'
  | 'obon'
  | 'goldenWeek'
  | 'sakura'
  | 'autumnLeaves'
  | 'lowSeason'
  | 'event'
  | 'nearEvent'
  | 'fewRooms'
  | 'manyRooms'
  | 'highPrice'
  | 'lowPrice'
  | 'soldOut'

export interface Reason {
  key: ReasonKey
  /** イベントの時 */
  event?: BigEvent
}

export interface DayForecast {
  city: CityId
  date: Ymd
  mood: Mood
  source: 'live' | 'estimate'
  /** live の時: 料金の中央値（円） */
  price?: number | null
  /** live の時: いちばん安い料金（円） */
  low?: number | null
  /** live の時: ふだんの料金との比（1 = ふだんどおり） */
  priceIndex?: number | null
  /** live の時: 空室のあるホテルの数 */
  vacant?: number
  /** live の時: 空室の多い日を 1 とした、空室の多さ */
  vacancyIndex?: number | null
  observedAt?: number
  reasons: Reason[]
}

/** 実データを使う期限。これより古い観測は推定に戻す */
export const LIVE_MAX_AGE_MS = 3 * 24 * 3_600_000

function median(values: number[]): number | null {
  if (values.length === 0) return null
  const s = [...values].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

function percentile(values: number[], q: number): number | null {
  if (values.length === 0) return null
  const s = [...values].sort((a, b) => a - b)
  return s[Math.min(s.length - 1, Math.max(0, Math.round(q * (s.length - 1))))]
}

/** その都市の比べる基準: ふだんの料金と、空室の多い日（上位 10%）の空室数 */
export interface CityBaseline {
  price: number | null
  vacant: number | null
}

export function cityBaseline(data: CityData | undefined): CityBaseline {
  if (!data) return { price: null, vacant: null }
  const obs = Object.values(data.days)
  const prices = obs.map((o) => o.p).filter((p): p is number => typeof p === 'number' && p > 0)
  const vacants = obs.map((o) => o.v).filter((v) => Number.isFinite(v))
  return {
    price: data.ref && data.ref > 0 ? data.ref : median(prices),
    vacant: percentile(vacants, 0.9),
  }
}

export function pricePoints(index: number): number {
  if (index <= 0.92) return -1
  if (index <= 1.05) return 0
  if (index <= 1.2) return 1
  if (index <= 1.45) return 2
  return 3
}

export function vacancyPoints(index: number): number {
  if (index >= 0.85) return -1
  if (index >= 0.65) return 0
  if (index >= 0.45) return 1
  if (index >= 0.25) return 2
  return 3
}

export function moodFromLivePoints(points: number): Mood {
  if (points <= -1) return 0
  if (points <= 0) return 1
  if (points <= 2) return 2
  if (points <= 4) return 3
  return 4
}

export function moodFromEstimateScore(score: number): Mood {
  if (score <= -1) return 0
  if (score < 1) return 1
  if (score < 2.5) return 2
  if (score < 4) return 3
  return 4
}

export function liveForecast(city: CityId, date: Ymd, obs: DayObs, base: CityBaseline): DayForecast {
  const reasons: Reason[] = []
  const priceIndex = obs.p && base.price ? obs.p / base.price : null
  const vacancyIndex = base.vacant && base.vacant > 0 ? obs.v / base.vacant : null
  let mood: Mood
  if (obs.v <= 0 || obs.p === null) {
    mood = 4
    reasons.push({ key: 'soldOut' })
  } else {
    const pp = priceIndex === null ? 0 : pricePoints(priceIndex)
    const vp = vacancyIndex === null ? 0 : vacancyPoints(vacancyIndex)
    mood = moodFromLivePoints(pp + vp)
    if (vp >= 2) reasons.push({ key: 'fewRooms' })
    else if (vp < 0) reasons.push({ key: 'manyRooms' })
    if (pp >= 2) reasons.push({ key: 'highPrice' })
    else if (pp < 0) reasons.push({ key: 'lowPrice' })
  }
  return {
    city,
    date,
    mood,
    source: 'live',
    price: obs.p,
    low: obs.lo,
    priceIndex,
    vacant: obs.v,
    vacancyIndex,
    observedAt: obs.at,
    reasons,
  }
}

/** 季節の要因（その夜の点数と理由） */
function seasonFactors(city: City, night: Ymd): { score: number; reasons: Reason[] } {
  const { m, d } = parseYmd(night)
  const md = m * 100 + d
  const reasons: Reason[] = []
  let score = 0
  if (md >= 1227 && md <= 1231) {
    score += md >= 1230 ? 1.5 : 1
    reasons.push({ key: 'yearEnd' })
  } else if (md >= 102 && md <= 103) {
    score += 1
    reasons.push({ key: 'newYear' })
  } else if (md >= 1223 && md <= 1224) {
    score += 0.5
    reasons.push({ key: 'christmas' })
  } else if (md >= 811 && md <= 816) {
    score += 1
    reasons.push({ key: 'obon' })
  } else if (md >= 502 && md <= 504) {
    score += 1
    reasons.push({ key: 'goldenWeek' })
  } else if (md >= 325 && md <= 408) {
    score += city.id === 'kyoto' ? 2 : city.id === 'tokyo' || city.id === 'osaka' ? 1 : 0.5
    reasons.push({ key: 'sakura' })
  } else if (city.id === 'kyoto' && md >= 1110 && md <= 1205) {
    score += 1.5
    reasons.push({ key: 'autumnLeaves' })
  } else if (md >= 106 && md <= 131) {
    score -= 1
    reasons.push({ key: 'lowSeason' })
  }
  return { score, reasons }
}

/** 曜日・祝日の要因。date にチェックインして、翌朝が休みの夜（土曜・祝前日）がいちばん混む */
function weekdayFactors(night: Ymd): { score: number; reasons: Reason[] } {
  const next = addDays(night, 1)
  const w = weekday(night)
  if (isDayOff(next) && !(w === 0 && !isHoliday(next) && !isHoliday(night))) {
    // 翌日が休み: 土曜の夜、祝日の前の夜、連休中の夜
    if (w === 6) return { score: 2, reasons: [{ key: 'weekend' }] }
    return { score: 2, reasons: [{ key: 'holidayEve' }] }
  }
  if (w === 5) return { score: 1, reasons: [{ key: 'weekend' }] }
  if (isDayOff(night)) return { score: -1, reasons: [{ key: 'sundayNight' }] }
  return { score: 0, reasons: [] }
}

/** イベントの規模ごとの重み（1 万人のアリーナ公演より、5 万人のドーム・巨大な展示会がずっと効く） */
const SCALE_WEIGHT = { 1: 0.6, 2: 1.6, 3: 3 } as const

/** ホテルの多さ。大きな都市ほど、1 つのイベントで埋まりにくい */
const CAPACITY: Partial<Record<CityId, number>> = { tokyo: 2, osaka: 1.4, yokohama: 1.2, nagoya: 1.2, fukuoka: 1.1, sapporo: 1.1 }

/** 重なったイベント: いちばん大きいものに、ほかを少しだけ足す */
function combine(weights: number[]): number {
  if (weights.length === 0) return 0
  const sorted = [...weights].sort((a, b) => b - a)
  return sorted[0] + 0.3 * sorted.slice(1).reduce((s, w) => s + w, 0)
}

export function estimateForecast(cityId: CityId, night: Ymd, events: BigEvent[]): DayForecast {
  const city = CITIES.find((c) => c.id === cityId)!
  const wk = weekdayFactors(night)
  const season = seasonFactors(city, night)
  const own: number[] = []
  const near: number[] = []
  const reasons: Reason[] = [...wk.reasons, ...season.reasons]
  for (const e of events) {
    // 何週間も続くもの（クリスマス市・イルミネーションなど）は、毎晩の宿泊への影響が小さい
    const w = eventWeightForNight(e, night) * (diffDays(e.end, e.start) > 7 ? 0.3 : 1)
    if (w === 0) continue
    if (e.city === cityId) {
      own.push((SCALE_WEIGHT[e.scale] ?? 1) * w)
      reasons.push({ key: 'event', event: e })
    } else if (city.near.includes(e.city) && e.scale >= 2) {
      near.push((SCALE_WEIGHT[e.scale] ?? 1) * w * 0.4)
      reasons.push({ key: 'nearEvent', event: e })
    }
  }
  const eventScore = Math.min(4, combine(own) / (CAPACITY[cityId] ?? 1))
  const nearScore = Math.min(1.5, combine(near))
  const score = city.base + wk.score + season.score + eventScore + nearScore
  return { city: cityId, date: night, mood: moodFromEstimateScore(score), source: 'estimate', reasons }
}

/** 実データ（新しいもの）があればそれを、なければ推定を使う。イベントは、どちらの場合も理由に加える */
export function forecastFor(
  cityId: CityId,
  night: Ymd,
  summary: Summary | null,
  events: BigEvent[],
  now = Date.now(),
): DayForecast {
  const data = summary?.cities[cityId]
  const obs = data?.days[night]
  if (data && obs && now - obs.at <= LIVE_MAX_AGE_MS) {
    const live = liveForecast(cityId, night, obs, cityBaseline(data))
    for (const e of events) {
      if (e.city === cityId && eventWeightForNight(e, night) > 0) live.reasons.push({ key: 'event', event: e })
    }
    return live
  }
  return estimateForecast(cityId, night, events)
}
