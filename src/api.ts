/**
 * 中継サーバー（worker/）から、空室・料金の観測を受け取る。
 * 届かない時は前回の分（端末に保存）を使い、それもなければ推定だけで表示する。
 */
import type { CityId } from './cities.ts'
import type { Summary } from './forecast.ts'

export const API_BASE =
  ((import.meta.env?.VITE_API as string | undefined) || 'https://hotel-yoho.shinkansen-location-live.workers.dev').replace(/\/$/, '')

const SUMMARY_KEY = 'hotelyoho-summary'

export interface HotelPick {
  /** 名前 */
  n: string
  /** 1 人 1 泊の料金（円） */
  c: number
  /** 予約ページ */
  u: string
}

export interface CityHotels {
  id: CityId
  days: Record<string, { h: HotelPick[]; at: number }>
}

export function isSummary(v: unknown): v is Summary {
  return typeof v === 'object' && v !== null && typeof (v as Summary).cities === 'object' && (v as Summary).cities !== null
}

export function loadCachedSummary(): Summary | null {
  try {
    const raw = localStorage.getItem(SUMMARY_KEY)
    const parsed = raw ? (JSON.parse(raw) as unknown) : null
    return isSummary(parsed) ? parsed : null
  } catch {
    return null
  }
}

export async function fetchSummary(): Promise<Summary> {
  const res = await fetch(`${API_BASE}/forecast`)
  if (!res.ok) throw new Error(`forecast-${res.status}`)
  const data = (await res.json()) as unknown
  if (!isSummary(data)) throw new Error('forecast-invalid')
  try {
    localStorage.setItem(SUMMARY_KEY, JSON.stringify(data))
  } catch {
    // 保存できなくても、その回は表示できる
  }
  return data
}

export async function fetchCityHotels(id: CityId): Promise<CityHotels> {
  const res = await fetch(`${API_BASE}/city?id=${encodeURIComponent(id)}`)
  if (!res.ok) throw new Error(`city-${res.status}`)
  return (await res.json()) as CityHotels
}

/** 予約サイトの検索ページ（日付は各サイトで選び直す） */
export function bookingLinks(city: { rakutenPref: string; jalanPref: string; name: { ja: string } }) {
  return {
    rakuten: `https://travel.rakuten.co.jp/yado/${city.rakutenPref}/`,
    jalan: `https://www.jalan.net/${city.jalanPref}/`,
    yahoo: 'https://travel.yahoo.co.jp/',
  }
}
