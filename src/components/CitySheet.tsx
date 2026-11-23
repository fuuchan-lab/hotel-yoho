import { useEffect, useState } from 'react'
import { bookingLinks, fetchCityHotels, type CityHotels } from '../api.ts'
import { cityById, type CityId } from '../cities.ts'
import { dateRange, type Ymd } from '../dates.ts'
import { dayTone, formatDate, formatYen } from '../format.ts'
import { holidayName } from '../holidays.ts'
import type { ForecastData } from '../hooks/useForecastData.ts'
import type { PrefsState } from '../hooks/usePrefs.ts'
import { useI18n } from '../i18n/useI18n.ts'
import { Face } from './Face.tsx'
import { Figures, Reasons } from './ForecastDetail.tsx'
import { Sheet } from './Sheet.tsx'

interface Props {
  cityId: CityId
  start: Ymd
  data: ForecastData
  prefs: PrefsState
  onClose: () => void
  onCalendar: (id: CityId) => void
  onAddTrip: (id: CityId, date: Ymd) => void
}

/** 都市を押した時の、1 週間の予報 */
export function CitySheet({ cityId, start, data, prefs, onClose, onCalendar, onAddTrip }: Props) {
  const { t, lang } = useI18n()
  const city = cityById(cityId)!
  const days = dateRange(start, 7)
  const [hotels, setHotels] = useState<CityHotels | null>(null)
  const fav = prefs.prefs.favorites.includes(cityId)
  const links = bookingLinks(city)
  const picks = hotels?.days[start]?.h ?? []

  useEffect(() => {
    let cancelled = false
    fetchCityHotels(cityId)
      .then((h) => !cancelled && setHotels(h))
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [cityId])

  return (
    <Sheet title={t('sheet.title', { city: city.name[lang] })} onClose={onClose}>
      <div className="row gap">
        <span className="muted small">
          {city.pref[lang]} · {t('sheet.pop', { n: lang === 'en' ? (city.pop / 100).toFixed(1) : city.pop })}
        </span>
        <button
          type="button"
          className={`fav-btn${fav ? ' on' : ''}`}
          aria-pressed={fav}
          onClick={() =>
            prefs.update((p) => ({
              ...p,
              favorites: fav ? p.favorites.filter((c) => c !== cityId) : [...p.favorites, cityId],
            }))
          }
        >
          {fav ? '★' : '☆'} {t(fav ? 'fav.on' : 'fav.add')}
        </button>
      </div>

      <ol className="week">
        {days.map((d) => {
          const f = data.forecast(cityId, d)
          const holiday = holidayName(d)
          return (
            <li key={d} className="week-row">
              <span className={`week-date ${dayTone(d)}`}>
                {formatDate(d, lang)}
                {holiday && <span className="holiday-mini">{holiday[lang]}</span>}
              </span>
              <Face mood={f.mood} size={44} estimate={f.source === 'estimate'} label={t(`mood.${f.mood}`)} />
              <span className="week-main">
                <strong>{t(`mood.${f.mood}`)}</strong>
                <Figures f={f} />
                <Reasons f={f} max={3} />
              </span>
            </li>
          )
        })}
      </ol>
      <p className="muted small">{t('sheet.nightNote')}</p>

      {picks.length > 0 && (
        <div className="card">
          <h3>{t('sheet.cheapest', { date: formatDate(start, lang) })}</h3>
          <ul className="picks">
            {picks.map((h) => (
              <li key={h.u || h.n}>
                <a href={h.u} target="_blank" rel="noopener noreferrer">
                  {h.n}
                </a>
                <span>{formatYen(h.c, lang)}〜</span>
              </li>
            ))}
          </ul>
          <p className="muted small">{t('sheet.cheapestNote')}</p>
        </div>
      )}

      <div className="card">
        <h3>{t('sheet.book')}</h3>
        <div className="book-links">
          <a className="book rakuten" href={links.rakuten} target="_blank" rel="noopener noreferrer">
            {t('site.rakuten')}
          </a>
          <a className="book jalan" href={links.jalan} target="_blank" rel="noopener noreferrer">
            {t('site.jalan')}
          </a>
          <a className="book yahoo" href={links.yahoo} target="_blank" rel="noopener noreferrer">
            {t('site.yahoo')}
          </a>
        </div>
      </div>

      <div className="row gap wrap">
        <button type="button" className="secondary" onClick={() => onCalendar(cityId)}>
          📅 {t('sheet.calendar')}
        </button>
        <button type="button" className="secondary" onClick={() => onAddTrip(cityId, start)}>
          ＋ {t('sheet.addTrip')}
        </button>
      </div>
    </Sheet>
  )
}
