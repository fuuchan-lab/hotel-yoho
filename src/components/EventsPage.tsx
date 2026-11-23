import { useMemo, useState } from 'react'
import { cityById, type CityId } from '../cities.ts'
import { parseYmd, type Ymd } from '../dates.ts'
import { EVENT_CATEGORIES, type EventCategory } from '../events.ts'
import { formatMonth, formatRange } from '../format.ts'
import type { ForecastData } from '../hooks/useForecastData.ts'
import type { PrefsState } from '../hooks/usePrefs.ts'
import { useI18n } from '../i18n/useI18n.ts'
import { CityPicker } from './CityPicker.tsx'
import { CATEGORY_ICON } from './eventIcons.ts'
import { Face } from './Face.tsx'

interface Props {
  data: ForecastData
  prefs: PrefsState
  today: Ymd
  onOpen: (city: CityId, date: Ymd) => void
}

/** 大型イベントの一覧（都市・種類で絞り込み、印を付けられる） */
export function EventsPage({ data, prefs, today, onOpen }: Props) {
  const { t, lang } = useI18n()
  const [city, setCity] = useState<CityId | 'all'>('all')
  const [cats, setCats] = useState<Set<EventCategory>>(new Set())
  const [starredOnly, setStarredOnly] = useState(false)
  const starred = new Set(prefs.prefs.starred)

  const list = useMemo(
    () =>
      data.events.filter(
        (e) =>
          e.end >= today &&
          (city === 'all' || e.city === city) &&
          (cats.size === 0 || cats.has(e.category)) &&
          (!starredOnly || prefs.prefs.starred.includes(e.id)),
      ),
    [data.events, today, city, cats, starredOnly, prefs.prefs.starred],
  )

  const groups = useMemo(() => {
    const map = new Map<string, typeof list>()
    for (const e of list) {
      const s = e.start < today ? today : e.start
      const key = s.slice(0, 7)
      map.set(key, [...(map.get(key) ?? []), e])
    }
    return [...map.entries()]
  }, [list, today])

  const toggleCat = (c: EventCategory) => {
    const next = new Set(cats)
    if (next.has(c)) next.delete(c)
    else next.add(c)
    setCats(next)
  }

  return (
    <div className="page">
      <CityPicker value={city} onChange={setCity} allowAll favorites={prefs.prefs.favorites} />
      <div className="chip-row" role="group" aria-label={t('ev.kind')}>
        {EVENT_CATEGORIES.map((c) => (
          <button key={c} type="button" className="chip" aria-pressed={cats.has(c)} onClick={() => toggleCat(c)}>
            {CATEGORY_ICON[c]} {t(`cat.${c}`)}
          </button>
        ))}
        <button type="button" className="chip" aria-pressed={starredOnly} onClick={() => setStarredOnly(!starredOnly)}>
          ★ {t('ev.starredOnly')}
        </button>
      </div>

      {groups.length === 0 && <p className="muted">{t('ev.none')}</p>}
      {groups.map(([month, items]) => {
        const { y, m } = parseYmd(`${month}-01`)
        return (
          <section key={month} className="card">
            <h2>{formatMonth(y, m, lang)}</h2>
            <ul className="event-list">
              {items.map((e) => {
                const c = cityById(e.city)!
                const night = e.start < today ? today : e.start
                const f = data.forecast(e.city, night)
                const on = starred.has(e.id)
                return (
                  <li key={e.id} className="event-item">
                    <span className="ev-icon" aria-hidden="true">
                      {CATEGORY_ICON[e.category]}
                    </span>
                    <span className="ev-main">
                      <span className="ev-date">{formatRange(e.start, e.end, lang)}</span>
                      <a className="ev-title" href={e.url} target="_blank" rel="noopener noreferrer">
                        {e.title[lang] || e.title.ja}
                      </a>
                      <span className="muted small">
                        {c.name[lang]} · {e.venue[lang] || e.venue.ja} · {t(`scale.${e.scale}`)}
                      </span>
                    </span>
                    <span className="ev-side">
                      <button
                        type="button"
                        className="icon-btn ev-forecast"
                        onClick={() => onOpen(e.city, night)}
                        aria-label={t('ev.forecast', { city: c.name[lang] })}
                      >
                        <Face mood={f.mood} size={30} estimate={f.source === 'estimate'} />
                      </button>
                      <button
                        type="button"
                        className={`icon-btn star${on ? ' on' : ''}`}
                        aria-pressed={on}
                        aria-label={t(on ? 'ev.unstar' : 'ev.star')}
                        onClick={() =>
                          prefs.update((p) => ({
                            ...p,
                            starred: on ? p.starred.filter((s) => s !== e.id) : [...p.starred, e.id],
                          }))
                        }
                      >
                        {on ? '★' : '☆'}
                      </button>
                    </span>
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}
      <p className="muted small">{t('ev.note')}</p>
    </div>
  )
}
