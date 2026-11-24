import { BIG_CITIES, cityById, citiesIn, type CityId } from '../cities.ts'
import { useI18n } from '../i18n/useI18n.ts'

interface Props {
  value: CityId | 'all'
  onChange: (id: CityId | 'all') => void
  allowAll?: boolean
  favorites?: CityId[]
  /** 「すべて」の代わりの文言（地図では「全国平均」） */
  allLabel?: string
}

/**
 * 都市を選ぶ横並びのボタン。並べるのは大都市（人口 100 万人以上）とお気に入りだけにして、
 * 都市を選ぶと、その地方のほかの都市を 2 段目に出す（61 都市を一度に並べると長すぎるため）
 */
export function CityPicker({ value, onChange, allowAll = false, favorites = [], allLabel }: Props) {
  const { t, lang } = useI18n()
  const fav = new Set(favorites)
  const big = new Set(BIG_CITIES.map((c) => c.id))
  // お気に入りの小さい都市も 1 段目に（★ 付き）
  const top = [...favorites.filter((id) => !big.has(id)).map((id) => cityById(id)!), ...BIG_CITIES].sort(
    (a, b) => Number(fav.has(b.id)) - Number(fav.has(a.id)),
  )
  const region = value === 'all' ? null : cityById(value)?.region
  const sub = region ? citiesIn(region).filter((c) => !big.has(c.id)) : []

  return (
    <div className="city-picker">
      <div className="chip-row" role="group" aria-label={t('city.pick')}>
        {allowAll && (
          <button type="button" className="chip" aria-pressed={value === 'all'} onClick={() => onChange('all')}>
            {allLabel ?? t('city.all')}
          </button>
        )}
        {top.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`chip${region === c.region && value !== c.id ? ' in-region' : ''}`}
            aria-pressed={value === c.id}
            onClick={() => onChange(c.id)}
          >
            {fav.has(c.id) ? '★ ' : ''}
            {c.name[lang]}
          </button>
        ))}
      </div>
      {region && sub.length > 0 && (
        <div className="chip-row sub-row" role="group" aria-label={t('city.regionOf', { region: t(`region.${region}`) })}>
          <span className="sub-label">{t(`region.${region}`)}</span>
          {sub.map((c) => (
            <button key={c.id} type="button" className="chip small" aria-pressed={value === c.id} onClick={() => onChange(c.id)}>
              {fav.has(c.id) ? '★ ' : ''}
              {c.name[lang]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
