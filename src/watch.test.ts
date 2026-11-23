import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { CityId } from './cities.ts'
import type { DayForecast, Mood } from './forecast.ts'
import { normalizePrefs } from './prefs.ts'
import { changeOf, dayWatch, markSeen, needsAttention, toggleDayWatch, worstMood } from './watch.ts'

const moods: Record<string, Mood> = { '2026-12-01': 1, '2026-12-02': 3, '2026-12-03': 2 }
const fc = (city: CityId, date: string): DayForecast => ({ city, date, mood: moods[date] ?? 2, source: 'estimate', reasons: [] })
const today = '2026-11-30'

test('★ を付けると 1 泊のウォッチ、もう一度で外れる', () => {
  let p = normalizePrefs({})
  p = toggleDayWatch(p, 'tokyo', '2026-12-02', 3)
  assert.equal(p.trips.length, 1)
  assert.equal(p.trips[0].seen, 3)
  assert.ok(dayWatch(p, 'tokyo', '2026-12-02'))
  assert.equal(dayWatch(p, 'osaka', '2026-12-02'), undefined)
  p = toggleDayWatch(p, 'tokyo', '2026-12-02', 3)
  assert.equal(p.trips.length, 0)
})

test('何泊かの予定は、泊のうちいちばん困った顔で見る', () => {
  const p = normalizePrefs({ trips: [{ id: 'a', city: 'tokyo', checkin: '2026-12-01', nights: 3, note: '', seen: 1 }] })
  assert.equal(worstMood(p.trips[0], today, fc), 3)
  assert.equal(changeOf(1, 3), 'worse')
  assert.equal(changeOf(3, 1), 'better')
  assert.equal(changeOf(null, 3), null)
  assert.equal(needsAttention(p, today, fc), true)
  const seen = markSeen(p, today, fc)
  assert.equal(seen.trips[0].seen, 3)
  assert.equal(needsAttention(seen, today, fc), false)
  assert.equal(markSeen(seen, today, fc), seen)
})

test('予定の 1 泊の ★ を押しても、予定ごとは消さない', () => {
  const p = normalizePrefs({ trips: [{ id: 'a', city: 'tokyo', checkin: '2026-12-01', nights: 3, note: '', seen: 1 }] })
  assert.equal(toggleDayWatch(p, 'tokyo', '2026-12-02', 3).trips.length, 1)
})
