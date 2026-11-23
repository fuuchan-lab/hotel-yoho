import type { GoogleAuth } from '../hooks/useGoogleAuth.ts'
import { useOnline } from '../hooks/useOnline.ts'
import { useI18n } from '../i18n/useI18n.ts'
import { GoogleLogo } from './GoogleLogo.tsx'

interface Props {
  auth: GoogleAuth
  syncing: boolean
  onAccount: () => void
}

/** アプリ名と Google ログインボタン（LeadLog と同じ形）。ログイン中に押すと設定のアカウントへ */
export function Header({ auth, syncing, onAccount }: Props) {
  const { t } = useI18n()
  const { account, connecting, login } = auth
  const online = useOnline()
  const live = account !== null && !connecting && online
  const label = connecting ? t('google.connecting') : account ? t('google.connected') : t('google.login')

  return (
    <>
      <header className="topbar">
        <div className="brand">
          <img className="brand-logo" src="./icon-192.png" alt="" />
          <div className="brand-text">
            <p className="eyebrow">{t('header.eyebrow')}</p>
            <h1>{t('app.title')}</h1>
          </div>
        </div>
        <button
          type="button"
          className={`google-button${live ? ' google-button-live' : ''}${account && syncing ? ' google-button-syncing' : ''}`}
          disabled={connecting}
          onClick={() => (account ? onAccount() : void login())}
        >
          <span
            className="google-mark"
            aria-hidden="true"
            style={account?.avatarUrl ? { backgroundImage: `url(${account.avatarUrl})` } : undefined}
          >
            {!account?.avatarUrl && <GoogleLogo />}
          </span>
          <span className={`google-text${account && !connecting ? ' connected' : ''}`}>{label}</span>
        </button>
      </header>

      {auth.notice && (
        <p
          className={`banner ${auth.notice.kind === 'ok' ? 'banner-ok' : 'banner-warning'}`}
          role={auth.notice.kind === 'ok' ? 'status' : 'alert'}
          onClick={auth.dismissNotice}
        >
          {t(auth.notice.key, auth.notice.vars)}
          {auth.notice.detail && (
            <>
              <br />
              <span className="small">
                {t('err.detail')}: {auth.notice.detail}
              </span>
            </>
          )}
          {auth.notice.kind === 'error' && (
            <>
              <br />
              <span className="small muted">{t('notice.dismissHint')}</span>
            </>
          )}
        </p>
      )}
    </>
  )
}
