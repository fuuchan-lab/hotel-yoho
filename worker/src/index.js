// ホテル予報の中継サーバー（Cloudflare Workers・無料プラン）
// - 5 分ごと（cron）に楽天トラベルの空室検索 API で、全都市 × 2 か月分の空室・料金を少しずつ集め、KV に 1 つの JSON（state）で保存する
// - 集めた観測は 1 つも捨てず、1 時間ごとに記録（log:YYYY-MM-DDTHH）に書き出して残す（あとで予約の進み方・季節ごとの「ふだん」を学ぶため）
// - GET /forecast: 全都市の要約（画面の地図・カレンダー用）
// - GET /city?id=tokyo: その都市の、日ごとの安いホテル 3 軒（名前・料金。向こう 14 日）
// - GET /baseline: 都市ごとの、ふだんの料金・空室の多い日の空室数（利用者が自分のキーで集めた観測を比べる基準）
// - GET /status: 集め具合
// - GET /logs?prefix=2026-12: 記録のキーの一覧、GET /log?key=2026-12-01T03: その 1 時間の記録（scripts/fetch-logs.mjs で手元に保存する）
// 楽天ウェブサービスのアプリ ID・アクセスキーは secret（RAKUTEN_APP_ID・RAKUTEN_ACCESS_KEY）。利用者には求めない
import { CITIES } from './cities.js'
import { addDays, baselineOf, LOG_COLS, logKey, logRow, PER_RUN, PICK_DAYS, planRun, pruneDays, publicSummary, todayJst, updateRef } from './collect.js'
import { searchVacant } from './rakuten.js'

const STATE_KEY = 'state'
/** 楽天ウェブサービスの目安（1 秒に 1 回まで）より少し間を空ける */
const GAP_MS = 1100

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

function json(body, maxAge = 300) {
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': `public, max-age=${maxAge}`, ...CORS },
  })
}

async function loadState(env) {
  return (await env.HOTEL.get(STATE_KEY, 'json')) ?? { cities: {}, cursor: 0, nearCursor: 0 }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export async function collectOnce(env, now = Date.now(), fetchImpl = fetch, gapMs = GAP_MS) {
  if (!env.RAKUTEN_APP_ID) return { skipped: 'no-app-id' }
  const state = await loadState(env)
  const today = todayJst(now)
  for (const c of CITIES) {
    const cur = state.cities[c.id] ?? { ref: null, days: {} }
    state.cities[c.id] = { ...cur, days: pruneDays(cur.days, today) }
  }
  // 前の 1 時間の観測を、記録に書き出す（state より先に書くので、失敗したら次の回にやり直す）
  state.pending ??= []
  if (state.pending.length > 0 && logKey(state.pending[0].at) !== logKey(now)) {
    await env.HOTEL.put(logKey(state.pending[0].at), JSON.stringify({ cols: LOG_COLS, runs: state.pending }))
    state.pending = []
  }
  const pickUntil = addDays(today, PICK_DAYS - 1)
  const rows = []
  const { plan, cursor, nearCursor } = planRun(today, state.cursor, state.nearCursor)
  let done = 0
  let errors = 0
  let lastError = null
  let stopped = false
  for (const [i, it] of plan.entries()) {
    if (i > 0) await sleep(gapMs)
    let result
    try {
      result = await searchVacant(env, it.city, it.checkin, it.checkout, fetchImpl)
    } catch (e) {
      result = { error: String(e) }
    }
    if (result.retryLater) {
      // 回数の制限・障害: ここまでで止め、残りは次の回に（cursor は進めない）
      lastError = result.error
      stopped = true
      break
    }
    if (result.error) {
      errors++
      lastError = result.error
      continue
    }
    const city = state.cities[it.city.id]
    const { h, ...obs } = result.obs
    city.days[it.checkin] = it.checkin <= pickUntil ? { ...obs, h, at: now } : { ...obs, at: now }
    city.ref = updateRef(city.ref, obs.p)
    rows.push(logRow(it.city.id, it.checkin, obs))
    done++
  }
  if (!stopped) {
    state.cursor = cursor
    state.nearCursor = nearCursor
  }
  if (rows.length > 0) state.pending.push({ at: now, rows })
  state.updatedAt = now
  state.lastRun = { at: now, done, errors, lastError, planned: Math.min(PER_RUN, plan.length) }
  await env.HOTEL.put(STATE_KEY, JSON.stringify(state))
  return state.lastRun
}

async function cached(request, ctx, maxAge, build) {
  const cache = caches.default
  const hit = await cache.match(request)
  if (hit) return hit
  const res = json(await build(), maxAge)
  ctx.waitUntil(cache.put(request, res.clone()))
  return res
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS })
    if (request.method !== 'GET') return new Response('Method Not Allowed', { status: 405, headers: CORS })
    const url = new URL(request.url)
    if (url.pathname === '/forecast') {
      return cached(request, ctx, 300, async () => publicSummary(await loadState(env)))
    }
    if (url.pathname === '/city') {
      const id = url.searchParams.get('id')
      if (!CITIES.some((c) => c.id === id)) return new Response('Not Found', { status: 404, headers: CORS })
      return cached(request, ctx, 300, async () => {
        const state = await loadState(env)
        const days = {}
        for (const [date, o] of Object.entries(state.cities?.[id]?.days ?? {})) days[date] = { h: o.h ?? [], at: o.at }
        return { id, days }
      })
    }
    if (url.pathname === '/baseline') {
      return cached(request, ctx, 3600, async () => baselineOf(await loadState(env)))
    }
    if (url.pathname === '/logs') {
      // 記録のキーの一覧（1,000 件ずつ。続きは cursor）
      const prefix = url.searchParams.get('prefix') ?? ''
      if (!/^[0-9T-]{0,13}$/.test(prefix)) return new Response('Bad Request', { status: 400, headers: CORS })
      const list = await env.HOTEL.list({ prefix: `log:${prefix}`, cursor: url.searchParams.get('cursor') || undefined })
      return json({ keys: list.keys.map((k) => k.name.slice(4)), cursor: list.list_complete ? null : list.cursor }, 60)
    }
    if (url.pathname === '/log') {
      const key = url.searchParams.get('key') ?? ''
      if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}$/.test(key)) return new Response('Bad Request', { status: 400, headers: CORS })
      const body = await env.HOTEL.get(`log:${key}`)
      if (body === null) return new Response('Not Found', { status: 404, headers: CORS })
      // 書き出した記録は変わらないので、長くキャッシュしてよい
      return new Response(body, { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=86400', ...CORS } })
    }
    if (url.pathname === '/status') {
      const state = await loadState(env)
      const counts = Object.fromEntries(Object.entries(state.cities ?? {}).map(([id, c]) => [id, Object.keys(c.days ?? {}).length]))
      const pending = (state.pending ?? []).reduce((n, r) => n + r.rows.length, 0)
      return json({ configured: Boolean(env.RAKUTEN_APP_ID), updatedAt: state.updatedAt ?? null, lastRun: state.lastRun ?? null, pending, days: counts }, 60)
    }
    return new Response('ホテル予報 / Hotel Forecast API: /forecast, /city?id=, /baseline, /status, /logs, /log?key=', { headers: CORS })
  },

  async scheduled(_event, env, ctx) {
    ctx.waitUntil(collectOnce(env))
  },
}
