/**
 * 楽天トラベルの実データ（空室・料金）を、だれのキーで見るか。
 *
 * - guest: ログインしていない。統計からの推定だけ
 * - trial: ログインして最初の TRIAL_DAYS 日間。作者のキーで中継サーバーが集めた、共有のデータを見られる（お試し）
 * - expired: お試しが終わり、自分のキーを登録していない。推定だけ
 * - own: 自分の楽天ウェブサービスのキーを登録した。見ている都市・日付を、自分のキーで端末から楽天に問い合わせる
 *
 * 作者のキー・中継サーバーに利用が集まりすぎないようにして、長く安定して動かすための仕組み。
 * お試しの開始日は prefs.json（利用者の Google ドライブ）に持つので、厳密な制限ではない
 */
import type { Prefs } from './prefs.ts'

export const TRIAL_DAYS = 7
const DAY_MS = 86_400_000

export type AccessMode = 'guest' | 'trial' | 'expired' | 'own'

export interface Access {
  mode: AccessMode
  /** お試しの残りの日数（trial の時） */
  daysLeft: number
}

export function accessOf(loggedIn: boolean, prefs: Pick<Prefs, 'rakuten' | 'trialStart'>, now = Date.now()): Access {
  if (!loggedIn) return { mode: 'guest', daysLeft: 0 }
  if (prefs.rakuten) return { mode: 'own', daysLeft: 0 }
  // ログインした直後（まだ開始日を書いていない）は、お試しの初日として扱う
  if (prefs.trialStart === null) return { mode: 'trial', daysLeft: TRIAL_DAYS }
  const left = Math.ceil((prefs.trialStart + TRIAL_DAYS * DAY_MS - now) / DAY_MS)
  return left > 0 ? { mode: 'trial', daysLeft: Math.min(TRIAL_DAYS, left) } : { mode: 'expired', daysLeft: 0 }
}
