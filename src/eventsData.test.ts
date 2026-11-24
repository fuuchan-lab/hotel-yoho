import assert from 'node:assert/strict'
import fs from 'node:fs'
import { test } from 'node:test'
import { isCityId } from './cities.ts'
import { EVENT_CATEGORIES } from './events.ts'

// public/data/events.json は、定期的に自動で追加される（docs/events-update.md）。壊れたものが公開されないように確かめる
const events = JSON.parse(fs.readFileSync(new URL('../public/data/events.json', import.meta.url), 'utf8')) as Record<string, unknown>[]
const YMD = /^\d{4}-\d{2}-\d{2}$/

test('イベントのデータ: 形式・都市・日付・重複', () => {
  assert.ok(Array.isArray(events) && events.length > 0)
  const ids = new Set<string>()
  for (const e of events) {
    const id = String(e.id)
    assert.deepEqual(Object.keys(e).sort(), ['category', 'city', 'end', 'id', 'scale', 'start', 'title', 'url', 'venue'], id)
    assert.match(id, /^[a-z0-9][a-z0-9-]*$/, id)
    assert.ok(!ids.has(id), `duplicate id ${id}`)
    ids.add(id)
    assert.ok(isCityId(e.city), `${id}: city ${String(e.city)}`)
    const start = String(e.start)
    const end = String(e.end)
    assert.ok(YMD.test(start) && YMD.test(end) && !Number.isNaN(Date.parse(start)) && !Number.isNaN(Date.parse(end)), `${id}: dates`)
    assert.ok(start <= end, `${id}: start <= end`)
    assert.ok((EVENT_CATEGORIES as string[]).includes(String(e.category)), `${id}: category`)
    assert.ok([1, 2, 3].includes(e.scale as number), `${id}: scale`)
    assert.match(String(e.url), /^https:\/\//, `${id}: url`)
    for (const key of ['venue', 'title'] as const) {
      const v = e[key] as { ja?: unknown; en?: unknown }
      assert.ok(typeof v?.ja === 'string' && v.ja.length > 0 && typeof v?.en === 'string' && v.en.length > 0, `${id}: ${key}`)
    }
  }
})
