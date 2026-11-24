import assert from 'node:assert/strict'
import { test } from 'node:test'
import { baselineOf, HORIZON_DAYS, LOG_COLS, NEAR_PER_RUN, PER_RUN, planRun, pruneDays, publicSummary, updateRef } from '../src/collect.js'
import { CITIES } from '../src/cities.js'
import { collectOnce } from '../src/index.js'
import { parseVacant, vacantUrl } from '../src/rakuten.js'

// formatVersion=2 の形（hotels の要素が配列）
const v2 = {
  pagingInfo: { recordCount: 123, pageCount: 5, page: 1 },
  hotels: [
    [
      { hotelBasicInfo: { hotelName: 'A ホテル', hotelMinCharge: 6000, planListUrl: 'https://a' } },
      { roomInfo: [{ roomBasicInfo: { roomName: 'S' } }, { dailyCharge: { stayDate: '2026-12-01', rakutenCharge: 7000, total: 7000 } }] },
    ],
    [
      { hotelBasicInfo: { hotelName: 'B ホテル', hotelMinCharge: 5000, hotelInformationUrl: 'https://b' } },
      { roomInfo: [{ dailyCharge: { total: 5000 } }, { dailyCharge: { total: 9000 } }] },
    ],
    [{ hotelBasicInfo: { hotelName: 'C ホテル', hotelMinCharge: 12000 } }],
  ],
}

// formatVersion=1 の形（hotels の要素が { hotel: [...] }）
const v1 = {
  pagingInfo: { recordCount: 2 },
  hotels: [
    { hotel: [{ hotelBasicInfo: { hotelName: 'X', hotelMinCharge: 8000 } }, { roomInfo: [{ dailyCharge: { total: 8800 } }] }] },
    { hotel: [{ hotelBasicInfo: { hotelName: 'Y', hotelMinCharge: 4000 } }] },
  ],
}

test('応答を読む（formatVersion 2）', () => {
  const o = parseVacant(v2)
  assert.equal(o.v, 123)
  assert.equal(o.lo, 5000)
  assert.equal(o.p, 7000)
  assert.equal(o.n, 3)
  assert.equal(o.hi, 12000)
  assert.deepEqual(o.h.map((h) => h.n), ['B ホテル', 'A ホテル', 'C ホテル'])
  assert.equal(o.h[0].c, 5000)
})

test('応答を読む（formatVersion 1）', () => {
  const o = parseVacant(v1)
  assert.equal(o.v, 2)
  assert.equal(o.lo, 4000)
  assert.equal(o.p, 6400)
})

test('検索の URL', () => {
  const url = new URL(vacantUrl({ RAKUTEN_APP_ID: 'app', RAKUTEN_ACCESS_KEY: 'key' }, CITIES[3], '2026-12-01', '2026-12-02'))
  assert.equal(url.searchParams.get('applicationId'), 'app')
  assert.equal(url.searchParams.get('accessKey'), 'key')
  assert.equal(url.searchParams.get('sort'), '+roomCharge')
  assert.equal(url.searchParams.get('searchRadius'), '3')
  assert.ok(url.pathname.endsWith('/VacantHotelSearch/20170426'))
})

test('順番: 直近を優先し、重ならずに 2 か月を回る', () => {
  const { plan, cursor, nearCursor } = planRun('2026-12-01', 0, 0)
  assert.equal(plan.length, PER_RUN)
  assert.equal(nearCursor, NEAR_PER_RUN)
  assert.equal(new Set(plan.map((p) => `${p.city.id}|${p.checkin}`)).size, PER_RUN)
  assert.ok(cursor > PER_RUN - NEAR_PER_RUN)
  // 一周すると全部を検索する
  const seen = new Set()
  let c = 0
  let n = 0
  const runs = Math.ceil((HORIZON_DAYS * CITIES.length) / (PER_RUN - NEAR_PER_RUN)) + 1
  for (let i = 0; i < runs; i++) {
    const r = planRun('2026-12-01', c, n)
    r.plan.forEach((p) => seen.add(`${p.city.id}|${p.checkin}`))
    c = r.cursor
    n = r.nearCursor
  }
  assert.equal(seen.size, HORIZON_DAYS * CITIES.length)
})

