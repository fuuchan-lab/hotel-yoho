import { useCallback, useEffect, useRef, useState } from 'react'
import { describeError } from '../errors.ts'
import { downloadText, listFolderFiles, uploadFile } from '../drive.ts'
import { loadLocalPrefs, newerPrefs, normalizePrefs, PREFS_FILE, saveLocalPrefs, type Prefs } from '../prefs.ts'
import type { DriveAccount } from './useGoogleAuth.ts'

export type PrefsSyncStatus = 'local' | 'syncing' | 'synced' | 'error'

/**
 * 設定・予定。変えたらすぐ端末に保存し、ログイン中は少し待ってから Google ドライブにも保存する。
 * ログインした時は、ドライブのほうが新しければそれに置き換える
 */
export function usePrefs(account: DriveAccount | null) {
  const [prefs, setPrefs] = useState<Prefs>(loadLocalPrefs)
  const [status, setStatus] = useState<PrefsSyncStatus>('local')
  const [error, setError] = useState<string | null>(null)
  const fileId = useRef<string | null>(null)
  const ready = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const latest = useRef(prefs)
  useEffect(() => {
    latest.current = prefs
  })

  const upload = useCallback(async (folderId: string, next: Prefs) => {
    setStatus('syncing')
    try {
      const res = await uploadFile({
        id: fileId.current ?? undefined,
        name: PREFS_FILE,
        mimeType: 'application/json',
        blob: new Blob([JSON.stringify(next, null, 2)], { type: 'application/json' }),
        parentId: folderId,
      })
      fileId.current = res.id
      setStatus('synced')
      setError(null)
    } catch (e) {
      console.error('[prefs-upload]', e)
      setStatus('error')
      setError(describeError(e))
    }
  }, [])

  // ログインしたら、ドライブの prefs.json と比べて新しいほうにそろえる
  useEffect(() => {
    ready.current = false
    fileId.current = null
    if (!account) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus('local')
      return
    }
    let cancelled = false
    setStatus('syncing')
    void (async () => {
      try {
        const files = await listFolderFiles(account.folderId)
        const file = files.find((f) => f.name === PREFS_FILE)
        fileId.current = file?.id ?? null
        const local = latest.current
        const remote = file ? normalizePrefs(JSON.parse(await downloadText(file.id))) : null
        if (cancelled) return
        ready.current = true
        if (remote && newerPrefs(local, remote) === remote) {
          setPrefs(remote)
          saveLocalPrefs(remote)
          setStatus('synced')
        } else if (!remote || local.updatedAt > remote.updatedAt) {
          await upload(account.folderId, local)
        } else {
          setStatus('synced')
        }
      } catch (e) {
        if (cancelled) return
        console.error('[prefs-sync]', e)
        ready.current = true
        setStatus('error')
        setError(describeError(e))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [account, upload])

  const update = useCallback(
    (change: (cur: Prefs) => Prefs) => {
      setPrefs((cur) => {
        const next = { ...change(cur), updatedAt: Date.now() }
        saveLocalPrefs(next)
        if (account && ready.current) {
          clearTimeout(timer.current)
          timer.current = setTimeout(() => void upload(account.folderId, latest.current), 1500)
        }
        return next
      })
    },
    [account, upload],
  )

  useEffect(() => () => clearTimeout(timer.current), [])

  return { prefs, update, status, error }
}

export type PrefsState = ReturnType<typeof usePrefs>
