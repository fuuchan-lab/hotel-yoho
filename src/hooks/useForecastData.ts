import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchSummary, loadCachedSummary } from '../api.ts'
import type { CityId } from '../cities.ts'
import type { Ymd } from '../dates.ts'
import { loadEvents, type BigEvent } from '../events.ts'
import { forecastFor, type DayForecast, type Summary } from '../forecast.ts'

/** 観測（中継サーバー）とイベントを読み込み、予報を出す関数を返す。10 分ごとに観測を取り直す */
export function useForecastData() {
  const [summary, setSummary] = useState<Summary | null>(loadCachedSummary)
  const [events, setEvents] = useState<BigEvent[]>([])
  const [liveError, setLiveError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setSummary(await fetchSummary())
      setLiveError(null)
    } catch (e) {
      setLiveError(e instanceof Error ? e.message : String(e))
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh()
    loadEvents()
      .then(setEvents)
      .catch((e) => console.error('[events]', e))
    const id = setInterval(() => void refresh(), 10 * 60_000)
    return () => clearInterval(id)
  }, [refresh])

  const forecast = useCallback(
    (city: CityId, date: Ymd): DayForecast => forecastFor(city, date, summary, events),
    [summary, events],
  )

  /** 実データのある都市・日数 */
  const liveDays = useMemo(() => {
    let n = 0
    for (const c of Object.values(summary?.cities ?? {})) n += Object.keys(c?.days ?? {}).length
    return n
  }, [summary])

  return { summary, events, forecast, liveError, liveDays, refresh }
}

export type ForecastData = ReturnType<typeof useForecastData>
