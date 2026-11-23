/**
 * 予報の顔（SVG の文字列）。地図のマーカー（Leaflet の divIcon）と画面の両方で使うため、文字列で作る。
 * 0 = 満面の笑顔（緑）… 4 = 困った顔（赤・汗）。推定の日は、縁を点線にする
 */
import type { Mood } from './forecast.ts'

export const MOOD_COLORS: Record<Mood, string> = {
  0: '#22c55e',
  1: '#a3d93b',
  2: '#facc15',
  3: '#fb923c',
  4: '#ef4444',
}

const INK = '#3b2a1a'

const PARTS: Record<Mood, string> = {
  // 満面の笑顔: 目は ^ ^、口は大きく開ける
  0: `<path d="M11 17.5q3-4.5 6 0M23 17.5q3-4.5 6 0" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M10.5 22.5h19q-1 9-9.5 9t-9.5-9z" fill="${INK}"/>
      <path d="M15 28.6q5 3.6 10 0q-2 2.6-5 2.6t-5-2.6z" fill="#f87171"/>
      <circle cx="9" cy="23" r="2.4" fill="#fff" opacity=".35"/><circle cx="31" cy="23" r="2.4" fill="#fff" opacity=".35"/>`,
  // 笑顔
  1: `<circle cx="14" cy="16.5" r="2.3" fill="${INK}"/><circle cx="26" cy="16.5" r="2.3" fill="${INK}"/>
      <path d="M12.5 24q7.5 7 15 0" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>`,
  // ふつう
  2: `<circle cx="14" cy="16.5" r="2.3" fill="${INK}"/><circle cx="26" cy="16.5" r="2.3" fill="${INK}"/>
      <path d="M13.5 26.5h13" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>`,
  // 心配: 眉を下げ、口を少し曲げる
  3: `<path d="M10.5 12.5l6 1.8M29.5 12.5l-6 1.8" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/>
      <circle cx="14" cy="18" r="2.2" fill="${INK}"/><circle cx="26" cy="18" r="2.2" fill="${INK}"/>
      <path d="M13.5 28.5q6.5-4.6 13 0" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>`,
  // 困った顔: 困り眉・ぎゅっと閉じた目・波の口・汗
  4: `<path d="M10 14.5l6.5-3.2M30 14.5l-6.5-3.2" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M11 18.5l5 1.6-5 1.6M29 18.5l-5 1.6 5 1.6" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M12.5 28.5q1.9-2.4 3.8 0t3.7 0 3.7 0 3.8 0" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M33.2 6.5q3.3 4.6 0 6.4q-3.3-1.8 0-6.4z" fill="#60a5fa" stroke="#fff" stroke-width="1"/>`,
}

export function faceSvg(mood: Mood, size = 36, estimate = false, title = ''): string {
  const ring = estimate
    ? `<circle cx="20" cy="20" r="17.6" fill="${MOOD_COLORS[mood]}" stroke="#fff" stroke-width="2.4" stroke-dasharray="4.2 3"/>`
    : `<circle cx="20" cy="20" r="17.6" fill="${MOOD_COLORS[mood]}" stroke="#fff" stroke-width="2.4"/>`
  const label = title ? `<title>${title.replace(/[<&>"]/g, '')}</title>` : ''
  return `<svg class="face" width="${size}" height="${size}" viewBox="0 0 40 40" role="img" aria-label="${title.replace(/[<&>"]/g, '')}">${label}${ring}${PARTS[mood]}</svg>`
}
