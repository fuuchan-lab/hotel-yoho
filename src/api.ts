/**
 * 中継サーバー（worker/）から、空室・料金の観測を受け取る。
 * 届かない時は前回の分（端末に保存）を使い、それもなければ推定だけで表示する。
 */
import type { CityId } from './cities.ts'
import type { Summary } from './forecast.ts'
import type { Baseline } from './ownData.ts'

export const API_BASE =
  ((import.meta.env?.VITE_API as string | undefined) || 'https://hotel-yoho.shinkansen-location-live.workers.dev').replace(/\/$/, '')

const SUMMARY_KEY = 'hotelyoho-summary'

export interface HotelPick {
  /** 名前 */
  n: string
  /** 1 人 1 泊の料金（円） */
  c: number
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

const BASELINE_KEY = 'hotelyoho-baseline'

export function loadCachedBaseline(): Baseline | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(BASELINE_KEY) ?? 'null') as Baseline | null
    return parsed && typeof parsed.cities === 'object' && parsed.cities !== null ? parsed : null
  } catch {
    return null
  }
}

/** 都市ごとの、ふだんの料金・空室の多い日の空室数（自分のキーの観測を比べる基準） */
export async function fetchBaseline(): Promise<Baseline> {
  const res = await fetch(`${API_BASE}/baseline`)
  if (!res.ok) throw new Error(`baseline-${res.status}`)
  const data = (await res.json()) as Baseline
  if (typeof data?.cities !== 'object' || data.cities === null) throw new Error('baseline-invalid')
  try {
    localStorage.setItem(BASELINE_KEY, JSON.stringify(data))
  } catch {
    // 保存できなくても、その回は使える
  }
  return data
}
