/**
 * ウォッチリスト: カレンダー・1 週間の予報で ★ を付けた日（と、登録した泊まる予定）を見張る。
 * 前にウォッチリストで見た時の顔（seen）と、いまの予報の顔を比べて「悪化・改善」を知らせる
 */
import type { CityId } from './cities.ts'
import { addDays, HORIZON_DAYS, type Ymd } from './dates.ts'
import type { DayForecast, Mood } from './forecast.ts'
import { tripNights, type Prefs, type Trip } from './prefs.ts'

export type Change = 'worse' | 'better' | null

/** 泊のうち、予報の範囲内でいちばん困った顔。範囲内の泊がなければ null */
export function worstMood(trip: Trip, today: Ymd, forecast: (city: CityId, date: Ymd) => DayForecast): Mood | null {
  const last = addDays(today, HORIZON_DAYS - 1)
  let worst: Mood | null = null
  for (const d of tripNights(trip)) {
    if (d < today || d > last) continue
    const m = forecast(trip.city, d).mood
    if (worst === null || m > worst) worst = m
  }
  return worst
}

export function changeOf(seen: number | null, now: Mood | null): Change {
  if (seen === null || now === null || seen === now) return null
  return now > seen ? 'worse' : 'better'
}

/** その日（1 泊）をウォッチしているもの */
export function dayWatch(prefs: Prefs, city: CityId, date: Ymd): Trip | undefined {
  return prefs.trips.find((t) => t.city === city && tripNights(t).includes(date))
}

export function newId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

/** ★ を付ける・外す。付ける時は、いまの顔を「見た顔」として残す（付けた後の変化を知らせるため） */
export function toggleDayWatch(prefs: Prefs, city: CityId, date: Ymd, mood: Mood | null): Prefs {
  const existing = dayWatch(prefs, city, date)
  if (existing) {
    if (existing.nights === 1) return { ...prefs, trips: prefs.trips.filter((t) => t.id !== existing.id) }
    // 何泊かの予定の 1 泊だけを外す時は、予定ごとは消さない（予定はウォッチの画面で削除する）
    return prefs
  }
  const trip: Trip = { id: newId(), city, checkin: date, nights: 1, note: '', seen: mood }
  return { ...prefs, trips: [...prefs.trips, trip] }
}

/** ウォッチの画面で見たので、いまの顔を「見た顔」にする。変わったものがなければ同じものを返す */
export function markSeen(prefs: Prefs, today: Ymd, forecast: (city: CityId, date: Ymd) => DayForecast): Prefs {
  let changed = false
  const trips = prefs.trips.map((t) => {
    const now = worstMood(t, today, forecast)
    if (now === null || now === t.seen) return t
    changed = true
    return { ...t, seen: now }
  })
  return changed ? { ...prefs, trips } : prefs
}

/** メニューの「！」: 顔が変わった、または困った顔のウォッチがある */
export function needsAttention(prefs: Prefs, today: Ymd, forecast: (city: CityId, date: Ymd) => DayForecast): boolean {
  return prefs.trips.some((t) => {
    const now = worstMood(t, today, forecast)
    return now !== null && (now === 4 || changeOf(t.seen, now) !== null)
  })
}
