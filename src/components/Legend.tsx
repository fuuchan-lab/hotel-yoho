import { MOODS } from '../forecast.ts'
import { useI18n } from '../i18n/useI18n.ts'
import { Face } from './Face.tsx'

/** 顔の意味（凡例） */
export function Legend() {
  const { t } = useI18n()
  return (
    <div className="legend" aria-label={t('legend.title')}>
      {MOODS.map((m) => (
        <span key={m} className="legend-item">
          <Face mood={m} size={24} />
          <span>{t(`mood.short.${m}`)}</span>
        </span>
      ))}
    </div>
  )
}
