import { useEffect, useRef, type ReactNode } from 'react'
import { useI18n } from '../i18n/useI18n.ts'

export type Tab = 'map' | 'calendar' | 'events' | 'trips' | 'settings'

export const TABS: Tab[] = ['map', 'calendar', 'events', 'trips', 'settings']

// アイコンは currentColor で塗る（LeadLog と同じ作り）。抜き部分は .cut（ドックの背景色）
const ICONS: Record<Tab, ReactNode> = {
  // 予報地図: 太陽と雲（天気予報）
  map: (
    <svg className="nav-icon" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="9" cy="9" r="4.2" fill="currentColor" />
      <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M9 1.8v1.8M2.6 9h1.8M4.4 4.4l1.3 1.3M13.6 4.4l-1.3 1.3" />
      </g>
      <path d="M8 20.5a4 4 0 0 1-.4-8 5 5 0 0 1 9.4-.8 3.9 3.9 0 0 1 .8 8.8z" fill="currentColor" opacity=".7" />
    </svg>
  ),
  calendar: (
    <svg className="nav-icon" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="2.6" y="4.2" width="18.8" height="17" rx="2.6" fill="currentColor" />
      <rect className="cut" x="4.6" y="9.2" width="14.8" height="10" rx="1.2" />
      <g fill="currentColor">
        <rect x="6.4" y="11" width="3" height="2.6" rx=".6" />
        <rect x="10.5" y="11" width="3" height="2.6" rx=".6" />
        <rect x="14.6" y="11" width="3" height="2.6" rx=".6" />
        <rect x="6.4" y="15" width="3" height="2.6" rx=".6" />
        <rect x="10.5" y="15" width="3" height="2.6" rx=".6" />
      </g>
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M7.6 2.4v3.4M16.4 2.4v3.4" />
      </g>
    </svg>
  ),
  // イベント: チケット
  events: (
    <svg className="nav-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2.4 7.2A1.6 1.6 0 0 1 4 5.6h16a1.6 1.6 0 0 1 1.6 1.6v2.4a2.4 2.4 0 0 0 0 4.8v2.4a1.6 1.6 0 0 1-1.6 1.6H4a1.6 1.6 0 0 1-1.6-1.6v-2.4a2.4 2.4 0 0 0 0-4.8z" fill="currentColor" />
      <path className="cut" d="m12 8.2 1.1 2.3 2.5.3-1.8 1.7.5 2.5-2.3-1.2-2.3 1.2.5-2.5-1.8-1.7 2.5-.3z" />
    </svg>
  ),
  // マイ予定: ベッド
  trips: (
    <svg className="nav-icon" viewBox="0 0 24 24" aria-hidden="true">
      <g fill="currentColor">
        <rect x="2" y="5" width="2.4" height="15" rx="1" />
        <rect x="2" y="13" width="20" height="4" rx="1" />
        <rect x="19.6" y="13" width="2.4" height="7" rx="1" />
        <circle cx="7.6" cy="10.4" r="2.2" />
        <path d="M10.8 8.6h7.4a3.4 3.4 0 0 1 3.4 3.4v1h-10.8z" />
      </g>
    </svg>
  ),
  settings: (
    <svg className="nav-icon" viewBox="0 0 24 24" aria-hidden="true">
      <g fill="currentColor">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
          <rect key={deg} x="10.2" y="1.6" width="3.6" height="5.4" rx="1.1" transform={`rotate(${deg} 12 12)`} />
        ))}
        <circle cx="12" cy="12" r="7.4" />
      </g>
      <circle className="cut" cx="12" cy="12" r="3.2" />
    </svg>
  ),
}

interface Props {
  tab: Tab
  onTab: (tab: Tab) => void
  /** 予定の泊に、困った顔の日があれば「！」 */
  tripAlert: boolean
}

/** 画面の下に固定するメニュー（LeadLog と同じ形） */
export function BottomDock({ tab, onTab, tripAlert }: Props) {
  const { t } = useI18n()
  const ref = useRef<HTMLDivElement>(null)

  // ドックの高さを --dock-h に入れる（本体の下の余白に使い、内容がドックに隠れないようにする）
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const sync = () => document.documentElement.style.setProperty('--dock-h', `${el.offsetHeight}px`)
    sync()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(sync)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="bottom-dock" ref={ref}>
      <nav className="bottom-nav" aria-label={t('nav.menu')}>
        {TABS.map((id) => (
          <button
            key={id}
            type="button"
            className={`nav-item${tab === id ? ' active' : ''}`}
            aria-current={tab === id ? 'page' : undefined}
            onClick={() => onTab(id)}
          >
            <span className="nav-icon-wrap">
              {ICONS[id]}
              {id === 'trips' && tripAlert && (
                <span className="nav-bang" aria-label={t('nav.tripAlert')}>
                  !
                </span>
              )}
            </span>
            <span>{t(`nav.${id}`)}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
