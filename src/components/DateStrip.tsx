import { useEffect, useRef } from 'react'
import { dateRange, HORIZON_DAYS, type Ymd } from '../dates.ts'
import type { Mood } from '../forecast.ts'
import { dayTone, formatShortDate, weekdayLabel } from '../format.ts'
import { useI18n } from '../i18n/useI18n.ts'
import { Face } from './Face.tsx'

interface Props {
  today: Ymd
  value: Ymd
  onChange: (date: Ymd) => void
  /** その日の全国のようす（いちばん多い顔） */
  overall: (date: Ymd) => Mood
}

/** 2 か月分の日付を横に並べ、選んだ日の予報を地図に出す（天気予報の週間表示のように） */
export function DateStrip({ today, value, onChange, overall }: Props) {
  const { lang, t } = useI18n()
  const ref = useRef<HTMLDivElement>(null)
  const days = dateRange(today, HORIZON_DAYS)

  useEffect(() => {
    const el = ref.current?.querySelector<HTMLElement>('[aria-pressed="true"]')
    el?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' })
  }, [value])

  return (
    <div className="date-strip" ref={ref} role="group" aria-label={t('map.pickDate')}>
      {days.map((d, i) => (
        <button
          key={d}
          type="button"
          className={`date-chip ${dayTone(d)}`}
          aria-pressed={d === value}
          onClick={() => onChange(d)}
        >
          <span className="date-chip-wd">{i === 0 ? t('date.today') : i === 1 ? t('date.tomorrow') : weekdayLabel(d, lang)}</span>
          <span className="date-chip-d">{formatShortDate(d, lang)}</span>
          <Face mood={overall(d)} size={22} />
        </button>
      ))}
    </div>
  )
}
