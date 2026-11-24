import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { TRIAL_DAYS, type Access } from '../access.ts'
import { BIG_CITIES, CITIES, cityById, citiesIn, type CityId } from '../cities.ts'
import { dateRange, type Ymd } from '../dates.ts'
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
import { Legend } from './Legend.tsx'

// 地図のライブラリ（MapLibre）は大きいので分けて読み込み、日付の帯・一覧を先に出す
const JapanMap = lazy(() => import('./JapanMap.tsx').then((m) => ({ default: m.JapanMap })))

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
  /** 楽天トラベルの実データを、だれのキーで見るか */
  access: Access
  onSettings: () => void
}

export function MapPage({ data, today, date, onDate, onCity, prefs, stripCity, onStripCity, access, onSettings }: Props) {
  const { t, lang } = useI18n()
  const { forecast, request } = data
  // 地図を拡大している間は、沖縄の枠を隠す（地図のじゃまになるため。那覇は地図を動かせば本来の位置にある）
  const [zoomed, setZoomed] = useState(false)
  // 自分のキーの時: 選んだ日の、大都市・お気に入り・選んだ都市の地方を楽天に問い合わせる。都市を選んでいれば、その 1 週間も
  const favorites = prefs.favorites
  useEffect(() => {
    const ids = new Set<CityId>([...favorites, ...BIG_CITIES.map((c) => c.id)])
    if (stripCity) for (const c of citiesIn(cityById(stripCity)!.region)) ids.add(c.id)
    request([...ids], [date])
    if (stripCity) request([stripCity], dateRange(date, 7))
  }, [request, date, stripCity, favorites])
  const forecasts = useMemo(() => CITIES.map((c) => forecast(c.id, date)), [forecast, date])
  // 日付の帯の顔: 最初は全国平均、都市を選んだらその都市の予報
  const overall = useCallback(
    (d: Ymd) => {
      if (stripCity) {
        const f = forecast(stripCity, d)
        return { mood: f.mood, estimate: f.source === 'estimate' }
      }
      const all = CITIES.map((c) => forecast(c.id, d))
      return {
        mood: averageMood(all.map((f) => f.mood)),
        estimate: all.every((f) => f.source === 'estimate'),
      }
    },
    [forecast, stripCity],
  )
  const stripName = stripCity ? cityById(stripCity)!.name[lang] : t('map.national')
  const naha = forecasts.find((f) => f.city === 'naha')
  const moodLabel = useCallback((f: DayForecast) => t(`mood.${f.mood}`), [t])
  const holiday = holidayName(date)

  // 地図の下の一覧: お気に入り、選んだ都市の地方、大都市の順（61 都市を全部並べると長いので）
  const sections = useMemo(() => {
    const byCity = new Map(forecasts.map((f) => [f.city, f]))
    const shown = new Set<CityId>()
    const take = (ids: CityId[]) => ids.filter((id) => !shown.has(id) && shown.add(id)).map((id) => byCity.get(id)!)
    const region = stripCity ? cityById(stripCity)!.region : null
    return [
      { key: 'fav', title: t('city.favorites'), items: take(prefs.favorites) },
      ...(region
        ? [
            {
              key: 'region',
              title: t('city.regionOf', { region: t(`region.${region}`) }),
              items: take(citiesIn(region).map((c) => c.id)),
            },
          ]
        : []),
      {
        key: 'big',
        title: t('city.big'),
        items: take(BIG_CITIES.map((c) => c.id)),
      },
    ].filter((sec) => sec.items.length > 0)
  }, [forecasts, prefs.favorites, stripCity, t])

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
        <Suspense fallback={<div className="japan-map" />}>
          <JapanMap forecasts={forecasts} onCity={onCity} moodLabel={moodLabel} selected={stripCity} onZoomed={setZoomed} />
        </Suspense>
        {naha && !zoomed && (
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
      {access.mode !== 'own' && (
        <p className={`live-note ${access.mode}`}>
          <span>
            {access.mode === 'guest'
              ? t('live.guest', { n: TRIAL_DAYS })
              : access.mode === 'trial'
                ? t('live.trial', { n: access.daysLeft })
                : t('live.expired')}
          </span>
          <button type="button" className="link-btn" onClick={onSettings}>
            {t('live.open')}
          </button>
        </p>
      )}
      <Legend />
      <p className="muted small">{t('map.hint')}</p>

      {sections.map((sec) => (
        <section key={sec.key} className="city-section">
          <h3 className="city-section-title">{sec.title}</h3>
          <ul className="city-list">
            {sec.items.map((f) => {
              const city = cityById(f.city)!
              return (
                <li key={f.city}>
                  <button type="button" className="city-row" onClick={() => onCity(f.city)}>
                    <Face mood={f.mood} size={40} estimate={f.source === 'estimate'} label={t(`mood.${f.mood}`)} />
                    <span className="city-row-main">
                      <span className="city-row-name">
                        {prefs.favorites.includes(f.city) && (
                          <span className="star on" aria-label={t('fav.on')}>
                            ★
                          </span>
                        )}
                        {city.name[lang]}
                        <span className="mood-text">{t(`mood.${f.mood}`)}</span>
                      </span>
                      <Figures f={f} />
                      <Reasons f={f} max={2} />
                    </span>
                    <span className="chev" aria-hidden="true">
                      ›
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}
