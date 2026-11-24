import { useState } from 'react'
import { TRIAL_DAYS, type Access } from '../access.ts'
import { addDays, todayJst } from '../dates.ts'
import type { ForecastData } from '../hooks/useForecastData.ts'
import type { PrefsState } from '../hooks/usePrefs.ts'
import { useI18n } from '../i18n/useI18n.ts'
import { clearOwn, fetchOwn } from '../ownData.ts'

interface Props {
  prefs: PrefsState
  access: Access
  data: ForecastData
  onLogin: () => void
  onHelp: () => void
}

type Test = { state: 'idle' } | { state: 'testing' } | { state: 'ok'; n: number } | { state: 'ng'; error: string }

/**
 * 設定の「楽天トラベルの実データ」: いまの区分（お試し・終了・自分のキー）と、自分の楽天ウェブサービスのキーの登録。
 * 保存する前に、そのキーで 1 回問い合わせて確かめる
 */
export function RakutenKeyCard({ prefs, access, data, onLogin, onHelp }: Props) {
  const { t } = useI18n()
  const saved = prefs.prefs.rakuten
  const [appId, setAppId] = useState(saved?.appId ?? '')
  const [accessKey, setAccessKey] = useState(saved?.accessKey ?? '')
  const [test, setTest] = useState<Test>({ state: 'idle' })
  const mode = access.mode

  const save = async () => {
    const keys = { appId: appId.trim(), accessKey: accessKey.trim() }
    if (!keys.appId) return
    setTest({ state: 'testing' })
    const res = await fetchOwn(keys, 'tokyo', addDays(todayJst(), 7))
    if (!res.ok) {
      setTest({ state: 'ng', error: res.error })
      return
    }
    setTest({ state: 'ok', n: res.obs.v })
    prefs.update((p) => ({ ...p, rakuten: keys }))
  }

  const remove = () => {
    prefs.update((p) => ({ ...p, rakuten: null }))
    clearOwn()
    setAppId('')
    setAccessKey('')
    setTest({ state: 'idle' })
  }

  return (
    <section className="card">
      <h2>{t('key.title')}</h2>
      <p className={`key-status ${mode}`}>
        {mode === 'guest'
          ? t('key.status.guest', { n: TRIAL_DAYS })
          : mode === 'trial'
            ? t('key.status.trial', { n: access.daysLeft })
            : mode === 'expired'
              ? t('key.status.expired')
              : t('key.status.own')}
      </p>
      {mode === 'own' && data.pending > 0 && <p className="muted small">{t('key.pending', { n: data.pending })}</p>}
      {mode === 'own' && data.liveError && (
        <p className="error small">
          {t('key.ng', { error: data.liveError })}
          <br />
          {t('key.ngHint')}
        </p>
      )}
      <p className="muted small">{t('key.why')}</p>

      {mode === 'guest' ? (
        <>
          <p className="muted small">{t('key.needLogin')}</p>
          <div className="row gap wrap">
            <button type="button" className="primary" onClick={onLogin}>
              {t('google.login')}
            </button>
            <button type="button" className="secondary" onClick={onHelp}>
              {t('key.howto')}
            </button>
          </div>
        </>
      ) : (
        <div className="key-form">
          <label className="field">
            <span>{t('key.appId')}</span>
            <input type="text" value={appId} onChange={(e) => setAppId(e.target.value)} autoComplete="off" autoCapitalize="off" spellCheck={false} />
          </label>
          <label className="field">
            <span>{t('key.accessKey')}</span>
            <input type="text" value={accessKey} onChange={(e) => setAccessKey(e.target.value)} autoComplete="off" autoCapitalize="off" spellCheck={false} />
          </label>
          <div className="row gap wrap">
            <button type="button" className="primary" disabled={!appId.trim() || test.state === 'testing'} onClick={() => void save()}>
              {t('key.save')}
            </button>
            <button type="button" className="secondary" onClick={onHelp}>
              {t('key.howto')}
            </button>
            {saved && (
              <button type="button" className="danger-btn" onClick={remove}>
                {t('key.delete')}
              </button>
            )}
          </div>
          {test.state === 'testing' && <p className="muted small">{t('key.testing')}</p>}
          {test.state === 'ok' && <p className="small">✅ {t('key.ok', { n: test.n })}</p>}
          {test.state === 'ng' && (
            <p className="error small">
              {t('key.ng', { error: test.error })}
              <br />
              {t('key.ngHint')}
            </p>
          )}
          <p className="muted small">{t('key.stored')}</p>
        </div>
      )}
    </section>
  )
}
