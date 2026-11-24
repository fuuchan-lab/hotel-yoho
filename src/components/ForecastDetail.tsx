import { cityById } from '../cities.ts'
import type { DayForecast, Reason } from '../forecast.ts'
import { formatIndex, formatYen } from '../format.ts'
import type { TFn } from '../i18n/context.ts'
import { useI18n } from '../i18n/useI18n.ts'
import { CATEGORY_ICON } from './eventIcons.ts'

/** 料金・空室（実データ）か「推定」の一行 */
export function Figures({ f }: { f: DayForecast }) {
  const { t, lang } = useI18n()
  if (f.source === 'estimate') return <span className="figures muted">{t('fc.occupancy', { n: f.occupancy })}</span>
  if (!f.vacant) return <span className="figures">{t('fc.soldOut')}</span>
  return (
    <span className="figures">
      {f.price != null && (
        <span>
          {t('fc.price', { price: formatYen(f.price, lang) })}
          {f.priceIndex != null && (
            <span className={f.priceIndex > 1.05 ? 'up' : f.priceIndex < 0.95 ? 'down' : ''}> ({formatIndex(f.priceIndex)})</span>
          )}
        </span>
      )}
      <span>{t('fc.vacant', { n: f.vacant })}</span>
    </span>
  )
}

function reasonText(r: Reason, t: TFn, lang: 'ja' | 'en'): string {
  if ((r.key === 'event' || r.key === 'nearEvent') && r.event) {
    const icon = CATEGORY_ICON[r.event.category]
    if (r.key === 'nearEvent') {
      const city = cityById(r.event.city)
      return `${icon} ${t('reason.nearEvent', { city: city?.name[lang] ?? '' })} ${r.event.title[lang] || r.event.title.ja}`
    }
    return `${icon} ${r.event.title[lang] || r.event.title.ja}`
  }
  return t(`reason.${r.key}`)
}

/** 理由（土曜の夜・年末・イベント名など）の小さな札 */
export function Reasons({ f, max = 4 }: { f: DayForecast; max?: number }) {
  const { t, lang } = useI18n()
  const seen = new Set<string>()
  const items = f.reasons.filter((r) => {
    const key = r.event ? r.event.id : r.key
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
  if (items.length === 0) return null
  return (
    <span className="reasons">
      {items.slice(0, max).map((r) => (
        <span key={r.event?.id ?? r.key} className={`reason ${r.event ? 'reason-event' : ''}`}>
          {reasonText(r, t, lang)}
        </span>
      ))}
      {items.length > max && <span className="reason">+{items.length - max}</span>}
    </span>
  )
}
