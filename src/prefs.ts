/**
 * 利用者の設定・ウォッチリスト（お気に入りの都市・ウォッチする日・印を付けたイベント）。端末（localStorage）に保存し、ログイン中は Google ドライブの HotelYoho/prefs.json にも保存して、
 * 同じアカウントの端末で共通にする（新しく変えたほうを残す）。
 */
import { isCityId, type CityId } from './cities.ts'
import type { Lang } from './i18n/context.ts'
import type { ThemePreference } from './theme.ts'

export interface Trip {
  id: string
  city: CityId
  /** チェックイン */
  checkin: string
  /** 泊数 */
  nights: number
  note: string
  /**
   * 最後にウォッチリストで見た時の顔（泊のうちいちばん困った顔。0〜4）。
   * いまの予報と違えば「悪化・改善」を知らせる。まだ予報の範囲外なら null
   */
  seen: number | null
}

export interface Prefs {
  /** 地図・一覧で上に出す都市 */
  favorites: CityId[]
  /** カレンダーで最初に開く都市 */
  homeCity: CityId | null
  trips: Trip[]
  /** 印を付けたイベント */
  starred: string[]
  /** 自分で選んだ言語（選んでいなければ null = 端末の言語）。同じアカウントの端末で共通 */
  lang: Lang | null
  /** 配色。同じアカウントの端末で共通 */
  theme: ThemePreference
  /**
   * 利用者が自分で取った、楽天ウェブサービスのアプリ ID・アクセスキー（access.ts の own）。
   * 利用者の端末と、利用者自身の Google ドライブにだけ保存し、楽天の API にだけ送る
   */
  rakuten: { appId: string; accessKey: string } | null
  /** 作者のキーでのお試しを始めた時刻（ミリ秒）。初めてログインした時に入れる */
  trialStart: number | null
  /** 最後に変えた時刻（ミリ秒）。端末とドライブのどちらが新しいかの判定に使う */
  updatedAt: number
}

export const PREFS_KEY = 'hotelyoho-prefs'
export const PREFS_FILE = 'prefs.json'

export const EMPTY_PREFS: Prefs = {
  favorites: [],
  homeCity: null,
  trips: [],
  starred: [],
  lang: null,
  theme: 'auto',
  rakuten: null,
  trialStart: null,
  updatedAt: 0,
}

function isTrip(t: unknown): t is Trip {
  if (typeof t !== 'object' || t === null) return false
  const v = t as Partial<Trip>
  return (
    typeof v.id === 'string' &&
    isCityId(v.city) &&
    typeof v.checkin === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(v.checkin) &&
    typeof v.nights === 'number' &&
    v.nights >= 1 &&
    v.nights <= 14
  )
}

/** 読み込んだもの（古い形・壊れたものを含む）を、使える形にそろえる */
export function normalizePrefs(raw: unknown): Prefs {
  if (typeof raw !== 'object' || raw === null) return { ...EMPTY_PREFS }
  const v = raw as Record<string, unknown>
  const favorites = Array.isArray(v.favorites) ? [...new Set(v.favorites.filter(isCityId))] : []
  const trips = Array.isArray(v.trips)
    ? v.trips.filter(isTrip).map((t) => ({
        ...t,
        note: typeof t.note === 'string' ? t.note.slice(0, 200) : '',
        seen: typeof t.seen === 'number' && t.seen >= 0 && t.seen <= 4 ? t.seen : null,
      }))
    : []
  const rk = v.rakuten as { appId?: unknown; accessKey?: unknown } | null | undefined
  const appId = typeof rk?.appId === 'string' ? rk.appId.trim().slice(0, 200) : ''
  const accessKey = typeof rk?.accessKey === 'string' ? rk.accessKey.trim().slice(0, 200) : ''
  const starred = Array.isArray(v.starred) ? [...new Set(v.starred.filter((s): s is string => typeof s === 'string'))] : []
  return {
    favorites,
    homeCity: isCityId(v.homeCity) ? v.homeCity : null,
    trips,
    starred,
    lang: v.lang === 'ja' || v.lang === 'en' ? v.lang : null,
    theme: v.theme === 'light' || v.theme === 'dark' ? v.theme : 'auto',
    rakuten: appId ? { appId, accessKey } : null,
    trialStart: typeof v.trialStart === 'number' && Number.isFinite(v.trialStart) && v.trialStart > 0 ? v.trialStart : null,
    updatedAt: typeof v.updatedAt === 'number' && Number.isFinite(v.updatedAt) ? v.updatedAt : 0,
  }
}

/** 端末とドライブの、新しいほうを残す */
export function newerPrefs(local: Prefs, remote: Prefs): Prefs {
  return remote.updatedAt > local.updatedAt ? remote : local
}

export function loadLocalPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    return normalizePrefs(raw ? JSON.parse(raw) : null)
  } catch {
    return { ...EMPTY_PREFS }
  }
}

export function saveLocalPrefs(prefs: Prefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
  } catch {
    // 保存できなくても、その回は使える
  }
}

/** 予定の泊ごとの日付 */
export function tripNights(trip: Trip): string[] {
  const out: string[] = []
  const [y, m, d] = trip.checkin.split('-').map(Number)
  for (let i = 0; i < trip.nights; i++) {
    const date = new Date(Date.UTC(y, m - 1, d + i))
    out.push(date.toISOString().slice(0, 10))
  }
  return out
}
