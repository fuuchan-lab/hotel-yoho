import { CITIES, type CityId } from '../cities.ts'
import { useI18n } from '../i18n/useI18n.ts'

interface Props {
  value: CityId | 'all'
  onChange: (id: CityId | 'all') => void
  allowAll?: boolean
  favorites?: CityId[]
  /** 「すべて」の代わりの文言（地図では「全国平均」） */
  allLabel?: string
}

/** 都市を選ぶ横並びのボタン（お気に入りを先に） */
export function CityPicker({ value, onChange, allowAll = false, favorites = [], allLabel }: Props) {
  const { t, lang } = useI18n()
  const fav = new Set(favorites)
  const cities = [...CITIES].sort((a, b) => Number(fav.has(b.id)) - Number(fav.has(a.id)))
  return (
    <div className="chip-row" role="group" aria-label={t('city.pick')}>
      {allowAll && (
        <button type="button" className="chip" aria-pressed={value === 'all'} onClick={() => onChange('all')}>
          {allLabel ?? t('city.all')}
        </button>
      )}
      {cities.map((c) => (
        <button key={c.id} type="button" className="chip" aria-pressed={value === c.id} onClick={() => onChange(c.id)}>
          {fav.has(c.id) ? '★ ' : ''}
          {c.name[lang]}
        </button>
      ))}
    </div>
  )
}
