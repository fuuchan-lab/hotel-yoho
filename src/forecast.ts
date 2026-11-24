/**
 * ホテルの「予報」: 都市・日付（その日にチェックインして 1 泊）ごとに、客室稼働率（何 % 埋まるか）の目安を見積もり、5 段階の顔で表す。
 *
 * 土台は観光庁「宿泊旅行統計調査」の、都道府県・月ごとのシティホテル・ビジネスホテルの客室稼働率（src/occupancy.ts）。
 * そこに、都市の性格（出張中心・観光中心）ごとの曜日・連休の差、年末年始・お盆などの時期、大型イベントを足し引きする。
 * ホテルの料金は、埋まるほど上がる（客室の多くが売れると、残りの部屋の値段が上がる）ので、稼働率の高さ＝料金の高騰とみなす。
 * すべて推定で、実際の空室・料金を調べたものではない（画面にも明記する）。
 */
import { cityById, type City, type CityId } from './cities.ts'
import { addDays, diffDays, parseYmd, weekday, type Ymd } from './dates.ts'
import { type BigEvent } from './events.ts'
import { isDayOff } from './holidays.ts'
import { OCCUPANCY } from './occupancy.ts'

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
  /** 安いほうから最大 30 軒の料金の、下から 1/4・3/4 の値（円）と、料金の分かった軒数 */
  q1?: number | null
  q3?: number | null
  n?: number
  /** 最高の料金（円） */
  hi?: number | null
  /** 安い 3 軒（名前・料金）。自分のキーで集めた時 */
  h?: { n: string; c: number }[]
  /** 観測した時刻（ミリ秒） */
  at: number
}

export interface CityData {
  /** 検索範囲のホテルの総数（楽天トラベルに載っている施設） */
  total: number | null
  /** ふだんの料金（観測した中央値の長期の平均） */
  ref: number | null
  /** 空室の多い日の空室数（分かっていれば。なければ days から求める） */
  vref?: number | null
  days: Record<Ymd, DayObs>
}

export interface Summary {
  updatedAt: number
  cities: Partial<Record<CityId, CityData>>
}

export type ReasonKey =
  | 'weekend'
  | 'holidayEve'
  | 'longWeekend'
  | 'sundayNight'
  | 'yearEnd'
  | 'newYear'
  | 'christmas'
  | 'obon'
  | 'goldenWeek'
  | 'sakura'
  | 'autumnLeaves'
  | 'busySeason'
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
  /** live = 楽天トラベルの観測から、estimate = 統計・曜日・イベントからの推定 */
  source: 'live' | 'estimate'
  /** 統計から見積もった、客室稼働率の目安（%）。live の時も参考に持つ */
  occupancy: number
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
    vacant: data.vref && data.vref > 0 ? data.vref : percentile(vacants, 0.9),
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

export function liveForecast(city: CityId, date: Ymd, obs: DayObs, base: CityBaseline, occupancy = 0): DayForecast {
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
    occupancy,
    price: obs.p,
    low: obs.lo,
    priceIndex,
    vacant: obs.v,
    vacancyIndex,
    observedAt: obs.at,
    reasons,
  }
}

/** 稼働率の目安（%）から顔へ。全国のシティ・ビジネスホテルの年平均は約 75%（2025 年） */
export function moodFromOccupancy(occ: number): Mood {
  if (occ < 66) return 0
  if (occ < 76) return 1
  if (occ < 85) return 2
  if (occ < 92) return 3
  return 4
}

/**
 * その都道府県のその日の稼働率（月の値を、月の半ばを中心に前後の月となめらかにつなぐ）と、年平均
 */
function baseOccupancy(city: City, night: Ymd): { occ: number; annual: number; month: number } {
  const table = OCCUPANCY[city.pref.ja]
  if (!table) return { occ: 75, annual: 75, month: 75 }
  const { y, m, d } = parseYmd(night)
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate()
  const pos = (d - 0.5) / days - 0.5 // -0.5（月初）… +0.5（月末）
  const cur = table[m - 1]
  const other = pos < 0 ? table[(m + 10) % 12] : table[m % 12]
  const occ = cur + (other - cur) * Math.abs(pos)
  const annual = table.reduce((s, v) => s + v, 0) / 12
  return { occ, annual, month: cur }
}

/** その都市の都道府県の、年平均の稼働率（%）。推移のグラフで「ふだん」として使う */
export function annualOccupancy(cityId: CityId): number {
  const table = OCCUPANCY[cityById(cityId)?.pref.ja ?? '']
  return table ? table.reduce((s, v) => s + v, 0) / 12 : 75
}

