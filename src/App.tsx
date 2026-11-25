import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { accessOf } from './access.ts'
import type { CityId } from './cities.ts'
import { addDays, HORIZON_DAYS, todayJst, type Ymd } from './dates.ts'
import { AdBanner } from './components/AdBanner.tsx'
import { BottomDock, type Tab } from './components/BottomDock.tsx'
import { CitySheet } from './components/CitySheet.tsx'
import { DocFrame } from './components/DocFrame.tsx'
import { Header } from './components/Header.tsx'
import { MapPage } from './components/MapPage.tsx'
import type { WatchDraft } from './components/WatchPage.tsx'
import { useForecastData } from './hooks/useForecastData.ts'
import { useGoogleAuth } from './hooks/useGoogleAuth.ts'
import { usePrefs } from './hooks/usePrefs.ts'
import { useI18n } from './i18n/useI18n.ts'
import type { Lang } from './i18n/context.ts'
import { applyTheme, loadTheme, saveTheme, type ThemePreference } from './theme.ts'
import { needsAttention } from './watch.ts'

// 最初に開く予報地図のほかの画面は、開いた時に読み込む（起動を速くするため。オフライン用には PWA が先に保存しておく）
const CalendarPage = lazy(() => import('./components/CalendarPage.tsx').then((m) => ({ default: m.CalendarPage })))
const EventsPage = lazy(() => import('./components/EventsPage.tsx').then((m) => ({ default: m.EventsPage })))
const WatchPage = lazy(() => import('./components/WatchPage.tsx').then((m) => ({ default: m.WatchPage })))
const SettingsPage = lazy(() => import('./components/SettingsPage.tsx').then((m) => ({ default: m.SettingsPage })))

/** 日付が変わったら（開いたまま日をまたいだ時）、今日を更新する */
function useToday(): Ymd {
  const [today, setToday] = useState(() => todayJst())
  useEffect(() => {
    const id = setInterval(() => setToday(todayJst()), 60_000)
    return () => clearInterval(id)
  }, [])
  return today
}

