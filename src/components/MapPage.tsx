import { useCallback, useMemo } from 'react'
import { CITIES, type CityId } from '../cities.ts'
import type { Ymd } from '../dates.ts'
import type { DayForecast, Mood } from '../forecast.ts'
import { formatDate } from '../format.ts'
import { holidayName } from '../holidays.ts'
import type { ForecastData } from '../hooks/useForecastData.ts'
import { useI18n } from '../i18n/useI18n.ts'
import type { Prefs } from '../prefs.ts'
import { DateStrip } from './DateStrip.tsx'
import { Face } from './Face.tsx'
import { Figures, Reasons } from './ForecastDetail.tsx'
import { JapanMap } from './JapanMap.tsx'
import { Legend } from './Legend.tsx'

interface Props {
  data: ForecastData
  today: Ymd
  date: Ymd
  onDate: (date: Ymd) => void
  onCity: (id: CityId) => void
  prefs: Prefs
}

/** いちばん多い顔（同じ数なら混んでいるほう） */
function overallMood(moods: Mood[]): Mood {
  const counts = [0, 0, 0, 0, 0]
  for (const m of moods) counts[m]++
  let best: Mood = 2
  let max = -1
  counts.forEach((c, m) => {
    if (c >= max) {
      max = c
      best = m as Mood
    }
  })
  return best
}

export function MapPage({ data, today, date, onDate, onCity, prefs }: Props) {
  const { t, lang } = useI18n()
  const forecasts = useMemo(() => CITIES.map((c) => data.forecast(c.id, date)), [data, date])
  const overall = useCallback((d: Ymd) => overallMood(CITIES.map((c) => data.forecast(c.id, d).mood)), [data])
  const moodLabel = useCallback((f: DayForecast) => t(`mood.${f.mood}`), [t])
  const holiday = holidayName(date)

  // お気に入りを上に、あとは北から
  const list = useMemo(() => {
    const fav = new Set(prefs.favorites)
    return [...forecasts].sort((a, b) => Number(fav.has(b.city)) - Number(fav.has(a.city)))
  }, [forecasts, prefs.favorites])

  return (
    <div className="page">
      <DateStrip today={today} value={date} onChange={onDate} overall={overall} />
      <h2 className="map-title">
        {t('map.title', { date: formatDate(date, lang) })}
        {holiday && <span className="holiday-tag">{holiday[lang]}</span>}
      </h2>
      <div className="map-card">
        <JapanMap forecasts={forecasts} onCity={onCity} moodLabel={moodLabel} />
      </div>
      <Legend />
      <p className="muted small">{t('map.hint')}</p>

      <ul className="city-list">
        {list.map((f) => {
          const city = CITIES.find((c) => c.id === f.city)!
          return (
            <li key={f.city}>
              <button type="button" className="city-row" onClick={() => onCity(f.city)}>
                <Face mood={f.mood} size={40} estimate={f.source === 'estimate'} label={t(`mood.${f.mood}`)} />
                <span className="city-row-main">
                  <span className="city-row-name">
                    {prefs.favorites.includes(f.city) && <span className="star on" aria-label={t('fav.on')}>★</span>}
                    {city.name[lang]}
                    <span className="mood-text">{t(`mood.${f.mood}`)}</span>
                  </span>
                  <Figures f={f} />
                  <Reasons f={f} max={2} />
                </span>
                <span className="chev" aria-hidden="true">›</span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