/** 曜日・連休の差（ポイント）。出張中心の都市は平日も埋まり、観光中心の都市は休みの前の夜に混む */
const NIGHT_ADJ = {
  business: { weekday: 2, eve: 2, mid: 5, last: -9, long: 0 },
  mixed: { weekday: -2, eve: 4, mid: 9, last: -10, long: 3 },
  leisure: { weekday: -5, eve: 6, mid: 13, last: -12, long: 5 },
} as const

/** 休みの日（土日・祝日に加え、多くの人が休む年末年始 12/29〜1/3） */
function isOff(date: Ymd): boolean {
  const { m, d } = parseYmd(date)
  return isDayOff(date) || (m === 12 && d >= 29) || (m === 1 && d <= 3)
}

/** その日から続く休みの日数（その日が休みでなければ 0） */
function offRun(date: Ymd): number {
  let n = 0
  let d = date
  while (isOff(d) && n < 10) {
    n++
    d = addDays(d, 1)
  }
  return n
}

/** 曜日・祝日・連休の要因。date にチェックインして、翌朝も休みの夜がいちばん混む */
function nightFactors(city: City, night: Ymd): { adj: number; reasons: Reason[] } {
  const a = NIGHT_ADJ[city.kind]
  const next = addDays(night, 1)
  const offTonight = isOff(night)
  if (!isOff(next)) {
    // 翌朝が仕事の日: 休みの最後の夜（日曜の夜など）は空く
    return offTonight ? { adj: a.last, reasons: [{ key: 'sundayNight' }] } : { adj: a.weekday, reasons: [] }
  }
  // 翌朝が休み。3 連休以上の中の夜（前夜を含む）は、さらに混む
  let before = 0
  for (let d = night; isOff(d) && before < 10; d = addDays(d, -1)) before++
  const long = before + offRun(next) >= 3
  const key = weekday(night) === 6 || weekday(night) === 5 ? 'weekend' : 'holidayEve'
  const reasons: Reason[] = [{ key }]
  let adj = offTonight ? a.mid : a.eve
  if (long) {
    adj += a.long
    reasons.push({ key: 'longWeekend' })
  }
  return { adj, reasons }
}

/** 時期の要因（月の値に入りきらない、数日だけの山・谷）と、その月がふだんより混む・空くか */
function seasonFactors(city: City, night: Ymd, month: number, annual: number): { adj: number; reasons: Reason[] } {
  const { m, d } = parseYmd(night)
  const md = m * 100 + d
  const reasons: Reason[] = []
  let adj = 0
  const byKind = (business: number, mixed: number, leisure: number) =>
    city.kind === 'business' ? business : city.kind === 'leisure' ? leisure : mixed
  if (md >= 1228 || md <= 103) {
    // 年末年始: 出張の街は空き、観光地は混む
    adj += byKind(-8, 2, 8)
    reasons.push({ key: md >= 1228 ? 'yearEnd' : 'newYear' })
  } else if (md === 1224) {
    adj += 5
    reasons.push({ key: 'christmas' })
  } else if (md >= 812 && md <= 816) {
    adj += byKind(-5, 3, 6)
    reasons.push({ key: 'obon' })
  } else if (md >= 429 && md <= 505) {
    adj += byKind(-4, 2, 4)
    reasons.push({ key: 'goldenWeek' })
  } else if (md >= 325 && md <= 408) {
    adj += city.id === 'kyoto' ? 6 : city.kind === 'leisure' ? 3 : 1
    reasons.push({ key: 'sakura' })
  } else if (city.id === 'kyoto' && md >= 1115 && md <= 1205) {
    adj += 4
    reasons.push({ key: 'autumnLeaves' })
  }
  if (month >= annual + 5) reasons.push({ key: 'busySeason' })
  else if (month <= annual - 6) reasons.push({ key: 'lowSeason' })
  return { adj, reasons }
}

/** イベントの規模ごとの、稼働率を押し上げる量（ポイント）。1 万人のアリーナより、5 万人のドーム・巨大な展示会がずっと効く */
const SCALE_ADJ = { 1: 5, 2: 13, 3: 22 } as const

/** ホテルの多さ。大きな都市ほど、1 つのイベントで埋まりにくい（人口からおおまかに） */
function capacity(city: City): number {
  return Math.max(1, Math.sqrt(city.pop / 100))
}

/** 重なったイベント: いちばん大きいものに、ほかを少しだけ足す */
function combine(weights: number[]): number {
  if (weights.length === 0) return 0
  const sorted = [...weights].sort((a, b) => b - a)
  return sorted[0] + 0.3 * sorted.slice(1).reduce((s, w) => s + w, 0)
}

interface NightEvent {
  e: BigEvent
  /** その夜への重み（開催日 1・前夜 0.5。何週間も続くものは小さく） */
  w: number
}

