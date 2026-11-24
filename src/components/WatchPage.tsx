import { useEffect, useState } from 'react'
import { CITIES, cityById, isCityId, type CityId } from '../cities.ts'
import { addDays, dateRange, HORIZON_DAYS, type Ymd } from '../dates.ts'
import { dayTone, formatDate, formatRange, formatShortDate, weekdayLabel } from '../format.ts'
import type { DriveAccount } from '../hooks/useGoogleAuth.ts'
import type { ForecastData } from '../hooks/useForecastData.ts'
import type { PrefsState } from '../hooks/usePrefs.ts'
import { useI18n } from '../i18n/useI18n.ts'
import { tripNights, type Trip } from '../prefs.ts'
import { changeOf, markSeen, newId, worstMood, type Change } from '../watch.ts'
import { CATEGORY_ICON } from './eventIcons.ts'
import { Face } from './Face.tsx'

export interface WatchDraft {
  city: CityId
  checkin: Ymd
}

interface Props {
  data: ForecastData
  prefs: PrefsState
  account: DriveAccount | null
  today: Ymd
  draft: WatchDraft | null
  onDraftUsed: () => void
  onLogin: () => void
  onCity: (id: CityId, date: Ymd) => void
}

/**
 * ウォッチリスト: ★ の都市（向こう 1 週間）、★ の日・泊まる予定（顔の変化を知らせる）、★ のイベント。
 * 開いた時の変化を覚えておいて表示し、同時に「見た顔」を更新する（次に開いた時は、その後の変化だけを出す）
 */
