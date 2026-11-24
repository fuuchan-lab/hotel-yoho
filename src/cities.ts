/**
 * 対象の都市。人口 100 万人以上の 12 都市（東京は 23 区＝特別区を 1 つの都市として扱う）に、
 * 観光・出張・空港の拠点として作者が選んだ都市（那覇・熊本・千歳・静岡・金沢・長野・新潟・富山・奈良・岡山・鹿児島）を加えている。
 * 緯度・経度は、ホテルが集まる中心部（中継サーバーが楽天トラベルを半径 3km で検索する中心）。
 * worker/src/cities.js と id・緯度・経度をそろえる。並びは北から（一覧の順）
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
   * 全国表示の時に、顔のアイコンを本来の位置からずらす量（px）。首都圏・関西などは都市が近く、重なるため。
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
  | 'chitose'
  | 'sendai'
  | 'niigata'
  | 'saitama'
  | 'tokyo'
  | 'kawasaki'
  | 'yokohama'
  | 'nagano'
  | 'toyama'
  | 'kanazawa'
  | 'shizuoka'
  | 'nagoya'
  | 'kyoto'
  | 'osaka'
  | 'kobe'
  | 'nara'
  | 'okayama'
  | 'hiroshima'
  | 'fukuoka'
  | 'kumamoto'
  | 'kagoshima'
  | 'naha'

export const CITIES: City[] = [
  {
    id: 'sapporo',
    name: { ja: '札幌', en: 'Sapporo' },
    pref: { ja: '北海道', en: 'Hokkaido' },
    lat: 43.0618,
    lng: 141.3545,
    pop: 196,
    offset: [-24, -26],
    base: 0,
    rakutenPref: 'hokkaido',
    jalanPref: '010000',
    near: ['chitose'],
  },
  {
    id: 'chitose',
    name: { ja: '千歳', en: 'Chitose' },
    pref: { ja: '北海道', en: 'Hokkaido' },
    lat: 42.8195,
    lng: 141.652,
    pop: 10,
    offset: [30, 30],
    base: -0.5,
    rakutenPref: 'hokkaido',
    jalanPref: '010000',
    near: ['sapporo'],
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
    id: 'niigata',
    name: { ja: '新潟', en: 'Niigata' },
    pref: { ja: '新潟県', en: 'Niigata' },
    lat: 37.9122,
    lng: 139.0613,
    pop: 77,
    offset: [16, -20],
    base: 0,
    rakutenPref: 'niigata',
    jalanPref: '150000',
    near: [],
  },
  {
    id: 'saitama',
    name: { ja: 'さいたま', en: 'Saitama' },
    pref: { ja: '埼玉県', en: 'Saitama' },
    lat: 35.9064,
    lng: 139.6237,
    pop: 135,
    offset: [12, -56],
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
    id: 'nagano',
    name: { ja: '長野', en: 'Nagano' },
    pref: { ja: '長野県', en: 'Nagano' },
    lat: 36.6431,
    lng: 138.1887,
    pop: 37,
    offset: [0, 0],
    base: 0,
    rakutenPref: 'nagano',
    jalanPref: '200000',
    near: [],
  },
  {
    id: 'toyama',
    name: { ja: '富山', en: 'Toyama' },
    pref: { ja: '富山県', en: 'Toyama' },
    lat: 36.7013,
    lng: 137.2133,
    pop: 41,
    offset: [24, -50],
    base: 0,
    rakutenPref: 'toyama',
    jalanPref: '160000',
    near: ['kanazawa'],
  },
  {
    id: 'kanazawa',
    name: { ja: '金沢', en: 'Kanazawa' },
    pref: { ja: '石川県', en: 'Ishikawa' },
    lat: 36.57,
    lng: 136.653,
    pop: 46,
    offset: [-20, -44],
    base: 0.5,
    rakutenPref: 'ishikawa',
    jalanPref: '170000',
    near: ['toyama'],
  },
  {
    id: 'shizuoka',
    name: { ja: '静岡', en: 'Shizuoka' },
    pref: { ja: '静岡県', en: 'Shizuoka' },
    lat: 34.9717,
    lng: 138.389,
    pop: 68,
    offset: [4, 50],
    base: -0.5,
    rakutenPref: 'shizuoka',
    jalanPref: '220000',
    near: [],
  },
  {
    id: 'nagoya',
    name: { ja: '名古屋', en: 'Nagoya' },
    pref: { ja: '愛知県', en: 'Aichi' },
    lat: 35.1702,
    lng: 136.8955,
    pop: 233,
    offset: [0, 0],
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
    offset: [-14, -50],
    base: 0.5,
    rakutenPref: 'kyoto',
    jalanPref: '260000',
    near: ['osaka', 'nara'],
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
    near: ['kyoto', 'kobe', 'nara'],
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
    id: 'nara',
    name: { ja: '奈良', en: 'Nara' },
    pref: { ja: '奈良県', en: 'Nara' },
    lat: 34.6847,
    lng: 135.8286,
    pop: 35,
    offset: [30, 40],
    base: 0,
    rakutenPref: 'nara',
    jalanPref: '290000',
    near: ['kyoto', 'osaka'],
  },
  {
    id: 'okayama',
    name: { ja: '岡山', en: 'Okayama' },
    pref: { ja: '岡山県', en: 'Okayama' },
    lat: 34.6662,
    lng: 133.9177,
    pop: 72,
    offset: [0, -44],
    base: 0,
    rakutenPref: 'okayama',
    jalanPref: '330000',
    near: [],
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
    offset: [-26, -22],
    base: 0.5,
    rakutenPref: 'fukuoka',
    jalanPref: '400000',
    near: [],
  },
  {
    id: 'kumamoto',
    name: { ja: '熊本', en: 'Kumamoto' },
    pref: { ja: '熊本県', en: 'Kumamoto' },
    lat: 32.798,
    lng: 130.7,
    pop: 74,
    offset: [20, 30],
    base: 0,
    rakutenPref: 'kumamoto',
    jalanPref: '430000',
    near: [],
  },
  {
    id: 'kagoshima',
    name: { ja: '鹿児島', en: 'Kagoshima' },
    pref: { ja: '鹿児島県', en: 'Kagoshima' },
    lat: 31.5838,
    lng: 130.5413,
    pop: 59,
    offset: [0, 40],
    base: 0,
    rakutenPref: 'kagoshima',
    jalanPref: '460000',
    near: [],
  },
  {
    id: 'naha',
    name: { ja: '那覇', en: 'Naha' },
    pref: { ja: '沖縄県', en: 'Okinawa' },
    lat: 26.2148,
    lng: 127.6792,
    pop: 32,
    offset: [0, 0],
    base: 0.5,
    rakutenPref: 'okinawa',
    jalanPref: '470000',
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
