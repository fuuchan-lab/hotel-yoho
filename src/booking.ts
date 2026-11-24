/**
 * 予約のリンク。じゃらんだけにして、A8.net のアフィリエイト（じゃらん）を通す。
 * 行き先は、その都市の中心部の宿の一覧（src/cities.ts の jalan）。チェックイン日を渡すと、
 * その日・1 泊・大人 1 人（予報と同じ条件）で開く。じゃらんの検索の引数（stayYear など）は、じゃらんのサイトが使っているもの
 */
import type { City } from './cities.ts'
import type { Ymd } from './dates.ts'

/** A8.net の作者の ID（リンクに出る公開の値）。「+」はそのまま送る */
const A8MAT = '165JTO+4FKX4Y+14CS+BW8O2'

export function jalanUrl(city: Pick<City, 'jalan'>, checkin?: Ymd | null, nights = 1): string {
  const base = `https://www.jalan.net/${city.jalan}`
  if (!checkin) return base
  const [y, m, d] = checkin.split('-').map(Number)
  const q = new URLSearchParams({
    stayYear: String(y),
    stayMonth: String(m),
    stayDay: String(d),
    stayCount: String(nights),
    roomCount: '1',
    adultNum: '1',
    dateUndecided: '0',
  })
  return `${base}?${q}`
}

/** じゃらんのページを、アフィリエイトのリンクにして返す */
export function jalanBookingUrl(city: Pick<City, 'jalan'>, checkin?: Ymd | null, nights = 1): string {
  return `https://px.a8.net/svt/ejp?a8mat=${A8MAT}&a8ejpredirect=${encodeURIComponent(jalanUrl(city, checkin, nights))}`
}