export default function App() {
  const today = useToday()
  const auth = useGoogleAuth()
  const prefs = usePrefs(auth.account)
  // 楽天トラベルの実データを、だれのキーで見るか（お試し・自分のキー・推定だけ）
  const loggedIn = auth.account !== null
  const { rakuten, trialStart } = prefs.prefs
  const access = useMemo(() => accessOf(loggedIn, { rakuten, trialStart }, Date.parse(`${today}T00:00:00+09:00`) + 86_399_000), [loggedIn, rakuten, trialStart, today])
  const data = useForecastData(access, loggedIn ? rakuten : null)
  // 初めてログインした時に、お試しの開始日を入れる（ドライブと合わせ終わってから。先に書くと、ドライブの設定を上書きしてしまう）
  const { status: syncStatus, update: updatePrefs } = prefs
  useEffect(() => {
    if (loggedIn && syncStatus === 'synced' && trialStart === null) updatePrefs((p) => (p.trialStart === null ? { ...p, trialStart: Date.now() } : p))
  }, [loggedIn, syncStatus, trialStart, updatePrefs])
  const [tab, setTab] = useState<Tab>('map')
  const [date, setDate] = useState<Ymd>(today)
  const [sheetCity, setSheetCity] = useState<CityId | null>(null)
  /** 予報地図の日付の帯に出す都市（null = 全国平均） */
  const [stripCity, setStripCity] = useState<CityId | null>(null)
  const [calCity, setCalCity] = useState<CityId>(prefs.prefs.homeCity ?? 'tokyo')
  const [calDate, setCalDate] = useState<Ymd>(today)
  const [draft, setDraft] = useState<WatchDraft | null>(null)
  const [theme, setTheme] = useState<ThemePreference>(loadTheme)
  const [doc, setDoc] = useState<{ page: 'help' | 'privacy'; hash?: string } | null>(null)
  const { lang, setLang } = useI18n()

  // 言語・配色は、ほかのアプリと同じく Google ドライブの prefs.json にも残し、同じアカウントの端末で共通にする。
  // ほかの端末で変えたもの（ログイン時・同期で届いたもの）を、この端末に反映する
  const remoteLang = prefs.prefs.lang
  const remoteTheme = prefs.prefs.theme
  useEffect(() => {
    if (remoteLang && remoteLang !== lang) setLang(remoteLang)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remoteLang])
  useEffect(() => {
    if (prefs.prefs.updatedAt === 0) return
    saveTheme(remoteTheme)
    applyTheme(remoteTheme)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(remoteTheme)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remoteTheme])

  const chooseLang = useCallback(
    (l: Lang) => {
      setLang(l)
      prefs.update((p) => ({ ...p, lang: l }))
    },
    [setLang, prefs],
  )
  const chooseTheme = useCallback(
    (v: ThemePreference) => {
      saveTheme(v)
      applyTheme(v)
      setTheme(v)
      prefs.update((p) => ({ ...p, theme: v }))
    },
    [prefs],
  )

  // 選んだ日が過去になったら今日に戻す
  const shownDate = date < today ? today : date > addDays(today, HORIZON_DAYS - 1) ? today : date

  const openTab = useCallback((next: Tab) => {
    setTab(next)
    window.scrollTo({ top: 0 })
  }, [])

  const addTrip = useCallback(
    (city: CityId, checkin: Ymd) => {
      setSheetCity(null)
      setDraft({ city, checkin })
      openTab('watch')
    },
    [openTab],
  )

  /** 左上のアイコン: ホーム（予報地図・今日・全国平均）に戻る */
  const goHome = useCallback(() => {
    setSheetCity(null)
    setDoc(null)
    setStripCity(null)
    setDate(today)
    openTab('map')
  }, [today, openTab])

  const watchAlert = useMemo(() => needsAttention(prefs.prefs, today, data.forecast), [prefs.prefs, data, today])

  return (
    <div className="app">
      <Header auth={auth} syncing={prefs.status === 'syncing'} onAccount={() => openTab('settings')} onHome={goHome} />

      {tab === 'map' && (
        <MapPage
          data={data}
          today={today}
          date={shownDate}
          onDate={setDate}
          onCity={(id) => {
            // 地図・一覧で都市を押したら、日付の帯もその都市の予報にする
            setStripCity(id)
            setSheetCity(id)
          }}
          prefs={prefs.prefs}
          access={access}
          onSettings={() => openTab('settings')}
          stripCity={stripCity}
          onStripCity={setStripCity}
        />
      )}
      <Suspense fallback={<div className="page" />}>
      {tab === 'calendar' && (
        <CalendarPage
          data={data}
          prefs={prefs}
          today={today}
          city={calCity}
          onCity={setCalCity}
          selected={calDate < today ? today : calDate}
          onSelect={setCalDate}
          onAddTrip={addTrip}
        />
      )}
      {tab === 'events' && (
        <EventsPage
          data={data}
          prefs={prefs}
          today={today}
          onOpen={(city, d) => {
            setDate(d)
            setSheetCity(city)
          }}
        />
      )}
      {tab === 'watch' && (
        <WatchPage
          data={data}
          prefs={prefs}
          account={auth.account}
          today={today}
          draft={draft}
          onDraftUsed={() => setDraft(null)}
          onLogin={() => void auth.login()}
          onCity={(city, d) => {
            setDate(d)
            setSheetCity(city)
          }}
        />
      )}
      {tab === 'settings' && (
        <SettingsPage
          auth={auth}
          prefs={prefs}
          data={data}
          access={access}
          theme={theme}
          onTheme={chooseTheme}
          onLang={chooseLang}
          onDoc={(page, hash) => setDoc({ page, hash })}
        />
      )}
      </Suspense>
      <AdBanner />

      {sheetCity && (
        <CitySheet
          key={`${sheetCity}|${date}`}
          cityId={sheetCity}
          start={date < today ? today : date}
          data={data}
          prefs={prefs}
          onClose={() => setSheetCity(null)}
          onCalendar={(id) => {
            setSheetCity(null)
            setCalCity(id)
            setCalDate(date < today ? today : date)
            openTab('calendar')
          }}
          onAddTrip={addTrip}
        />
      )}
      {doc && <DocFrame page={doc.page} hash={doc.hash} onClose={() => setDoc(null)} />}

      <BottomDock tab={tab} onTab={openTab} watchAlert={watchAlert} />
    </div>
  )
}
