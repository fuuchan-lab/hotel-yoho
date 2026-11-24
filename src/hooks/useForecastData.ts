import { useEffect, useMemo, useState } from 'react'
import { loadEvents, type BigEvent } from '../events.ts'
import { memoForecaster } from '../forecast.ts'

/** 大型イベントを読み込み、予報を出す関数を返す（予報は統計・曜日・時期・イベントから、端末の中で計算する） */
export function useForecastData() {
  const [events, setEvents] = useState<BigEvent[]>([])

  useEffect(() => {
    loadEvents()
      .then(setEvents)
      .catch((e) => console.error('[events]', e))
  }, [])

  // 同じ都市・日付の予報は覚えておく（日付の帯・地図・一覧で何千回も使うため）。イベントが届いたら作り直す
  const forecast = useMemo(() => memoForecaster(events), [events])

  return { events, forecast }
}

export type ForecastData = ReturnType<typeof useForecastData>
