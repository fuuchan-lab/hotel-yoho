import { useEffect, useMemo, useState } from 'react'
import { WatchStar } from './WatchStar.tsx'
import { jalanBookingUrl } from '../booking.ts'
import { cityById, type CityId } from '../cities.ts'
import { addDays, daysInMonth, diffDays, HORIZON_DAYS, parseYmd, weekday, ymd, type Ymd } from '../dates.ts'
import { eventsOn } from '../events.ts'
import { dayTone, formatDate, formatMonth, formatRange } from '../format.ts'
import { holidayName } from '../holidays.ts'
import type { ForecastData } from '../hooks/useForecastData.ts'
import type { PrefsState } from '../hooks/usePrefs.ts'
import { useI18n } from '../i18n/useI18n.ts'
import { dayWatch } from '../watch.ts'
import { CityPicker } from './CityPicker.tsx'
import { CATEGORY_ICON } from './eventIcons.ts'
import { Face } from './Face.tsx'
import { Figures, Reasons } from './ForecastDetail.tsx'

interface Props {
  data: ForecastData
  prefs: PrefsState
  today: Ymd
  city: CityId
  onCity: (id: CityId) => void
  selected: Ymd
  onSelect: (date: Ymd) => void
  onAddTrip: (id: CityId, date: Ymd) => void
}

const WEEK_JA = ['日', '月', '火', '水', '木', '金', '土']
const WEEK_EN = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

/** 月のカレンダー: 日ごとの顔と、大型イベント */
export function CalendarPage({ data, prefs, today, city, onCity, selected, onSelect, onAddTrip }: Props) {
  const { t, lang } = useI18n()
  const last = addDays(today, HORIZON_DAYS - 1)
  const start = parseYmd(today)
  const [offset, setOffset] = useState(() => {
    const s = parseYmd(selected)
    return (s.y - start.y) * 12 + (s.m - start.m)
  })
  const maxOffset = (parseYmd(last).y - start.y) * 12 + (parseYmd(last).m - start.m)
  const year = start.y + Math.floor((start.m - 1 + offset) / 12)
  const month = ((start.m - 1 + offset) % 12) + 1

  const cells = useMemo(() => {
    const first = ymd(year, month, 1)
    const lead = weekday(first)
    const n = daysInMonth(year, month)
    const out: (Ymd | null)[] = Array.from({ length: lead }, () => null)
    for (let d = 1; d <= n; d++) out.push(ymd(year, month, d))
    while (out.length % 7) out.push(null)
    return out
  }, [year, month])

  const info = cityById(city)!
  const inRange = (d: Ymd) => d >= today && d <= last
  const f = inRange(selected) ? data.forecast(city, selected) : null
  const dayEvents = eventsOn(data.events, selected, city)
  const { request } = data
  useEffect(() => {
    request([city], [selected])
  }, [request, city, selected])

  return (
    <div className="page">
      <CityPicker value={city} onChange={(id) => id !== 'all' && onCity(id)} favorites={prefs.prefs.favorites} />

      <div className="card cal-card">
        <div className="cal-head">
          <button type="button" className="icon-btn" disabled={offset <= 0} onClick={() => setOffset(offset - 1)} aria-label={t('cal.prev')}>
            ‹
          </button>
          <h2>
            {info.name[lang]} · {formatMonth(year, month, lang)}
          </h2>
          <button
            type="button"
            className="icon-btn"
            disabled={offset >= maxOffset}
            onClick={() => setOffset(offset + 1)}
            aria-label={t('cal.next')}
          >
            ›
          </button>
        </div>
        <div className="cal-grid" role="grid">
          {(lang === 'en' ? WEEK_EN : WEEK_JA).map((w, i) => (
            <span key={i} className={`cal-wd ${i === 0 ? 'sun' : i === 6 ? 'sat' : ''}`} role="columnheader">
              {w}
            </span>
          ))}
          {cells.map((d, i) => {
            if (!d) return <span key={`e${i}`} className="cal-cell empty" />
            const ok = inRange(d)
            const fc = ok ? data.forecast(city, d) : null
            const evs = eventsOn(data.events, d, city)
            const watched = dayWatch(prefs.prefs, city, d) !== undefined
            return (
              <button
                key={d}
                type="button"
                className={`cal-cell${ok ? '' : ' out'}${d === selected ? ' on' : ''}${d === today ? ' today' : ''}`}
                disabled={!ok && evs.length === 0}
                onClick={() => onSelect(d)}
                aria-label={`${formatDate(d, lang)}${fc ? ` ${t(`mood.${fc.mood}`)}` : ''}${evs.length ? ` ${t('cal.events', { n: evs.length })}` : ''}`}
              >
                <span className={`cal-d ${dayTone(d)}`}>{parseYmd(d).d}</span>
                {watched && (
                  <span className="cal-star" aria-label={t('watch.on')}>
                    ★
                  </span>
                )}
                {fc ? <Face mood={fc.mood} size={26} estimate={fc.source === 'estimate'} /> : <span className="cal-face-blank" />}
                <span className="cal-ev">{evs.slice(0, 3).map((e) => CATEGORY_ICON[e.category]).join('')}</span>
              </button>
            )
          })}
        </div>
        <p className="muted small">{t('cal.hint')}</p>
      </div>

      <div className="card">
        <div className="row">
          <h2 className={dayTone(selected)}>
            {formatDate(selected, lang)}
            {holidayName(selected) && <span className="holiday-tag">{holidayName(selected)![lang]}</span>}
          </h2>
          {f && <WatchStar prefs={prefs} city={city} date={selected} mood={f.mood} />}
        </div>
        {f ? (
          <div className="day-detail">
            <Face mood={f.mood} size={56} estimate={f.source === 'estimate'} label={t(`mood.${f.mood}`)} />
            <div>
              <strong>{t(`mood.${f.mood}`)}</strong>
              <Figures f={f} />
              <Reasons f={f} max={6} />
            </div>
          </div>
        ) : (
          <p className="muted">{t('cal.outOfRange', { n: diffDays(selected, today) })}</p>
        )}
        {dayEvents.length > 0 && (
          <ul className="event-list compact">
            {dayEvents.map((e) => (
              <li key={e.id}>
                <span className="ev-icon">{CATEGORY_ICON[e.category]}</span>
                <span>
                  <a href={e.url} target="_blank" rel="noopener noreferrer">
                    {e.title[lang] || e.title.ja}
                  </a>
                  <span className="muted small">
                    {' '}
                    {e.venue[lang] || e.venue.ja} · {formatRange(e.start, e.end, lang)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
        {f && (
          <div className="book-links">
            <a className="book jalan" href={jalanBookingUrl(info, selected)} target="_blank" rel="noopener sponsored">
              {t('book.jalan', { date: formatDate(selected, lang) })}
              <span className="pr-badge on-dark" title={t('book.prNote')}>
                PR
              </span>
            </a>
            <button type="button" className="secondary" onClick={() => onAddTrip(city, selected)}>
              ＋ {t('sheet.addTrip')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
