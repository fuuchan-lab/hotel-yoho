// ホテル予報の中継サーバー（Cloudflare Workers・無料プラン）
// - 5 分ごと（cron）に楽天トラベルの空室検索 API で、12 都市 × 2 か月分の空室・料金を少しずつ集め、KV に 1 つの JSON で保存する
// - GET /forecast: 全都市の要約（画面の地図・カレンダー用）
// - GET /city?id=tokyo: その都市の、日ごとの安いホテル 3 軒（名前・料金・予約ページ）
// - GET /status: 集め具合
// 楽天ウェブサービスのアプリ ID・アクセスキーは secret（RAKUTEN_APP_ID・RAKUTEN_ACCESS_KEY）。利用者には求めない
import { CITIES } from './cities.js'
import { PER_RUN, planRun, pruneDays, publicSummary, todayJst, updateRef } from './collect.js'
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
    city.days[it.checkin] = { ...result.obs, at: now }
    city.ref = updateRef(city.ref, result.obs.p)
    done++
  }
  if (!stopped) {
    state.cursor = cursor
    state.nearCursor = nearCursor
  }
  state.updatedAt = now
  state.lastRun = { at: now, done, errors, lastError, planned: Math.min(PER_RUN, plan.length) }
  await env.HOTEL.put(STATE_KEY, JSON.stringify(state))

  // 1 日に 1 回、その日の時点の予報を残す（あとで予報の精度を確かめ、季節ごとの「ふだん」を学ぶため）
  if (state.archivedOn !== today && done > 0) {
    state.archivedOn = today
    await env.HOTEL.put(`hist:${today}`, JSON.stringify(publicSummary(state)))
    await env.HOTEL.put(STATE_KEY, JSON.stringify(state))
  }
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
    if (url.pathname === '/status') {
      const state = await loadState(env)
      const counts = Object.fromEntries(Object.entries(state.cities ?? {}).map(([id, c]) => [id, Object.keys(c.days ?? {}).length]))
      return json({ configured: Boolean(env.RAKUTEN_APP_ID), updatedAt: state.updatedAt ?? null, lastRun: state.lastRun ?? null, days: counts }, 60)
    }
    return new Response('ホテル予報 / Hotel Forecast API: /forecast, /city?id=, /status', { headers: CORS })
  },

  async scheduled(_event, env, ctx) {
    ctx.waitUntil(collectOnce(env))
  },
}
