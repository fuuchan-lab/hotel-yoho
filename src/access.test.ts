import assert from 'node:assert/strict'
import { test } from 'node:test'
import { accessOf, TRIAL_DAYS } from './access.ts'

const DAY = 86_400_000
const key = { appId: 'a', accessKey: 'k' }

test('ログインしていなければ推定だけ（キーがあっても）', () => {
  assert.equal(accessOf(false, { rakuten: null, trialStart: null }).mode, 'guest')
  assert.equal(accessOf(false, { rakuten: key, trialStart: 0 }).mode, 'guest')
})

test('ログインして 7 日間はお試し、その後は終了', () => {
  const start = 1_000_000_000_000
  assert.deepEqual(accessOf(true, { rakuten: null, trialStart: null }, start), { mode: 'trial', daysLeft: TRIAL_DAYS })
  assert.deepEqual(accessOf(true, { rakuten: null, trialStart: start }, start + 1000), { mode: 'trial', daysLeft: TRIAL_DAYS })
  assert.deepEqual(accessOf(true, { rakuten: null, trialStart: start }, start + (TRIAL_DAYS - 0.5) * DAY), { mode: 'trial', daysLeft: 1 })
  assert.equal(accessOf(true, { rakuten: null, trialStart: start }, start + TRIAL_DAYS * DAY + 1).mode, 'expired')
})

test('自分のキーを登録すれば、お試しの後も実データ', () => {
  assert.equal(accessOf(true, { rakuten: key, trialStart: 1 }, 100 * DAY).mode, 'own')
})
