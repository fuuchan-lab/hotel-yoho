// 地図に重ねる新幹線の路線・駅・空港のデータ（public/data/rail.json）を、のりものレーダーのデータから作る。
// 使い方: node scripts/build-rail.mjs <のりものレーダーのフォルダー>（例: ../ShinkansenLocation）
// 元データ: 国土数値情報（鉄道データ N02・空港データ C28）国土交通省 を、のりものレーダーで加工したもの
// 英語名・空港コード（IATA）は、のりものレーダーの src/names-en.ts（JR 各社の公式のローマ字表記）
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const src = process.argv[2]
if (!src) {
  console.error('usage: node scripts/build-rail.mjs <norimono-radar folder>')
  process.exit(1)
}
const read = (p) => JSON.parse(fs.readFileSync(path.join(src, p), 'utf8'))
const network = read('public/data/network.json')
const { airports } = read('public/data/airports.json')
const names = await import(pathToFileURL(path.resolve(src, 'src/names-en.ts')).href)

const round = (v) => Math.round(v * 10000) / 10000

// 駅: 同じ名前は 1 つにまとめ、いくつの路線が通るかを数える（2 路線以上は主要駅）
const stations = new Map()
for (const line of network.lines) {
  for (const s of line.stations) {
    const cur = stations.get(s.name) ?? { ja: s.name, en: names.STATIONS[s.name] ?? s.name, lng: round(s.lng), lat: round(s.lat), lines: 0 }
    cur.lines++
    stations.set(s.name, cur)
  }
}

// 対象の都市の空の玄関（全国表示でも出す）
const HUB_AIRPORTS = ['CTS', 'SDJ', 'HND', 'NRT', 'KMQ', 'FSZ', 'NGO', 'KIJ', 'TOY', 'OKJ', 'ITM', 'KIX', 'UKB', 'HIJ', 'FUK', 'KMJ', 'KOJ', 'OKA']

// 対象の都市の代表駅も主要駅として扱う（路線が 1 本でも名前を早めに出す）
const CITY_STATIONS = ['札幌', '新函館北斗', '仙台', '新潟', '大宮', '東京', '品川', '新横浜', '静岡', '長野', '富山', '金沢', '名古屋', '京都', '新大阪', '新神戸', '岡山', '広島', '博多', '熊本', '鹿児島中央']

const out = {
  attribution: '国土数値情報（鉄道データ N02・空港データ C28）国土交通省 を加工して作成（のりものレーダーと同じ）',
  lines: network.lines.map((l) => ({
    id: l.id,
    color: l.color,
    name: { ja: l.name, en: names.LINES[l.id] ?? l.name },
    coords: l.coords.map(([x, y]) => [round(x), round(y)]),
  })),
  stations: [...stations.values()].map((s) => ({
    name: { ja: s.ja, en: s.en },
    lng: s.lng,
    lat: s.lat,
    major: s.lines > 1 || CITY_STATIONS.includes(s.ja) ? 1 : 0,
  })),
  airports: airports.map((a) => ({
    name: { ja: a.name, en: names.airport(a.name) },
    code: names.airportCode(a.name),
    hub: HUB_AIRPORTS.includes(names.airportCode(a.name)) ? 1 : 0,
    lng: round(a.lng),
    lat: round(a.lat),
  })),
}

fs.writeFileSync(new URL('../public/data/rail.json', import.meta.url), JSON.stringify(out))
console.log(`lines ${out.lines.length}, stations ${out.stations.length} (major ${out.stations.filter((s) => s.major).length}), airports ${out.airports.length} (with code ${out.airports.filter((a) => a.code).length})`)
