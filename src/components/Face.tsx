import { faceSvg } from '../face.ts'
import type { Mood } from '../forecast.ts'

interface Props {
  mood: Mood
  size?: number
  estimate?: boolean
  label?: string
}

/** 予報の顔。SVG は face.ts の固定の部品だけで作る（利用者の入力は入らない） */
export function Face({ mood, size = 36, estimate = false, label = '' }: Props) {
  return <span className="face-wrap" dangerouslySetInnerHTML={{ __html: faceSvg(mood, size, estimate, label) }} />
}
