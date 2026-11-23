import { API_BASE } from '../api.ts'
import { CITIES, isCityId } from '../cities.ts'
import { driveConfig } from '../drive.ts'
import { MOODS } from '../forecast.ts'
import { formatTime } from '../format.ts'
import type { GoogleAuth } from '../hooks/useGoogleAuth.ts'
import type { ForecastData } from '../hooks/useForecastData.ts'
import type { PrefsState } from '../hooks/usePrefs.ts'
import { useI18n } from '../i18n/useI18n.ts'
import type { Lang } from '../i18n/context.ts'
import type { ThemePreference } from '../theme.ts'
import { Face } from './Face.tsx'

interface Props {
  auth: GoogleAuth
  prefs: PrefsState
  data: ForecastData
  theme: ThemePreference
  /** 配色を選ぶ（端末と、ログイン中は Google ドライブにも残す） */
  onTheme: (t: ThemePreference) => void
  /** 言語を選ぶ（端末と、ログイン中は Google ドライブにも残す） */
  onLang: (l: Lang) => void
  onDoc: (page: 'help' | 'privacy', hash?: string) => void
}

export function SettingsPage({ auth, prefs, data, theme, onTheme, onLang, onDoc }: Props) {
  const { t, lang } = useI18n()
  const p = prefs.prefs
  const updated = data.summary?.updatedAt

  return (
    <div className="page">
      <section className="card">
        <h2>{t('set.account')}</h2>
        {auth.account ? (
          <>
            <p>{auth.account.email ?? auth.account.name}</p>
            <p className="muted small">{t('account.storage', { folder: driveConfig.folderName })}</p>
            <p className={prefs.status === 'error' ? 'error small' : 'muted small'}>
              {t(`sync.${prefs.status}`)}
              {prefs.status === 'error' && prefs.error ? ` (${prefs.error})` : ''}
            </p>
            <div className="row gap wrap">
              <button type="button" className="secondary" onClick={() => void auth.switchAccount()}>
                {t('account.switch')}
              </button>
              <button type="button" className="danger-btn" onClick={auth.signOut}>
                {t('account.signOut')}
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="muted">{t('set.guest')}</p>
            <button type="button" className="primary" disabled={auth.connecting} onClick={() => void auth.login()}>
              {t('google.login')}
            </button>
          </>
        )}
      </section>

      <section className="card">
        <h2>{t('set.language')}</h2>
        <div className="seg">
          <button type="button" className={lang === 'ja' ? 'on' : ''} onClick={() => onLang('ja')}>
            日本語
          </button>
          <button type="button" className={lang === 'en' ? 'on' : ''} onClick={() => onLang('en')}>
            English
          </button>
        </div>
        <h2>{t('set.theme')}</h2>
        <div className="seg">
          {(['auto', 'light', 'dark'] as ThemePreference[]).map((v) => (
            <button
              key={v}
              type="button"
              className={theme === v ? 'on' : ''}
              onClick={() => onTheme(v)}
            >
              {t(`theme.${v}`)}
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>{t('set.cities')}</h2>
        <label className="field">
          <span>{t('set.home')}</span>
          <select
            value={p.homeCity ?? ''}
            onChange={(e) => prefs.update((cur) => ({ ...cur, homeCity: isCityId(e.target.value) ? e.target.value : null }))}
          >
            <option value="">{t('set.homeNone')}</option>
            {CITIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name[lang]}
              </option>
            ))}
          </select>
        </label>
        <p className="muted small">{t('set.favorites')}</p>
        <div className="chip-row wrap">
          {CITIES.map((c) => {
            const on = p.favorites.includes(c.id)
            return (
              <button
                key={c.id}
                type="button"
                className="chip"
                aria-pressed={on}
                onClick={() =>
                  prefs.update((cur) => ({
                    ...cur,
                    favorites: on ? cur.favorites.filter((x) => x !== c.id) : [...cur.favorites, c.id],
                  }))
                }
              >
                {on ? '★' : '☆'} {c.name[lang]}
              </button>
            )
          })}
        </div>
      </section>

      <section className="card">
        <h2>{t('set.howTitle')}</h2>
        <ul className="mood-guide">
          {MOODS.map((m) => (
            <li key={m}>
              <Face mood={m} size={32} />
              <span>
                <strong>{t(`mood.${m}`)}</strong>
                <br />
                <span className="muted small">{t(`mood.desc.${m}`)}</span>
              </span>
            </li>
          ))}
          <li>
            <Face mood={2} size={32} estimate />
            <span className="muted small">{t('set.estimateDesc')}</span>
          </li>
        </ul>
        <p className="small">{t('set.how')}</p>
      </section>

      <section className="card">
        <h2>{t('set.data')}</h2>
        <p className="small">
          {data.liveDays > 0
            ? t('set.liveStatus', { n: data.liveDays, time: updated ? formatTime(updated, lang) : '-' })
            : t('set.noLive')}
        </p>
        {data.liveError && (
          <p className="muted small">
            {t('set.liveError')} ({data.liveError})
          </p>
        )}
        <p className="small">{t('set.eventsCount', { n: data.events.length })}</p>
        <ul className="small sources">
          <li>
            {t('src.rakuten')}{' '}
            <a href="https://webservice.rakuten.co.jp/" target="_blank" rel="noopener noreferrer">
              Supported by Rakuten Developers
            </a>
          </li>
          <li>{t('src.others')}</li>
          <li>
            {t('src.map')}{' '}
            <a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank" rel="noopener noreferrer">
              国土地理院
            </a>
            {' · '}
            <a href="https://www.marineregions.org" target="_blank" rel="noopener noreferrer">
              Marine Regions
            </a>
          </li>
          <li>{t('src.events')}</li>
        </ul>
        <p className="muted small">API: {API_BASE}</p>
      </section>

      <section className="card">
        <h2>{t('set.about')}</h2>
        <div className="row gap wrap">
          <button type="button" className="secondary" onClick={() => onDoc('help')}>
            {t('set.help')}
          </button>
          <button type="button" className="secondary" onClick={() => onDoc('privacy')}>
            {t('set.privacy')}
          </button>
          <button type="button" className="secondary donate-part" onClick={() => onDoc('help', lang === 'en' ? 'en-donate' : 'ja-donate')}>
            ♥ {t('set.support')}
          </button>
        </div>
        <p className="muted small">{t('set.disclaimer')}</p>
      </section>
    </div>
  )
}
