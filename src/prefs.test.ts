import assert from 'node:assert/strict'
import { test } from 'node:test'
import { newerPrefs, normalizePrefs, tripNights } from './prefs.ts'

test('壊れた・知らない値は捨てる', () => {
  const p = normalizePrefs({
    favorites: ['tokyo', 'atlantis', 'tokyo'],
    homeCity: 'mars',
    trips: [
      { id: 'a', city: 'osaka', checkin: '2026-12-24', nights: 2, note: 'x' },
      { id: 'b', city: 'osaka', checkin: 'tomorrow', nights: 2 },
    ],
    starred: ['e1', 3],
    updatedAt: 5,
  })
  assert.deepEqual(p.favorites, ['tokyo'])
  assert.equal(p.homeCity, null)
  assert.equal(p.trips.length, 1)
  assert.deepEqual(p.starred, ['e1'])
  assert.equal(normalizePrefs(null).updatedAt, 0)
})

test('新しいほうを残す', () => {
  const a = normalizePrefs({ favorites: ['tokyo'], updatedAt: 1 })
  const b = normalizePrefs({ favorites: ['osaka'], updatedAt: 2 })
  assert.equal(newerPrefs(a, b), b)
  assert.equal(newerPrefs(b, a), b)
})

test('泊ごとの日付（月をまたぐ）', () => {
  assert.deepEqual(tripNights({ id: 'x', city: 'tokyo', checkin: '2026-12-30', nights: 3, note: '' }), ['2026-12-30', '2026-12-31', '2027-01-01'])
})
