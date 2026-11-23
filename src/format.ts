import { parseYmd, weekday, type Ymd } from './dates.ts'
import { holidayName } from './holidays.ts'
import type { Lang } from './i18n/context.ts'

const WD_JA = ['日', '月', '火', '水', '木', '金', '土']
const WD_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function weekdayLabel(date: Ymd, lang: Lang): string {
  return (lang === 'en' ? WD_EN : WD_JA)[weekday(date)]
}

/** 12/5(土) / Sat, Dec 5 */
export function formatDate(date: Ymd, lang: Lang): string {
  const { m, d } = parseYmd(date)
  return lang === 'en' ? `${weekdayLabel(date, lang)}, ${MONTH_EN[m - 1]} ${d}` : `${m}/${d}(${weekdayLabel(date, lang)})`
}

/** 12/5 / Dec 5 */
export function formatShortDate(date: Ymd, lang: Lang): string {
  const { m, d } = parseYmd(date)
  return lang === 'en' ? `${MONTH_EN[m - 1]} ${d}` : `${m}/${d}`
}

export function formatRange(start: Ymd, end: Ymd, lang: Lang): string {
  if (start === end) return formatDate(start, lang)
  return `${formatDate(start, lang)} – ${formatDate(end, lang)}`
}

export function formatMonth(year: number, month: number, lang: Lang): string {
  return lang === 'en' ? `${MONTH_EN[month - 1]} ${year}` : `${year}年${month}月`
}

export function formatYen(value: number, lang: Lang): string {
  return lang === 'en' ? `¥${Math.round(value).toLocaleString('en-US')}` : `${Math.round(value).toLocaleString('ja-JP')}円`
}

/** ふだんとの差（+25% など） */
export function formatIndex(index: number): string {
  const pct = Math.round((index - 1) * 100)
  return `${pct > 0 ? '+' : ''}${pct}%`
}

/** 'sat' | 'sun'（日曜・祝日）| '' — 日付の色分け */
export function dayTone(date: Ymd): 'sat' | 'sun' | '' {
  if (holidayName(date) || weekday(date) === 0) return 'sun'
  if (weekday(date) === 6) return 'sat'
  return ''
}

export function formatTime(ms: number, lang: Lang): string {
  return new Date(ms).toLocaleString(lang === 'en' ? 'en-US' : 'ja-JP', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
