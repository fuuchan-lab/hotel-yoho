import { useEffect, useState } from 'react'
import { fetchCityHotels, type CityHotels } from '../api.ts'
import { jalanBookingUrl } from '../booking.ts'
import { cityById, type CityId } from '../cities.ts'
import { dateRange, type Ymd } from '../dates.ts'
import { dayTone, formatDate, formatYen } from '../format.ts'
import { holidayName } from '../holidays.ts'
import type { ForecastData } from '../hooks/useForecastData.ts'
import type { PrefsState } from '../hooks/usePrefs.ts'
import { useI18n } from '../i18n/useI18n.ts'
import { WatchStar } from './WatchStar.tsx'
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
  // 予約のボタンの日付。1 週間の一覧の日を押すと、その日にする
  const [bookDate, setBookDate] = useState<Ymd>(start)
  const picks = hotels?.days[bookDate]?.h ?? []

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
            <li key={d} className={`week-row${d === bookDate ? ' picked' : ''}`} onClick={() => setBookDate(d)}>
              <button type="button" className={`week-date ${dayTone(d)}`} aria-pressed={d === bookDate} aria-label={t('sheet.pickDay', { date: formatDate(d, lang) })}>
                {formatDate(d, lang)}
                {holiday && <span className="holiday-mini">{holiday[lang]}</span>}
              </button>
              <Face mood={f.mood} size={44} estimate={f.source === 'estimate'} label={t(`mood.${f.mood}`)} />
              <span className="week-main">
                <strong>{t(`mood.${f.mood}`)}</strong>
                <Figures f={f} />
                <Reasons f={f} max={3} />
              </span>
              <span onClick={(e) => e.stopPropagation()}>
                <WatchStar prefs={prefs} city={cityId} date={d} mood={f.mood} compact />
              </span>
            </li>
          )
        })}
      </ol>
      <p className="muted small">{t('sheet.nightNote')}</p>

      {picks.length > 0 && (
        <div className="card">
          <h3>{t('sheet.cheapest', { date: formatDate(bookDate, lang) })}</h3>
          <ul className="picks">
            {picks.map((h) => (
              <li key={h.u || h.n}>
                <span className="pick-name">{h.n}</span>
                <span>{formatYen(h.c, lang)}〜</span>
              </li>
            ))}
          </ul>
          <p className="muted small">{t('sheet.cheapestNote')}</p>
        </div>
      )}

      <div className="card">
        <h3>
          {t('sheet.book')} <span className="pr-badge" title={t('book.prNote')}>PR</span>
        </h3>
        <div className="book-links">
          <a className="book jalan" href={jalanBookingUrl(city, bookDate)} target="_blank" rel="noopener sponsored">
            {t('book.jalan', { date: formatDate(bookDate, lang) })}
          </a>
        </div>
        <p className="muted small">{t('book.hint')}</p>
        <p className="muted small">{t('book.prNote')}</p>
      </div>

      <div className="row gap wrap">
        <button type="button" className="secondary" onClick={() => onCalendar(cityId)}>
          📅 {t('sheet.calendar')}
        </button>
        <button type="button" className="secondary" onClick={() => onAddTrip(cityId, bookDate)}>
          ＋ {t('sheet.addTrip')}
        </button>
      </div>
    </Sheet>
  )
}
