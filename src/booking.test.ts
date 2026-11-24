import assert from 'node:assert/strict'
import { test } from 'node:test'
import { cityById } from './cities.ts'
import { jalanBookingUrl, jalanUrl } from './booking.ts'

test('じゃらんの都市のページを、日付・1 泊・大人 1 人で開く', () => {
  const osaka = cityById('osaka')!
  assert.equal(jalanUrl(osaka), 'https://www.jalan.net/270000/LRG_272000/')
  assert.equal(
    jalanUrl(osaka, '2026-03-05'),
    'https://www.jalan.net/270000/LRG_272000/?stayYear=2026&stayMonth=3&stayDay=5&stayCount=1&roomCount=1&adultNum=1&dateUndecided=0',
  )
})

test('A8.net を通す（行き先は URL エンコード）', () => {
  const u = new URL(jalanBookingUrl(cityById('tokyo')!, '2026-12-24'))
  assert.equal(u.origin + u.pathname, 'https://px.a8.net/svt/ejp')
  assert.ok(u.search.startsWith('?a8mat=165JTO+4FKX4Y+14CS+BW8O2&'))
  assert.equal(u.searchParams.get('a8ejpredirect'), jalanUrl(cityById('tokyo')!, '2026-12-24'))
})
