// 楽天トラベル 空室検索 API（VacantHotelSearch）の呼び出しと、応答の読み取り
// https://webservice.rakuten.co.jp/documentation/vacant-hotel-search

export const DEFAULT_ENDPOINT = 'https://openapi.rakuten.co.jp/engine/api/Travel'
export const DEFAULT_VERSION = '20170426'

/** 1 回の検索で取る件数（API の上限） */
export const HITS = 30

/**
 * 検索の URL。安い順（+roomCharge）に 30 軒を取り、空室のあるホテルの総数（pagingInfo.recordCount）も受け取る。
 * 料金は大人 1 人・1 泊・1 室
 */
export function vacantUrl(env, city, checkin, checkout) {
  const base = (env.RAKUTEN_ENDPOINT || DEFAULT_ENDPOINT).replace(/\/$/, '')
  const version = env.RAKUTEN_VERSION || DEFAULT_VERSION
  const q = new URLSearchParams({
    applicationId: env.RAKUTEN_APP_ID,
    format: 'json',
    formatVersion: '2',
    checkinDate: checkin,
    checkoutDate: checkout,
    latitude: String(city.lat),
    longitude: String(city.lng),
    searchRadius: '3',
    datumType: '1',
    adultNum: '1',
    roomNum: '1',
    hits: String(HITS),
    sort: '+roomCharge',
  })
  if (env.RAKUTEN_ACCESS_KEY) q.set('accessKey', env.RAKUTEN_ACCESS_KEY)
  if (env.RAKUTEN_AFFILIATE_ID) q.set('affiliateId', env.RAKUTEN_AFFILIATE_ID)
  return `${base}/VacantHotelSearch/${version}?${q}`
}

/** 応答の中から、名前の付いた部分（hotelBasicInfo・dailyCharge）を探す。formatVersion 1・2 のどちらの形でも読めるように */
function collect(node, out, depth = 0) {
  if (depth > 6 || node === null || typeof node !== 'object') return
  if (Array.isArray(node)) {
    for (const child of node) collect(child, out, depth + 1)
    return
  }
  for (const [key, value] of Object.entries(node)) {
    if (key === 'hotelBasicInfo' && value && typeof value === 'object') out.basic ??= value
    else if (key === 'dailyCharge' && value && typeof value === 'object') {
      const charge = Number(value.total ?? value.rakutenCharge)
      if (Number.isFinite(charge) && charge > 0) out.charges.push(charge)
    } else collect(value, out, depth + 1)
  }
}

function median(values) {
  if (values.length === 0) return null
  const s = [...values].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2)
}

/** 小さい順に並んだ値の、下から q（0〜1）の位置の値 */
function quantile(sorted, q) {
  if (sorted.length === 0) return null
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.round(q * (sorted.length - 1))))]
}

/**
 * 応答を、1 日分の観測にする（受け取った料金の分布を、なるべく捨てずに残す）。
 * v: 空室のあるホテルの数、n: 料金の分かった軒数（最大 30）、lo・q1・p・q3・hi: その料金の最安・下から 1/4・中央値・3/4・最高、
 * h: 安い 3 軒（名前・料金）
 */
export function parseVacant(json) {
  const hotels = Array.isArray(json?.hotels) ? json.hotels : []
  const items = []
  for (const entry of hotels) {
    const found = { basic: null, charges: [] }
    collect(entry, found)
    const fallback = Number(found.basic?.hotelMinCharge)
    const price = found.charges.length ? Math.min(...found.charges) : Number.isFinite(fallback) && fallback > 0 ? fallback : null
    if (price === null) continue
    items.push({ n: String(found.basic?.hotelName ?? ''), c: price })
  }
  items.sort((a, b) => a.c - b.c)
  const count = Number(json?.pagingInfo?.recordCount)
  const prices = items.map((i) => i.c)
  return {
    v: Number.isFinite(count) ? count : items.length,
    n: prices.length,
    lo: prices.length ? prices[0] : null,
    q1: quantile(prices, 0.25),
    p: median(prices),
    q3: quantile(prices, 0.75),
    hi: prices.length ? prices[prices.length - 1] : null,
    h: items.slice(0, 3),
  }
}

/**
 * 1 都市・1 泊を検索する。
 * 戻り値: { obs } か、{ retryLater: true }（回数の制限・API の障害。次の実行で続ける）か、{ error }
 */
export async function searchVacant(env, city, checkin, checkout, fetchImpl = fetch) {
  const headers = { Accept: 'application/json' }
  // 楽天ウェブサービスのアプリに登録した「許可されたWebサイト」に合わせる（設定していれば）
  if (env.RAKUTEN_REFERER) {
    headers.Referer = env.RAKUTEN_REFERER
    headers.Origin = new URL(env.RAKUTEN_REFERER).origin
  }
  const res = await fetchImpl(vacantUrl(env, city, checkin, checkout), { headers })
  if (res.status === 404) {
    // not_found: 条件に合う空室がない（満室）
    return { obs: { v: 0, n: 0, lo: null, q1: null, p: null, q3: null, hi: null, h: [] } }
  }
  if (res.status === 429 || res.status >= 500) return { retryLater: true, error: `http-${res.status}` }
  if (!res.ok) {
    let detail = ''
    try {
      const body = await res.json()
      detail = `${body.error ?? ''} ${body.error_description ?? ''}`.trim()
    } catch {
      // 本文が JSON でない
    }
    return { error: `http-${res.status} ${detail}`.trim() }
  }
  return { obs: parseVacant(await res.json()) }
}
