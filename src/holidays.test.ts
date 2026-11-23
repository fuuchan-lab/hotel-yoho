import assert from 'node:assert/strict'
import { test } from 'node:test'
import { holidayName, isDayOff, isHoliday } from './holidays.ts'

test('2026 年の祝日（内閣府の発表と同じ）', () => {
  const expected = [
    '2026-01-01', '2026-01-12', '2026-02-11', '2026-02-23', '2026-03-20', '2026-04-29', '2026-05-03', '2026-05-04',
    '2026-05-05', '2026-05-06', '2026-07-20', '2026-08-11', '2026-09-21', '2026-09-22', '2026-09-23', '2026-10-12',
    '2026-11-03', '2026-11-23',
  ]
  for (const d of expected) assert.ok(isHoliday(d), d)
  assert.equal(holidayName('2026-05-06')?.ja, '振替休日')
  assert.equal(holidayName('2026-09-22')?.ja, '国民の休日')
  assert.equal(isHoliday('2026-05-07'), false)
})

test('2027 年の祝日', () => {
  for (const d of ['2027-01-01', '2027-01-11', '2027-02-11', '2027-02-23', '2027-03-21', '2027-03-22', '2027-07-19', '2027-09-20', '2027-09-23', '2027-10-11']) {
    assert.ok(isHoliday(d), d)
  }
  assert.equal(holidayName('2027-03-22')?.ja, '振替休日')
})

test('土日と祝日は休み', () => {
  assert.equal(isDayOff('2026-11-28'), true) // 土
  assert.equal(isDayOff('2026-11-29'), true) // 日
  assert.equal(isDayOff('2026-11-30'), false) // 月
  assert.equal(isDayOff('2026-11-23'), true) // 勤労感謝の日（月）
})