export function WatchPage({ data, prefs, account, today, draft, onDraftUsed, onLogin, onCity }: Props) {
  const { t, lang } = useI18n()
  const p = prefs.prefs
  const [changes] = useState<Record<string, Change>>(() => {
    const out: Record<string, Change> = {}
    for (const trip of p.trips) out[trip.id] = changeOf(trip.seen, worstMood(trip, today, data.forecast))
    return out
  })
  const [formOpen, setFormOpen] = useState(draft !== null)
  const [city, setCity] = useState<CityId>(draft?.city ?? p.homeCity ?? 'tokyo')
  const [checkin, setCheckin] = useState<Ymd>(draft?.checkin ?? today)
  const [nights, setNights] = useState(1)
  const [note, setNote] = useState('')

  // 見たので「見た顔」を更新する（変わっていなければ保存しない）
  useEffect(() => {
    const next = markSeen(prefs.prefs, today, data.forecast)
    if (next !== prefs.prefs) prefs.update(() => next)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.forecast, today])

  const last = addDays(today, HORIZON_DAYS - 1)
  const trips = [...p.trips].sort((a, b) => a.checkin.localeCompare(b.checkin))
  const upcoming = trips.filter((tr) => addDays(tr.checkin, tr.nights) > today)
  const past = trips.filter((tr) => addDays(tr.checkin, tr.nights) <= today)
  const week = dateRange(today, 7)
  const favs = CITIES.filter((c) => p.favorites.includes(c.id))
  const starredEvents = data.events.filter((e) => p.starred.includes(e.id) && e.end >= today)

  const add = () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(checkin)) return
    const trip: Trip = { id: newId(), city, checkin, nights, note: note.trim(), seen: null }
    trip.seen = worstMood(trip, today, data.forecast)
    prefs.update((cur) => ({ ...cur, trips: [...cur.trips, trip] }))
    setNote('')
    setFormOpen(false)
    onDraftUsed()
  }

  const remove = (trip: Trip) => {
    if (confirm(t('watch.confirmDelete'))) prefs.update((cur) => ({ ...cur, trips: cur.trips.filter((x) => x.id !== trip.id) }))
  }

  const tripCard = (trip: Trip) => {
    const c = cityById(trip.city)!
    const now = worstMood(trip, today, data.forecast)
    const change = changes[trip.id] ?? null
    const isPast = addDays(trip.checkin, trip.nights) <= today
    return (
      <li key={trip.id} className={`watch-item${isPast ? ' past' : ''}`}>
        <div className="row">
          <button type="button" className="watch-title" onClick={() => onCity(trip.city, trip.checkin < today ? today : trip.checkin)}>
            <strong>{c.name[lang]}</strong> {formatRange(trip.checkin, addDays(trip.checkin, trip.nights - 1), lang)}
            {trip.nights > 1 && <span className="muted small"> · {t('watch.nightsN', { n: trip.nights })}</span>}
          </button>
          <button type="button" className="icon-btn star on" aria-label={t('watch.remove')} onClick={() => remove(trip)}>
            ★
          </button>
        </div>
        {trip.note && <p className="muted small">{trip.note}</p>}
        <div className="watch-nights">
          {tripNights(trip).map((d) => {
            const inRange = d >= today && d <= last
            const f = inRange ? data.forecast(trip.city, d) : null
            return (
              <span key={d} className="watch-night">
                <span className={`small ${dayTone(d)}`}>{formatShortDate(d, lang)}({weekdayLabel(d, lang)})</span>
                {f ? (
                  <Face mood={f.mood} size={32} label={t(`mood.${f.mood}`)} />
                ) : (
                  <span className="muted small">{d < today ? t('watch.past') : t('watch.later')}</span>
                )}
              </span>
            )
          })}
          {now !== null && (
            <span className="watch-status">
              <strong>{t(`mood.${now}`)}</strong>
              {change && <span className={`change ${change}`}>{t(`watch.${change}`)}</span>}
            </span>
          )}
        </div>
      </li>
    )
  }

  return (
    <div className="page">
      {!account && (
        <p className="banner banner-info">
          {t('watch.loginHint')}{' '}
          <button type="button" className="link" onClick={onLogin}>
            {t('google.login')}
          </button>
        </p>
      )}

      <section className="card">
        <h2>★ {t('watch.cities')}</h2>
        {favs.length === 0 ? (
          <p className="muted small">{t('watch.citiesNone')}</p>
        ) : (
          <div className="fav-table" role="table">
            <div className="fav-head" role="row">
              <span />
              {week.map((d, i) => (
                <span key={d} className={`small ${dayTone(d)}`} role="columnheader">
                  {i === 0 ? t('date.today') : weekdayLabel(d, lang)}
                  <br />
                  {formatShortDate(d, lang)}
                </span>
              ))}
            </div>
            {favs.map((c) => (
              <div key={c.id} className="fav-row" role="row">
                <button type="button" className="fav-name" onClick={() => onCity(c.id, today)}>
                  {c.name[lang]}
                </button>
                {week.map((d) => {
                  const f = data.forecast(c.id, d)
                  return (
                    <button key={d} type="button" className="fav-cell" onClick={() => onCity(c.id, d)} aria-label={`${c.name[lang]} ${formatDate(d, lang)} ${t(`mood.${f.mood}`)}`}>
                      <Face mood={f.mood} size={26} />
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card">
        <div className="row">
          <h2>★ {t('watch.days')}</h2>
          {!formOpen && (
            <button type="button" className="link" onClick={() => setFormOpen(true)}>
              ＋ {t('watch.addOpen')}
            </button>
          )}
        </div>
        <p className="muted small">{t('watch.daysHint')}</p>

        {formOpen && (
          <div className="watch-form">
            <label className="field">
              <span>{t('watch.city')}</span>
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
                <span>{t('watch.checkin')}</span>
                <input type="date" value={checkin} min={today} max={addDays(today, 365)} onChange={(e) => setCheckin(e.target.value)} />
              </label>
              <label className="field">
                <span>{t('watch.nights')}</span>
                <select value={nights} onChange={(e) => setNights(Number(e.target.value))}>
                  {Array.from({ length: 14 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {t('watch.nightsN', { n })}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="field">
              <span>{t('watch.note')}</span>
              <input type="text" value={note} maxLength={200} placeholder={t('watch.notePh')} onChange={(e) => setNote(e.target.value)} />
            </label>
            <div className="row gap">
              <button type="button" className="primary grow" onClick={add}>
                ★ {t('watch.save')}
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  setFormOpen(false)
                  onDraftUsed()
                }}
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        )}

        {upcoming.length === 0 ? <p className="muted">{t('watch.daysNone')}</p> : <ul className="watch-list">{upcoming.map(tripCard)}</ul>}
        {past.length > 0 && (
          <details>
            <summary className="muted small">{t('watch.pastList', { n: past.length })}</summary>
            <ul className="watch-list">{past.map(tripCard)}</ul>
          </details>
        )}
      </section>

      <section className="card">
        <h2>★ {t('watch.events')}</h2>
        {starredEvents.length === 0 ? (
          <p className="muted small">{t('watch.eventsNone')}</p>
        ) : (
          <ul className="event-list compact">
            {starredEvents.map((e) => {
              const night = e.start < today ? today : e.start
              const f = data.forecast(e.city, night)
              return (
                <li key={e.id} className="watch-event">
                  <button type="button" className="ev-forecast icon-btn" onClick={() => onCity(e.city, night)} aria-label={t('ev.forecast', { city: cityById(e.city)!.name[lang] })}>
                    <Face mood={f.mood} size={28} />
                  </button>
                  <span>
                    {CATEGORY_ICON[e.category]}{' '}
                    <a href={e.url} target="_blank" rel="noopener noreferrer">
                      {e.title[lang] || e.title.ja}
                    </a>
                    <span className="muted small">
                      {' '}
                      {cityById(e.city)!.name[lang]} · {formatRange(e.start, e.end, lang)}
                    </span>
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </section>
      <p className="muted small">{t('watch.note2')}</p>
    </div>
  )
}
