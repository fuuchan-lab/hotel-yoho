// Google AdSense（Web 版の下のほうの広告）。Android アプリ（Google Play 版の TWA）の中では出さない。
// 発行された値を入れると、広告が出る。空のままなら何も出ない（広告のコードも読み込まない）。
// 発行者 ID（ca-pub-…）は公開される値なので、コードに置いてよい。
export const ADSENSE_CLIENT: string = 'ca-pub-0807456611167337' // 例: 'ca-pub-1234567890123456'
export const ADSENSE_SLOT: string = '3666473643' // 広告ユニットの ID（数字）。AdSense の「広告」→「広告ユニットごと」で作る

/** Android アプリ（TWA）の中か。index.html が、最初の読み込みの referrer（android-app://）を見て付ける印 */
export function inAndroidApp(): boolean {
  return document.documentElement.classList.contains('in-app')
}

/** 広告を出してよいか（設定済みで、アプリの中ではない） */
export function adsEnabled(): boolean {
  return ADSENSE_CLIENT !== '' && ADSENSE_SLOT !== '' && !inAndroidApp()
}

let loading: Promise<void> | null = null

/** AdSense のスクリプトを、1 回だけ読み込む（広告を出す時だけ） */
export function loadAdsense(): Promise<void> {
  if (loading) return loading
  loading = new Promise<void>((resolve, reject) => {
    const s = document.createElement('script')
    s.async = true
    s.crossOrigin = 'anonymous'
    s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`
    s.onload = () => resolve()
    s.onerror = () => {
      loading = null
      reject(new Error('adsense'))
    }
    document.head.appendChild(s)
  })
  return loading
}
