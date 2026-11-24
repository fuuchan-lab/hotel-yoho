import type { CityId } from '../cities.ts'
import type { Ymd } from '../dates.ts'
import type { Mood } from '../forecast.ts'
import type { PrefsState } from '../hooks/usePrefs.ts'
import { useI18n } from '../i18n/useI18n.ts'
import { dayWatch, toggleDayWatch } from '../watch.ts'

/** その日をウォッチする ★（カレンダー・1 週間の予報で使う） */
export function WatchStar({ prefs, city, date, mood, compact = false }: { prefs: PrefsState; city: CityId; date: Ymd; mood: Mood; compact?: boolean }) {
  const { t } = useI18n()
  const watch = dayWatch(prefs.prefs, city, date)
  const on = watch !== undefined
  // 何泊かの予定の一部は、ここでは外せない（ウォッチの画面で削除する）
  const locked = on && watch.nights > 1
  return (
    <button
      type="button"
      className={`watch-btn${on ? ' on' : ''}${compact ? ' compact' : ''}`}
      aria-pressed={on}
      disabled={locked}
      title={locked ? t('watch.locked') : undefined}
      onClick={() => prefs.update((p) => toggleDayWatch(p, city, date, mood))}
    >
      {on ? '★' : '☆'}
      {!compact && <span> {t(on ? 'watch.on' : 'watch.add')}</span>}
    </button>
  )
}
