// 何を・どの順で集めるか（Cloudflare の無料枠に収めるため、1 回の実行で少しずつ集める）
import { CITIES } from './cities.js'

export const HORIZON_DAYS = 61
/** 1 回の実行で検索する数（外部リクエストは 1 回の実行で 50 件まで） */
export const PER_RUN = 24
/** そのうち、直近 1 週間を優先して検索する数 */
export const NEAR_PER_RUN = 5
export const NEAR_DAYS = 7

export function todayJst(now = Date.now()) {
  return new Date(now + 9 * 3_600_000).toISOString().slice(0, 10)
}

export function addDays(ymd, n) {
  const d = new Date(`${ymd}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

/** i 番目の検索（日付ごとに全都市を回る順） */
function item(today, i) {
  const city = CITIES[i % CITIES.length]
  const offset = Math.floor(i / CITIES.length)
  return { city, checkin: addDays(today, offset), checkout: addDays(today, offset + 1) }
}

/**
 * この回に検索するものを選ぶ。直近 1 週間を NEAR_PER_RUN 件、残りは 2 か月分を順に回る。
 * 戻り値の cursor・nearCursor を次の回に渡す
 */
export function planRun(today, cursor = 0, nearCursor = 0) {
  const total = HORIZON_DAYS * CITIES.length
  const nearTotal = NEAR_DAYS * CITIES.length
  const plan = []
  const seen = new Set()
  let near = nearCursor % nearTotal
  for (let k = 0; k < NEAR_PER_RUN; k++) {
    const it = item(today, near)
    seen.add(`${it.city.id}|${it.checkin}`)
    plan.push(it)
    near = (near + 1) % nearTotal
  }
  let main = cursor % total
  let guard = 0
  while (plan.length < PER_RUN && guard++ < total) {
    const it = item(today, main)
    main = (main + 1) % total
    const key = `${it.city.id}|${it.checkin}`
    if (seen.has(key)) continue
    seen.add(key)
    plan.push(it)
  }
  return { plan, cursor: main, nearCursor: near }
}

/** 今日より前の日付と、2 か月より先の日付を消す */
export function pruneDays(days, today) {
  const last = addDays(today, HORIZON_DAYS - 1)
  const out = {}
  for (const [date, obs] of Object.entries(days ?? {})) {
    if (date >= today && date <= last) out[date] = obs
  }
  return out
}

/** ふだんの料金: 観測した中央値の、ゆっくり動く平均 */
export function updateRef(ref, price) {
  if (!(price > 0)) return ref ?? null
  if (!(ref > 0)) return price
  return Math.round(ref + (price - ref) * 0.01)
}

/** 画面用の要約（予約ページへのリンクなどの細かい情報を除く） */
export function publicSummary(state) {
  const cities = {}
  for (const [id, c] of Object.entries(state.cities ?? {})) {
    const days = {}
    for (const [date, o] of Object.entries(c.days ?? {})) days[date] = { v: o.v, p: o.p, lo: o.lo, at: o.at }
    cities[id] = { total: null, ref: c.ref ?? null, days }
  }
  return { updatedAt: state.updatedAt ?? 0, cities }
}
