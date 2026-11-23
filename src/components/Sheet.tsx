import { useEffect, useId, type ReactNode } from 'react'
import { useI18n } from '../i18n/useI18n.ts'

interface Props {
  title: string
  onClose: () => void
  children: ReactNode
}

/** 画面の下から出る情報シート（スマホ）。PC では中央に出る */
export function Sheet({ title, onClose, children }: Props) {
  const { t } = useI18n()
  const id = useId()
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby={id} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h2 id={id}>{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label={t('common.close')}>
            ✕
          </button>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  )
}
