/**
 * 対象の都市（人口 100 万人以上）。東京は 23 区（特別区）を 1 つの都市として扱う。
 * 緯度・経度は、ホテルが集まる中心部（中継サーバーが楽天トラベルを半径 3km で検索する中心）。
 * worker/src/cities.js と id・緯度・経度をそろえる。
 */
export interface City {
  id: CityId
  name: { ja: string; en: string }
  pref: { ja: string; en: string }
  lat: number
  lng: number
  /** 人口（万人、おおよそ） */
  pop: number
  /**
   * 全国表示の時に、顔のアイコンを本来の位置からずらす量（px）。首都圏・関西は都市が近く、重なるため。
   * 地図を拡大すると、ずらす量を小さくする（JapanMap.tsx）
   */
  offset: [number, number]
  /** 推定の時の、ふだんの混みやすさ（観光・出張の多い都市はプラス） */
  base: number
  /** 予約サイトの都道府県ページ */
  rakutenPref: string
  jalanPref: string
  /** 近くの都市（イベントの影響が及ぶ） */
  near: CityId[]
}

export type CityId =
  | 'sapporo'
  | 'sendai'
  | 'saitama'
  | 'tokyo'
  | 'kawasaki'
  | 'yokohama'
  | 'nagoya'
  | 'kyoto'
  | 'osaka'
  | 'kobe'
  | 'hiroshima'
  | 'fukuoka'

export const CITIES: City[] = [
  {
    id: 'sapporo',
    name: { ja: '札幌', en: 'Sapporo' },
    pref: { ja: '北海道', en: 'Hokkaido' },
    lat: 43.0618,
    lng: 141.3545,
    pop: 196,
    offset: [0, 0],
    base: 0,
    rakutenPref: 'hokkaido',
    jalanPref: '010000',
    near: [],
  },
  {
    id: 'sendai',
    name: { ja: '仙台', en: 'Sendai' },
    pref: { ja: '宮城県', en: 'Miyagi' },
    lat: 38.2618,
    lng: 140.8768,
    pop: 110,
    offset: [24, -26],
    base: 0,
    rakutenPref: 'miyagi',
    jalanPref: '040000',
    near: [],
  },
  {
    id: 'saitama',
    name: { ja: 'さいたま', en: 'Saitama' },
    pref: { ja: '埼玉県', en: 'Saitama' },
    lat: 35.9064,
    lng: 139.6237,
    pop: 135,
    offset: [-34, -46],
    base: -0.5,
    rakutenPref: 'saitama',
    jalanPref: '110000',
    near: ['tokyo'],
  },
  {
    id: 'tokyo',
    name: { ja: '東京23区', en: 'Tokyo (23 wards)' },
    pref: { ja: '東京都', en: 'Tokyo' },
    lat: 35.6812,
    lng: 139.7671,
    pop: 980,
    offset: [50, -30],
    base: 0.5,
    rakutenPref: 'tokyo',
    jalanPref: '130000',
    near: ['kawasaki', 'yokohama', 'saitama'],
  },
  {
    id: 'kawasaki',
    name: { ja: '川崎', en: 'Kawasaki' },
    pref: { ja: '神奈川県', en: 'Kanagawa' },
    lat: 35.5313,
    lng: 139.6969,
    pop: 155,
    offset: [60, 16],
    base: -0.5,
    rakutenPref: 'kanagawa',
    jalanPref: '140000',
    near: ['tokyo', 'yokohama'],
  },
  {
    id: 'yokohama',
    name: { ja: '横浜', en: 'Yokohama' },
    pref: { ja: '神奈川県', en: 'Kanagawa' },
    lat: 35.4588,
    lng: 139.6295,
    pop: 377,
    offset: [22, 56],
    base: 0,
    rakutenPref: 'kanagawa',
    jalanPref: '140000',
    near: ['tokyo', 'kawasaki'],
  },
  {
    id: 'nagoya',
    name: { ja: '名古屋', en: 'Nagoya' },
    pref: { ja: '愛知県', en: 'Aichi' },
    lat: 35.1702,
    lng: 136.8955,
    pop: 233,
    offset: [24, 54],
    base: 0,
    rakutenPref: 'aichi',
    jalanPref: '230000',
    near: [],
  },
  {
    id: 'kyoto',
    name: { ja: '京都', en: 'Kyoto' },
    pref: { ja: '京都府', en: 'Kyoto' },
    lat: 34.9965,
    lng: 135.7605,
    pop: 144,
    offset: [0, -50],
    base: 0.5,
    rakutenPref: 'kyoto',
    jalanPref: '260000',
    near: ['osaka'],
  },
  {
    id: 'osaka',
    name: { ja: '大阪', en: 'Osaka' },
    pref: { ja: '大阪府', en: 'Osaka' },
    lat: 34.6845,
    lng: 135.5,
    pop: 280,
    offset: [6, 54],
    base: 0.5,
    rakutenPref: 'osaka',
    jalanPref: '270000',
    near: ['kyoto', 'kobe'],
  },
  {
    id: 'kobe',
    name: { ja: '神戸', en: 'Kobe' },
    pref: { ja: '兵庫県', en: 'Hyogo' },
    lat: 34.6937,
    lng: 135.1955,
    pop: 150,
    offset: [-40, 40],
    base: 0,
    rakutenPref: 'hyogo',
    jalanPref: '280000',
    near: ['osaka'],
  },
  {
    id: 'hiroshima',
    name: { ja: '広島', en: 'Hiroshima' },
    pref: { ja: '広島県', en: 'Hiroshima' },
    lat: 34.3938,
    lng: 132.4655,
    pop: 118,
    offset: [0, -44],
    base: 0,
    rakutenPref: 'hiroshima',
    jalanPref: '340000',
    near: [],
  },
  {
    id: 'fukuoka',
    name: { ja: '福岡', en: 'Fukuoka' },
    pref: { ja: '福岡県', en: 'Fukuoka' },
    lat: 33.5905,
    lng: 130.4103,
    pop: 166,
    offset: [0, 0],
    base: 0.5,
    rakutenPref: 'fukuoka',
    jalanPref: '400000',
    near: [],
  },
]

export const CITY_IDS = CITIES.map((c) => c.id)

const byId = new Map(CITIES.map((c) => [c.id, c]))

export function cityById(id: string): City | undefined {
  return byId.get(id as CityId)
}

export function isCityId(id: unknown): id is CityId {
  return typeof id === 'string' && byId.has(id as CityId)
}
