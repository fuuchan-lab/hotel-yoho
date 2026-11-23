import { useEffect } from 'react'
import { useI18n } from '../i18n/useI18n.ts'

interface Props {
  page: 'help' | 'privacy'
  hash?: string
  onClose: () => void
}

/** ヘルプ・プライバシーポリシーを画面に重ねて開く。右上の × で戻る（のりものレーダーと同じ） */
export function DocFrame({ page, hash, onClose }: Props) {
  const { t, lang } = useI18n()
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    // ページの中の × （直接開いた時用）から閉じる依頼が来た時
    const onMessage = (e: MessageEvent) => {
      if (e.origin === location.origin && e.data === 'close-doc') onClose()
    }
    document.addEventListener('keydown', onKey)
    window.addEventListener('message', onMessage)
    return () => {
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('message', onMessage)
    }
  }, [onClose])
  const anchor = hash ?? (lang === 'en' ? 'en' : '')
  return (
    <div className="doc-overlay" role="dialog" aria-modal="true">
      <iframe className="doc-frame" src={`./${page}.html${anchor ? `#${anchor}` : ''}`} title={t(page === 'help' ? 'set.help' : 'set.privacy')} />
      <button type="button" className="doc-close" onClick={onClose} aria-label={t('common.close')}>
        ✕
      </button>
    </div>
  )
}
