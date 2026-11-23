import { useCallback, useMemo } from 'react'
import { CITIES, type CityId } from '../cities.ts'
import type { Ymd } from '../dates.ts'
import { averageMood, type DayForecast } from '../forecast.ts'
import { formatDate } from '../format.ts'
import { holidayName } from '../holidays.ts'
import type { ForecastData } from '../hooks/useForecastData.ts'
import { useI18n } from '../i18n/useI18n.ts'
import type { Prefs } from '../prefs.ts'
import { CityPicker } from './CityPicker.tsx'
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
  /** 日付の帯に出す都市。null なら全国平均 */
  stripCity: CityId | null
  onStripCity: (id: CityId | null) => void
}

export function MapPage({ data, today, date, onDate, onCity, prefs, stripCity, onStripCity }: Props) {
  const { t, lang } = useI18n()
  const forecasts = useMemo(() => CITIES.map((c) => data.forecast(c.id, date)), [data, date])
  // 日付の帯の顔: 最初は全国平均、都市を選んだらその都市の予報
  const overall = useCallback(
    (d: Ymd) => {
      if (stripCity) {
        const f = data.forecast(stripCity, d)
        return { mood: f.mood, estimate: f.source === 'estimate' }
      }
      const all = CITIES.map((c) => data.forecast(c.id, d))
      return { mood: averageMood(all.map((f) => f.mood)), estimate: all.every((f) => f.source === 'estimate') }
    },
    [data, stripCity],
  )
  const stripName = stripCity ? CITIES.find((c) => c.id === stripCity)!.name[lang] : t('map.national')
  const naha = forecasts.find((f) => f.city === 'naha')
  const moodLabel = useCallback((f: DayForecast) => t(`mood.${f.mood}`), [t])
  const holiday = holidayName(date)

  // お気に入りを上に、あとは北から
  const list = useMemo(() => {
    const fav = new Set(prefs.favorites)
    return [...forecasts].sort((a, b) => Number(fav.has(b.city)) - Number(fav.has(a.city)))
  }, [forecasts, prefs.favorites])

  return (
    <div className="page">
      <CityPicker
        value={stripCity ?? 'all'}
        onChange={(id) => onStripCity(id === 'all' ? null : id)}
        allowAll
        allLabel={t('map.national')}
        favorites={prefs.favorites}
      />
      <DateStrip today={today} value={date} onChange={onDate} overall={overall} />
      <h2 className="map-title">
        <span className="strip-name">{stripName}</span>
        {t('map.title', { date: formatDate(date, lang) })}
        {holiday && <span className="holiday-tag">{holiday[lang]}</span>}
      </h2>
      <div className="map-card">
        <JapanMap forecasts={forecasts} onCity={onCity} moodLabel={moodLabel} selected={stripCity} />
        {naha && (
          // 天気予報の地図と同じく、沖縄は左下の囲みに出す（地図を動かせば本来の位置にも顔がある）
          <button
            type="button"
            className={`okinawa-inset${stripCity === 'naha' ? ' selected' : ''}`}
            onClick={() => onCity('naha')}
            aria-label={`${CITIES.find((c) => c.id === 'naha')!.name[lang]}: ${t(`mood.${naha.mood}`)}`}
          >
            <span className="okinawa-title">{t('map.okinawa')}</span>
            <Face mood={naha.mood} size={36} estimate={naha.source === 'estimate'} />
            <span className="pin-name">{CITIES.find((c) => c.id === 'naha')!.name[lang]}</span>
          </button>
        )}
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
