// アプリ（src/ownData.ts）から、同じ読み取りの処理を使うための型
export interface RakutenEnv {
  RAKUTEN_APP_ID: string
  RAKUTEN_ACCESS_KEY?: string
  RAKUTEN_ENDPOINT?: string
  RAKUTEN_VERSION?: string
  RAKUTEN_REFERER?: string
}

export interface VacantObs {
  v: number
  n: number
  lo: number | null
  q1: number | null
  p: number | null
  q3: number | null
  hi: number | null
  h: { n: string; c: number }[]
}

export type VacantResult = { obs: VacantObs; retryLater?: undefined; error?: undefined } | { obs?: undefined; retryLater: true; error: string } | { obs?: undefined; retryLater?: undefined; error: string }

export function vacantUrl(env: RakutenEnv, city: { lat: number; lng: number }, checkin: string, checkout: string): string
export function parseVacant(json: unknown): VacantObs
export function searchVacant(
  env: RakutenEnv,
  city: { lat: number; lng: number },
  checkin: string,
  checkout: string,
  fetchImpl?: typeof fetch,
): Promise<VacantResult>
