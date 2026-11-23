import { useState } from 'react'
import { bookingLinks } from '../api.ts'
import { CITIES, cityById, isCityId, type CityId } from '../cities.ts'
import { addDays, HORIZON_DAYS, type Ymd } from '../dates.ts'
import { formatDate } from '../format.ts'
import type { DriveAccount } from '../hooks/useGoogleAuth.ts'
import type { ForecastData } from '../hooks/useForecastData.ts'
import type { PrefsState } from '../hooks/usePrefs.ts'
import { useI18n } from '../i18n/useI18n.ts'
import { tripNights, type Trip } from '../prefs.ts'
import { Face } from './Face.tsx'

export interface TripDraft {
  city: CityId
  checkin: Ymd
}

interface Props {
  data: ForecastData
  prefs: PrefsState
  account: DriveAccount | null
  today: Ymd
  draft: TripDraft | null
  onDraftUsed: () => void
  onLogin: () => void
}

/** マイ予定: 泊まる予定を登録し、泊ごとの予報を見る。ログイン中は Google ドライブに保存 */
export function TripsPage({ data, prefs, account, today, draft, onDraftUsed, onLogin }: Props) {
  const { t, lang } = useI18n()
  const [city, setCity] = useState<CityId>(draft?.city ?? prefs.prefs.homeCity ?? 'tokyo')
  const [checkin, setCheckin] = useState<Ymd>(draft?.checkin ?? today)
  const [nights, setNights] = useState(1)
  const [note, setNote] = useState('')
  const [usedDraft, setUsedDraft] = useState(draft)
  if (draft && draft !== usedDraft) {
    // 地図・カレンダーの「予定に追加」から来た
    setUsedDraft(draft)
    setCity(draft.city)
    setCheckin(draft.checkin)
  }
  const last = addDays(today, 365)
  const trips = [...prefs.prefs.trips].sort((a, b) => a.checkin.localeCompare(b.checkin))

  const add = () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(checkin)) return
    const trip: Trip = { id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, city, checkin, nights, note: note.trim() }
    prefs.update((p) => ({ ...p, trips: [...p.trips, trip] }))
    setNote('')
    onDraftUsed()
  }

  return (
    <div className="page">
      {!account && (
        <p className="banner banner-info">
          {t('trips.loginHint')}{' '}
          <button type="button" className="link" onClick={onLogin}>
            {t('google.login')}
          </button>
        </p>
      )}

      <div className="card">
        <h2>{t('trips.add')}</h2>
        <label className="field">
          <span>{t('trips.city')}</span>
          <select value={city} onChange={(e) => isCityId(e.target.value) && setCity(e.target.value)}>
            {CITIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name[lang]}
              </option>
            ))}
          </select>
        </label>
        <div className="row gap">
          <label className="field grow">
            <span>{t('trips.checkin')}</span>
            <input type="date" value={checkin} min={today} max={last} onChange={(e) => setCheckin(e.target.value)} />
          </label>
          <label className="field">
            <span>{t('trips.nights')}</span>
            <select value={nights} onChange={(e) => setNights(Number(e.target.value))}>
              {Array.from({ length: 14 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {t('trips.nightsN', { n })}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="field">
          <span>{t('trips.note')}</span>
          <input type="text" value={note} maxLength={200} placeholder={t('trips.notePh')} onChange={(e) => setNote(e.target.value)} />
        </label>
        <button type="button" className="primary" onClick={add}>
          {t('trips.save')}
        </button>
      </div>

      {trips.length === 0 && <p className="muted">{t('trips.none')}</p>}
      {trips.map((trip) => {
        const c = cityById(trip.city)!
        const nightsList = tripNights(trip)
        const links = bookingLinks(c)
        const past = addDays(trip.checkin, trip.nights) < today
        return (
          <section key={trip.id} className={`card trip${past ? ' past' : ''}`}>
            <div className="row">
              <h2>
                {c.name[lang]} · {formatDate(trip.checkin, lang)} {t('trips.nightsN', { n: trip.nights })}
              </h2>
              <button
                type="button"
                className="link danger"
                onClick={() => {
                  if (confirm(t('trips.confirmDelete'))) prefs.update((p) => ({ ...p, trips: p.trips.filter((x) => x.id !== trip.id) }))
                }}
              >
                {t('common.delete')}
              </button>
            </div>
            {trip.note && <p className="muted">{trip.note}</p>}
            <div className="trip-nights">
              {nightsList.map((d) => {
                const inRange = d >= today && d <= addDays(today, HORIZON_DAYS - 1)
                const f = inRange ? data.forecast(trip.city, d) : null
                return (
                  <span key={d} className="trip-night">
                    <span className="small">{formatDate(d, lang)}</span>
                    {f ? (
                      <Face mood={f.mood} size={34} estimate={f.source === 'estimate'} label={t(`mood.${f.mood}`)} />
                    ) : (
                      <span className="muted small">{d < today ? t('trips.past') : t('trips.later')}</span>
                    )}
                  </span>
                )
              })}
            </div>
            {!past && (
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
            )}
          </section>
        )
      })}
    </div>
  )
}
