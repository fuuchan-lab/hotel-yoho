import { useMemo, useState } from 'react'
import type { CityId } from '../cities.ts'
import { dateRange, HORIZON_DAYS, type Ymd } from '../dates.ts'
import { annualOccupancy, type DayForecast } from '../forecast.ts'
import { formatDate, formatShortDate } from '../format.ts'
import { useI18n } from '../i18n/useI18n.ts'

interface Props {
  city: CityId
  today: Ymd
  forecast: (city: CityId, date: Ymd) => DayForecast
}

interface Point {
  date: Ymd
  /** ふだんを 100 とした水準 */
  value: number
  /** 前後 7 日の平均 */
  avg: number
  live: boolean
}

const W = 340
const H = 150
const PAD = { l: 30, r: 8, t: 10, b: 22 }

/**
 * その日の水準（ふだん = 100）。楽天トラベルの観測がある日は、安いほうから 30 軒の料金の中央値を、その都市のふだんの料金で割ったもの。
 * ない日は推定で、稼働率の目安を、その都道府県の年平均の稼働率で割ったもの（埋まるほど料金が上がるため、同じ向きに動く）
 */
function levelOf(f: DayForecast): { value: number; live: boolean } {
  if (f.source === 'live' && f.priceIndex != null) return { value: f.priceIndex * 100, live: true }
  return { value: (f.occupancy / annualOccupancy(f.city)) * 100, live: false }
}

/**
 * 料金の水準の推移（約 3 か月先まで）。金額ではなく、ふだんを 100 とした指数で、上がる傾向か下がる傾向かを見る。
 * 曜日でぎざぎざするので、前後 7 日の平均（太い線）で傾向を出し、日ごとの値は細い線にする
 */
export function TrendChart({ city, today, forecast }: Props) {
  const { t, lang } = useI18n()
  const [hover, setHover] = useState<number | null>(null)

  const points = useMemo<Point[]>(() => {
    const raw = dateRange(today, HORIZON_DAYS).map((date) => ({ date, ...levelOf(forecast(city, date)) }))
    return raw.map((p, i) => {
      const win = raw.slice(Math.max(0, i - 3), i + 4)
      return { ...p, avg: win.reduce((s, w) => s + w.value, 0) / win.length }
    })
  }, [city, today, forecast])

  const lo = Math.min(90, ...points.map((p) => Math.min(p.value, p.avg)))
  const hi = Math.max(110, ...points.map((p) => Math.max(p.value, p.avg)))
  const min = Math.floor((lo - 2) / 10) * 10
  const max = Math.ceil((hi + 2) / 10) * 10
  const x = (i: number) => PAD.l + (i / (points.length - 1)) * (W - PAD.l - PAD.r)
  const y = (v: number) => PAD.t + ((max - v) / (max - min)) * (H - PAD.t - PAD.b)

  // 7 日平均の線を、実データの区間（実線）と推定の区間（点線）に分ける
  const segments = useMemo(() => {
    const out: { live: boolean; from: number; to: number }[] = []
    points.forEach((p, i) => {
      const last = out[out.length - 1]
      if (last && last.live === p.live) last.to = i
      else out.push({ live: p.live, from: Math.max(0, i - 1), to: i })
    })
    return out
  }, [points])
  const path = (from: number, to: number, key: 'avg' | 'value') =>
    points
      .slice(from, to + 1)
      .map((p, k) => `${k === 0 ? 'M' : 'L'}${x(from + k).toFixed(1)},${y(p[key]).toFixed(1)}`)
      .join(' ')

  // 傾向: 向こう 1 週間の平均と、その次の 1 週間の平均を比べる
  const mean = (a: Point[]) => a.reduce((s, p) => s + p.value, 0) / Math.max(1, a.length)
  const week1 = mean(points.slice(0, 7))
  const week2 = mean(points.slice(7, 14))
  const diff = week2 - week1
  const trend = diff > 3 ? 'up' : diff < -3 ? 'down' : 'flat'
  const hasLive = points.some((p) => p.live)
  const ticks = [min, 100, max].filter((v, i, a) => a.indexOf(v) === i)
  const shown = hover === null ? null : points[hover]

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const box = e.currentTarget.getBoundingClientRect()
    const px = ((e.clientX - box.left) / box.width) * W
    const i = Math.round(((px - PAD.l) / (W - PAD.l - PAD.r)) * (points.length - 1))
    setHover(Math.min(points.length - 1, Math.max(0, i)))
  }

  return (
    <div className="card trend">
      <h3>{t('trend.title')}</h3>
      <p className={`trend-summary ${trend}`}>
        <span className="trend-arrow" aria-hidden="true">
          {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'}
        </span>
        {t(`trend.${trend}`, { now: Math.round(week1), next: Math.round(week2) })}
      </p>
      <svg
        className="trend-svg"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={t('trend.aria', { now: Math.round(week1), next: Math.round(week2) })}
        onPointerMove={onMove}
        onPointerDown={onMove}
        onPointerLeave={() => setHover(null)}
      >
        {ticks.map((v) => (
          <g key={v}>
            <line className={v === 100 ? 'trend-base' : 'trend-grid'} x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} />
            <text className="trend-tick" x={PAD.l - 5} y={y(v) + 3.5} textAnchor="end">
              {v}
            </text>
          </g>
        ))}
        {points.map((p, i) =>
          (p.date.endsWith('-01') && i > 12) || i === 0 ? (
            <text key={p.date} className="trend-tick" x={x(i)} y={H - 6} textAnchor={i === 0 ? 'start' : 'middle'}>
              {formatShortDate(p.date, lang)}
            </text>
          ) : null,
        )}
        <path className="trend-daily" d={path(0, points.length - 1, 'value')} />
        {segments.map((s) => (
          <path key={s.from} className={`trend-avg${s.live ? '' : ' est'}`} d={path(s.from, s.to, 'avg')} />
        ))}
        {shown && hover !== null && (
          <g>
            <line className="trend-cross" x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={H - PAD.b} />
            <circle className="trend-dot" cx={x(hover)} cy={y(shown.avg)} r={4} />
          </g>
        )}
      </svg>
      <p className="trend-read small" aria-live="polite">
        {shown
          ? t('trend.point', {
              date: formatDate(shown.date, lang),
              avg: Math.round(shown.avg),
              day: Math.round(shown.value),
              kind: t(shown.live ? 'trend.live' : 'trend.est'),
            })
          : t('trend.tap')}
      </p>
      <p className="trend-legend small muted">
        <span className="key avg" /> {t('trend.legendAvg')}
        <span className="key daily" /> {t('trend.legendDaily')}
        <span className="key est" /> {t('trend.legendEst')}
      </p>
      <p className="muted small">{t(hasLive ? 'trend.noteLive' : 'trend.noteEst')}</p>
    </div>
  )
}
