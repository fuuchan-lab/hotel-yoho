// 中継サーバーが残した観測の記録（log:YYYY-MM-DDTHH）を、手元に保存する（集めたデータを無駄にしないため。あとで分析に使う）。
// 使い方: node scripts/fetch-logs.mjs [保存先のフォルダー（既定 data/logs）] [絞り込み（例 2026-12）]
// すでに保存した時間のものは取り直さない。記録の形: { cols: [...], runs: [{ at, rows: [[city, checkin, v, n, lo, q1, p, q3, hi], ...] }] }
import fs from 'node:fs'
import path from 'node:path'

const API = (process.env.VITE_API || 'https://hotel-yoho.shinkansen-location-live.workers.dev').replace(/\/$/, '')
const dir = process.argv[2] || 'data/logs'
const prefix = process.argv[3] || ''
fs.mkdirSync(dir, { recursive: true })

const keys = []
let cursor = ''
do {
  const res = await fetch(`${API}/logs?prefix=${encodeURIComponent(prefix)}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`)
  if (!res.ok) throw new Error(`logs ${res.status}`)
  const body = await res.json()
  keys.push(...body.keys)
  cursor = body.cursor
} while (cursor)

let saved = 0
for (const key of keys) {
  const file = path.join(dir, `${key}.json`)
  if (fs.existsSync(file)) continue
  const res = await fetch(`${API}/log?key=${encodeURIComponent(key)}`)
  if (!res.ok) {
    console.error(`skip ${key}: ${res.status}`)
    continue
  }
  fs.writeFileSync(file, await res.text())
  saved++
}
console.log(`${keys.length} hours on the server, ${saved} newly saved to ${dir}`)
