import { useEffect, useRef } from 'react'
import { ADSENSE_CLIENT, ADSENSE_SLOT, adsEnabled, loadAdsense } from '../ads.ts'

declare global {
  interface Window {
    adsbygoogle?: unknown[]
  }
}

/** Web 版だけの広告（Google AdSense）。Android アプリの中や、未設定の時は何も出さない */
export function AdBanner() {
  const enabled = adsEnabled()
  const ref = useRef<HTMLModElement>(null)
  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    loadAdsense()
      .then(() => {
        if (cancelled || !ref.current || ref.current.dataset.adsbygoogleStatus) return
        ;(window.adsbygoogle ??= []).push({})
      })
      .catch(() => {}) // 広告ブロックなどで読み込めなくても、アプリには影響しない
    return () => {
      cancelled = true
    }
  }, [enabled])
  if (!enabled) return null
  return (
    <aside className="ad-slot" aria-label="Advertisement">
      <ins ref={ref} className="adsbygoogle" style={{ display: 'block' }} data-ad-client={ADSENSE_CLIENT} data-ad-slot={ADSENSE_SLOT} data-ad-format="auto" data-full-width-responsive="true" />
    </aside>
  )
}