test('古い日付を消し、ふだんの料金はゆっくり動く', () => {
  assert.deepEqual(Object.keys(pruneDays({ '2026-11-30': {}, '2026-12-01': {}, '2027-03-01': {} }, '2026-12-01')), ['2026-12-01'])
  assert.equal(updateRef(null, 10000), 10000)
  assert.equal(updateRef(10000, 20000), 10100)
  assert.equal(updateRef(10000, null), 10000)
})

function memoryKv() {
  const map = new Map()
  return {
    map,
    async get(key, type) {
      const v = map.get(key)
      return v === undefined ? null : type === 'json' ? JSON.parse(v) : v
    },
    async put(key, value) {
      map.set(key, value)
    },
  }
}

test('1 回の実行: 集めて保存し、満室（404）は空室 0 にする', async () => {
  const kv = memoryKv()
  let calls = 0
  const fakeFetch = async (url) => {
    calls++
    const checkin = new URL(url).searchParams.get('checkinDate')
    if (checkin === '2026-12-02') return new Response('{"error":"not_found"}', { status: 404 })
    return new Response(JSON.stringify(v2), { status: 200 })
  }
  const now = Date.parse('2026-12-01T03:00:00Z')
  const run = await collectOnce({ HOTEL: kv, RAKUTEN_APP_ID: 'app' }, now, fakeFetch, 0)
  assert.equal(calls, PER_RUN)
  assert.equal(run.done, PER_RUN)
  const state = JSON.parse(kv.map.get('state'))
  assert.equal(state.cities.tokyo.days['2026-12-01'].v, 123)
  assert.equal(state.cities.tokyo.days['2026-12-01'].h.length, 3)
  // 観測は 1 つも捨てない: まず state にためて、時間が変わったら記録に書き出す
  assert.equal(state.pending.length, 1)
  assert.equal(state.pending[0].rows.length, PER_RUN)
  assert.equal(kv.map.has('log:2026-12-01T03'), false)
  await collectOnce({ HOTEL: kv, RAKUTEN_APP_ID: 'app' }, now + 5 * 60_000, fakeFetch, 0)
  assert.equal(JSON.parse(kv.map.get('state')).pending.length, 2)
  await collectOnce({ HOTEL: kv, RAKUTEN_APP_ID: 'app' }, now + 60 * 60_000, fakeFetch, 0)
  const log = JSON.parse(kv.map.get('log:2026-12-01T03'))
  assert.deepEqual(log.cols, LOG_COLS)
  assert.equal(log.runs.length, 2)
  assert.equal(log.runs[0].rows.length + log.runs[1].rows.length, PER_RUN * 2)
  const row = Object.fromEntries(LOG_COLS.map((c, i) => [c, log.runs[0].rows[0][i]]))
  assert.equal(row.v, 123)
  assert.equal(row.p, 7000)
  assert.equal(JSON.parse(kv.map.get('state')).pending.length, 1)
  const base = baselineOf(state)
  assert.equal(base.cities.tokyo.ref, 7000)
  assert.equal(base.cities.tokyo.vref, 123)
  const pub = publicSummary(state)
  assert.equal(pub.cities.tokyo.days['2026-12-01'].h, undefined)
})

test('回数の制限（429）なら、そこで止めて順番を進めない', async () => {
  const kv = memoryKv()
  const fakeFetch = async () => new Response('', { status: 429 })
  const run = await collectOnce({ HOTEL: kv, RAKUTEN_APP_ID: 'app' }, Date.now(), fakeFetch, 0)
  assert.equal(run.done, 0)
  assert.equal(JSON.parse(kv.map.get('state')).cursor, 0)
})

test('アプリ ID がなければ何もしない', async () => {
  assert.deepEqual(await collectOnce({ HOTEL: memoryKv() }), { skipped: 'no-app-id' })
})