/**
 * イベントを「影響する夜」ごとに引けるようにする（予報は都市 × 日付の数だけ何千回も呼ばれるので、
 * そのたびに全部のイベントを日付の計算つきで調べると重い）。イベントの配列ごとに 1 回だけ作る
 */
const nightIndexCache = new WeakMap<BigEvent[], Map<Ymd, NightEvent[]>>()

function eventsByNight(events: BigEvent[]): Map<Ymd, NightEvent[]> {
  let index = nightIndexCache.get(events)
  if (index) return index
  index = new Map()
  for (const e of events) {
    // 何週間も続くもの（クリスマス市・イルミネーションなど）は、毎晩の宿泊への影響が小さい
    const long = diffDays(e.end, e.start) > 7 ? 0.3 : 1
    const add = (night: Ymd, w: number) => {
      const list = index!.get(night)
      if (list) list.push({ e, w: w * long })
      else index!.set(night, [{ e, w: w * long }])
    }
    // 前夜（遠くから前日に来る人）は 0.5、開催日の夜は 1（events.ts の eventWeightForNight と同じ）
    add(addDays(e.start, -1), 0.5)
    for (let d = e.start; d <= e.end; d = addDays(d, 1)) add(d, 1)
  }
  nightIndexCache.set(events, index)
  return index
}

export function estimateForecast(cityId: CityId, night: Ymd, events: BigEvent[]): DayForecast {
  const city = cityById(cityId)!
  const base = baseOccupancy(city, night)
  const nf = nightFactors(city, night)
  const season = seasonFactors(city, night, base.month, base.annual)
  const own: number[] = []
  const near: number[] = []
  const reasons: Reason[] = [...nf.reasons, ...season.reasons]
  for (const { e, w } of eventsByNight(events).get(night) ?? []) {
    if (e.city === cityId) {
      own.push((SCALE_ADJ[e.scale] ?? 5) * w)
      reasons.push({ key: 'event', event: e })
    } else if (city.near.includes(e.city) && e.scale >= 2) {
      near.push((SCALE_ADJ[e.scale] ?? 5) * w * 0.4)
      reasons.push({ key: 'nearEvent', event: e })
    }
  }
  const eventAdj = Math.min(30, combine(own) / capacity(city)) + Math.min(8, combine(near))
  const occ = Math.min(99, Math.max(25, base.occ + nf.adj + season.adj + eventAdj))
  return { city: cityId, date: night, mood: moodFromOccupancy(occ), source: 'estimate', occupancy: Math.round(occ), reasons }
}

/** 全国平均の顔（各都市の顔の平均を四捨五入） */
export function averageMood(moods: Mood[]): Mood {
  if (moods.length === 0) return 2
  const mean = moods.reduce<number>((s, m) => s + m, 0) / moods.length
  return Math.min(4, Math.max(0, Math.round(mean))) as Mood
}

/** 推定は観測と関係なく決まるので、イベントの配列ごとに覚えておく（観測が届くたびに計算し直さない） */
const estimateCache = new WeakMap<BigEvent[], Map<string, DayForecast>>()

function cachedEstimate(cityId: CityId, night: Ymd, events: BigEvent[]): DayForecast {
  let cache = estimateCache.get(events)
  if (!cache) estimateCache.set(events, (cache = new Map()))
  const key = `${cityId}|${night}`
  let f = cache.get(key)
  if (!f) cache.set(key, (f = estimateForecast(cityId, night, events)))
  return f
}

/** 楽天トラベルの観測（新しいもの）があればそれを、なければ統計からの推定を使う。イベント・時期の理由は、どちらの場合も付ける */
export function forecastFor(cityId: CityId, night: Ymd, summary: Summary | null, events: BigEvent[], now = Date.now()): DayForecast {
  const est = cachedEstimate(cityId, night, events)
  const data = summary?.cities[cityId]
  const obs = data?.days[night]
  if (!data || !obs || now - obs.at > LIVE_MAX_AGE_MS) return est
  const live = liveForecast(cityId, night, obs, cityBaseline(data), est.occupancy)
  live.reasons.push(...est.reasons)
  return live
}

/** 予報を、同じ観測・イベントの間は都市・日付ごとに覚えておく（日付の帯・地図・一覧で何千回も使うため） */
export function memoForecaster(summary: Summary | null, events: BigEvent[]): (city: CityId, night: Ymd) => DayForecast {
  const cache = new Map<string, DayForecast>()
  return (city, night) => {
    const key = `${city}|${night}`
    let f = cache.get(key)
    if (!f) {
      f = forecastFor(city, night, summary, events)
      cache.set(key, f)
    }
    return f
  }
}
