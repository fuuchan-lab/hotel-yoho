import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { BigEvent } from './events.ts'
import { averageMood, estimateForecast, memoForecaster, moodFromOccupancy } from './forecast.ts'
import { OCCUPANCY } from './occupancy.ts'

const dome: BigEvent = {
  id: 'dome',
  city: 'tokyo',
  start: '2026-12-12',
  end: '2026-12-13',
  venue: { ja: '東京ドーム', en: 'Tokyo Dome' },
  title: { ja: 'ドーム公演', en: 'Dome concert' },
  category: 'live',
  scale: 2,
  url: 'https://example.com',
}

test('稼働率の土台: 47 都道府県 × 12 か月がそろい、都市の都道府県がすべて引ける', async () => {
  assert.equal(Object.keys(OCCUPANCY).length, 47)
  for (const v of Object.values(OCCUPANCY)) assert.equal(v.length, 12)
  const { CITIES } = await import('./cities.ts')
  for (const c of CITIES) assert.ok(OCCUPANCY[c.pref.ja], c.pref.ja)
})

test('稼働率から顔: 低いほど笑顔、92% 以上は高騰', () => {
  assert.equal(moodFromOccupancy(60), 0)
  assert.equal(moodFromOccupancy(70), 1)
  assert.equal(moodFromOccupancy(80), 2)
  assert.equal(moodFromOccupancy(88), 3)
  assert.equal(moodFromOccupancy(95), 4)
})

test('平日より土曜の夜が混み、日曜の夜は空く。超特大のイベントが重なると高騰', () => {
  const wed = estimateForecast('tokyo', '2026-12-09', []) // 水
  const sat = estimateForecast('tokyo', '2026-12-05', []) // 土
  const sun = estimateForecast('tokyo', '2026-12-06', []) // 日
  const eventSat = estimateForecast('tokyo', '2026-12-12', [dome]) // 土 + ドーム
  const hugeSat = estimateForecast('tokyo', '2026-12-12', [{ ...dome, scale: 3 }]) // 土 + 超特大
  assert.ok(wed.occupancy < sat.occupancy)
  assert.ok(sun.occupancy < wed.occupancy)
  assert.ok(sat.occupancy < eventSat.occupancy && eventSat.occupancy < hugeSat.occupancy)
  assert.equal(hugeSat.mood, 4)
  assert.ok(eventSat.reasons.some((r) => r.key === 'event'))
})

test('観光の街は週末の伸びが大きく、出張の街は平日も埋まる', () => {
  const kyotoWed = estimateForecast('kyoto', '2027-01-20', [])
  const kyotoSat = estimateForecast('kyoto', '2027-01-23', [])
  const nagoyaWed = estimateForecast('nagoya', '2027-01-20', [])
  const nagoyaSat = estimateForecast('nagoya', '2027-01-23', [])
  assert.ok(kyotoSat.occupancy - kyotoWed.occupancy > nagoyaSat.occupancy - nagoyaWed.occupancy)
})

test('年末年始: 観光の街は混み、閑散期（1 月）の日曜の夜は笑顔', () => {
  assert.ok(estimateForecast('kyoto', '2026-12-31', []).mood >= 3)
  assert.equal(estimateForecast('sendai', '2027-01-17', []).mood, 0)
})

test('3 連休の中の夜は、ふつうの土曜より混む', () => {
  // 2027-01-09（土）〜11（月・成人の日）は 3 連休
  const long = estimateForecast('naha', '2027-01-10', [])
  const plain = estimateForecast('naha', '2027-01-16', [])
  assert.ok(long.reasons.some((r) => r.key === 'longWeekend'))
  assert.ok(long.occupancy > plain.occupancy)
})

test('近くの都市の大きなイベントも少し効く', () => {
  const plain = estimateForecast('kawasaki', '2026-12-12', [])
  const near = estimateForecast('kawasaki', '2026-12-12', [dome])
  assert.ok(near.reasons.some((r) => r.key === 'nearEvent'))
  assert.ok(near.occupancy > plain.occupancy)
})

test('同じ都市・日付の予報は覚えておく', () => {
  const f = memoForecaster([])
  assert.equal(f('osaka', '2026-12-01'), f('osaka', '2026-12-01'))
})

test('全国平均の顔', () => {
  assert.equal(averageMood([0, 0, 4, 4]), 2)
  assert.equal(averageMood([1, 2, 2]), 2)
  assert.equal(averageMood([0, 1, 0]), 0)
  assert.equal(averageMood([]), 2)
})
