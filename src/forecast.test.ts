import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { BigEvent } from './events.ts'
import { averageMood, cityBaseline, estimateForecast, forecastFor, liveForecast, type CityData, type Summary } from './forecast.ts'

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

test('推定: 平日より土曜の夜が混み、超特大のイベントが重なると困った顔', () => {
  const weekday = estimateForecast('tokyo', '2026-12-09', []) // 水
  const saturday = estimateForecast('tokyo', '2026-12-05', []) // 土
  const eventSat = estimateForecast('tokyo', '2026-12-12', [dome]) // 土 + ドーム
  const hugeSat = estimateForecast('tokyo', '2026-12-12', [{ ...dome, scale: 3 }]) // 土 + 超特大
  assert.ok(weekday.mood < saturday.mood)
  assert.ok(saturday.mood <= eventSat.mood)
  assert.equal(hugeSat.mood, 4)
  assert.ok(eventSat.reasons.some((r) => r.key === 'event'))
})

test('推定: 年明けの閑散期の日曜の夜は笑顔', () => {
  assert.equal(estimateForecast('sendai', '2027-01-17', []).mood, 0)
})

test('推定: 近くの都市の大きなイベントも少し効く', () => {
  const plain = estimateForecast('kawasaki', '2026-12-12', [])
  const near = estimateForecast('kawasaki', '2026-12-12', [dome])
  assert.ok(near.reasons.some((r) => r.key === 'nearEvent'))
  assert.ok(near.mood >= plain.mood)
})

test('実データ: 空室が多く安ければ笑顔、少なく高ければ困った顔', () => {
  const base = { price: 10000, vacant: 200 }
  assert.equal(liveForecast('osaka', '2026-12-01', { v: 190, p: 8800, lo: 4000, at: 0 }, base).mood, 0)
  assert.equal(liveForecast('osaka', '2026-12-01', { v: 30, p: 17000, lo: 9000, at: 0 }, base).mood, 4)
  assert.equal(liveForecast('osaka', '2026-12-01', { v: 0, p: null, lo: null, at: 0 }, base).mood, 4)
})

test('基準: ref がなければ観測の中央値、空室は上位 10%', () => {
  const data: CityData = {
    total: 300,
    ref: null,
    days: {
      a: { v: 100, p: 8000, lo: 5000, at: 0 },
      b: { v: 200, p: 10000, lo: 6000, at: 0 },
      c: { v: 50, p: 20000, lo: 9000, at: 0 },
    },
  }
  const b = cityBaseline(data)
  assert.equal(b.price, 10000)
  assert.equal(b.vacant, 200)
})

test('古い観測は推定に戻す', () => {
  const now = Date.parse('2026-12-01T00:00:00Z')
  const summary: Summary = {
    updatedAt: now,
    cities: { tokyo: { total: 100, ref: 10000, days: { '2026-12-09': { v: 10, p: 30000, lo: 20000, at: now - 10 * 86_400_000 } } } },
  }
  assert.equal(forecastFor('tokyo', '2026-12-09', summary, [], now).source, 'estimate')
  summary.cities.tokyo!.days['2026-12-09'].at = now - 3_600_000
  assert.equal(forecastFor('tokyo', '2026-12-09', summary, [], now).source, 'live')
})

test('全国平均の顔', () => {
  assert.equal(averageMood([0, 0, 4, 4]), 2)
  assert.equal(averageMood([1, 2, 2]), 2)
  assert.equal(averageMood([0, 1, 0]), 0)
  assert.equal(averageMood([]), 2)
})
