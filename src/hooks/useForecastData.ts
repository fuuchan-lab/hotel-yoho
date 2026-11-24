import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Access } from '../access.ts'
import { fetchBaseline, fetchSummary, loadCachedBaseline, loadCachedSummary } from '../api.ts'
import type { CityId } from '../cities.ts'
import { todayJst, type Ymd } from '../dates.ts'
import { loadEvents, type BigEvent } from '../events.ts'
import { memoForecaster, type Summary } from '../forecast.ts'
import { fetchOwn, loadOwn, OWN_FRESH_MS, OWN_GAP_MS, ownSummary, saveOwn, type Baseline, type OwnObs, type RakutenKeys } from '../ownData.ts'

/** 一度に待たせる問い合わせの数の上限（古い頼みから捨てる） */
const QUEUE_MAX = 90
/** 届いた観測を画面に反映する間隔（1 件ごとに描き直すと重い） */
const FLUSH_EVERY = 4

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * 楽天トラベルの観測とイベントを読み込み、予報を出す関数を返す。観測の出どころは access.ts の区分による:
 * - trial（お試し）: 中継サーバーの共有のデータ（10 分ごとに取り直す）
 * - own（自分のキー）: request() で頼まれた都市・日付を、自分のキーで 1 秒に 1 件ずつ楽天に問い合わせる
 * - guest・expired: 観測なし（統計からの推定だけ）
 */
export function useForecastData(access: Access, keys: RakutenKeys | null) {
  const mode = access.mode
  const [shared, setShared] = useState<Summary | null>(loadCachedSummary)
  const [own, setOwn] = useState<OwnObs>(loadOwn)
  const [baseline, setBaseline] = useState<Baseline | null>(loadCachedBaseline)
  const [events, setEvents] = useState<BigEvent[]>([])
  const [liveError, setLiveError] = useState<string | null>(null)
  /** 自分のキーで問い合わせ中・待ちの件数 */
  const [pending, setPending] = useState(0)

  useEffect(() => {
    loadEvents()
      .then(setEvents)
      .catch((e) => console.error('[events]', e))
  }, [])

  const refresh = useCallback(async () => {
    try {
      setShared(await fetchSummary())
      setLiveError(null)
    } catch (e) {
      setLiveError(e instanceof Error ? e.message : String(e))
    }
  }, [])

  // お試し: 共有のデータ
  useEffect(() => {
    if (mode !== 'trial') return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh()
    const id = setInterval(() => void refresh(), 10 * 60_000)
    return () => clearInterval(id)
  }, [mode, refresh])

  // 自分のキー: 比べる基準（ふだんの料金・空室）だけを中継サーバーから受け取る
  useEffect(() => {
    if (mode !== 'own') return
    fetchBaseline()
      .then(setBaseline)
      .catch(() => {})
  }, [mode])

  // ---- 自分のキーでの問い合わせ（順番待ち） ----
  const ownRef = useRef(own)
  const queue = useRef<{ city: CityId; date: Ymd }[]>([])
  const running = useRef(false)
  const keysRef = useRef(keys)
  const modeRef = useRef(mode)
  useEffect(() => {
    keysRef.current = keys
    modeRef.current = mode
    if (mode !== 'own') queue.current = []
  }, [keys, mode])

  const pump = useCallback(async () => {
    if (running.current) return
    running.current = true
    let sinceFlush = 0
    const flush = () => {
      sinceFlush = 0
      setOwn(ownRef.current)
      saveOwn(ownRef.current)
    }
    try {
      while (queue.current.length > 0 && modeRef.current === 'own' && keysRef.current) {
        const { city, date } = queue.current.shift()!
        setPending(queue.current.length + 1)
        const res = await fetchOwn(keysRef.current, city, date)
        if (res.ok) {
          ownRef.current = { ...ownRef.current, [city]: { ...ownRef.current[city], [date]: res.obs } }
          setLiveError(null)
          if (++sinceFlush >= FLUSH_EVERY || queue.current.length === 0) flush()
        } else {
          // キーの誤り・回数の制限など: 残りはやめて、理由を設定の画面に出す
          setLiveError(res.error)
          queue.current = []
          break
        }
        if (queue.current.length > 0) await sleep(OWN_GAP_MS)
      }
    } finally {
      if (sinceFlush > 0) flush()
      running.current = false
      setPending(0)
    }
  }, [])

  /** その都市・日付の観測を頼む（自分のキーの時だけ。新しい観測があるものは飛ばす）。あとから頼んだものを先に問い合わせる */
  const request = useCallback(
    (cities: CityId[], dates: Ymd[]) => {
      if (modeRef.current !== 'own' || !keysRef.current) return
      const now = Date.now()
      const today = todayJst()
      const add: { city: CityId; date: Ymd }[] = []
      for (const date of dates) {
        if (date < today) continue
        for (const city of cities) {
          const have = ownRef.current[city]?.[date]
          if (have && now - have.at < OWN_FRESH_MS) continue
          add.push({ city, date })
        }
      }
      if (add.length === 0) return
      const keyOf = (q: { city: CityId; date: Ymd }) => `${q.city}|${q.date}`
      const fresh = new Set(add.map(keyOf))
      queue.current = [...add, ...queue.current.filter((q) => !fresh.has(keyOf(q)))].slice(0, QUEUE_MAX)
      void pump()
    },
    [pump],
  )

  const summary = useMemo<Summary | null>(
    () => (mode === 'trial' ? shared : mode === 'own' ? ownSummary(own, baseline) : null),
    [mode, shared, own, baseline],
  )

  // 同じ都市・日付の予報は覚えておく（日付の帯・地図・一覧で何千回も使うため）。観測・イベントが変わったら作り直す
  const forecast = useMemo(() => memoForecaster(summary, events), [summary, events])

  /** 実データのある都市・日数 */
  const liveDays = useMemo(() => {
    let n = 0
    for (const c of Object.values(summary?.cities ?? {})) n += Object.keys(c?.days ?? {}).length
    return n
  }, [summary])

  return { mode, summary, events, forecast, liveError, liveDays, pending, request }
}

export type ForecastData = ReturnType<typeof useForecastData>
