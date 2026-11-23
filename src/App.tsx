import { useCallback, useEffect, useMemo, useState } from 'react'
import type { CityId } from './cities.ts'
import { addDays, HORIZON_DAYS, todayJst, type Ymd } from './dates.ts'
import { BottomDock, type Tab } from './components/BottomDock.tsx'
import { CalendarPage } from './components/CalendarPage.tsx'
import { CitySheet } from './components/CitySheet.tsx'
import { DocFrame } from './components/DocFrame.tsx'
import { EventsPage } from './components/EventsPage.tsx'
import { Header } from './components/Header.tsx'
import { MapPage } from './components/MapPage.tsx'
import { SettingsPage } from './components/SettingsPage.tsx'
import { WatchPage, type WatchDraft } from './components/WatchPage.tsx'
import { useForecastData } from './hooks/useForecastData.ts'
import { useGoogleAuth } from './hooks/useGoogleAuth.ts'
import { usePrefs } from './hooks/usePrefs.ts'
import { loadTheme, type ThemePreference } from './theme.ts'
import { needsAttention } from './watch.ts'

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
  const auth = useGoogleAuth()
  const prefs = usePrefs(auth.account)
  const data = useForecastData()
  const today = useToday()
  const [tab, setTab] = useState<Tab>('map')
  const [date, setDate] = useState<Ymd>(today)
  const [sheetCity, setSheetCity] = useState<CityId | null>(null)
  const [calCity, setCalCity] = useState<CityId>(prefs.prefs.homeCity ?? 'tokyo')
  const [calDate, setCalDate] = useState<Ymd>(today)
  const [draft, setDraft] = useState<WatchDraft | null>(null)
  const [theme, setTheme] = useState<ThemePreference>(loadTheme)
  const [doc, setDoc] = useState<{ page: 'help' | 'privacy'; hash?: string } | null>(null)

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

  const watchAlert = useMemo(() => needsAttention(prefs.prefs, today, data.forecast), [prefs.prefs, data, today])

  return (
    <div className="app">
      <Header auth={auth} syncing={prefs.status === 'syncing'} onAccount={() => openTab('settings')} />

      {tab === 'map' && (
        <MapPage data={data} today={today} date={shownDate} onDate={setDate} onCity={setSheetCity} prefs={prefs.prefs} />
      )}
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
          theme={theme}
          onTheme={setTheme}
          onDoc={(page, hash) => setDoc({ page, hash })}
        />
      )}

      {sheetCity && (
        <CitySheet
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
