import { describe, expect, it } from 'vitest'
import {
  readLastCreateSelection,
  roundDateUpToFiveMinutes,
  toDateTimeLocalValue,
  writeLastCreateSelection,
  LAST_CREATE_STORAGE_KEY,
} from '@/lib/session-planner'

describe('session planner helpers', () => {
  it('rounds dates up to the next 5-minute slot', () => {
    const rounded = roundDateUpToFiveMinutes(
      new Date('2026-05-01T13:02:15.000Z'),
    )

    expect(rounded.toISOString()).toBe('2026-05-01T13:05:00.000Z')
  })

  it('keeps already rounded values intact', () => {
    const rounded = roundDateUpToFiveMinutes(
      new Date('2026-05-01T13:10:00.000Z'),
    )

    expect(rounded.toISOString()).toBe('2026-05-01T13:10:00.000Z')
  })

  it('formats an ISO timestamp for datetime-local input', () => {
    expect(toDateTimeLocalValue('2026-05-01T13:05:00.000Z')).toMatch(
      /^2026-05-01T\d{2}:05$/,
    )
  })

  it('writes and reads last create selection from localStorage', () => {
    window.localStorage.removeItem(LAST_CREATE_STORAGE_KEY)

    writeLastCreateSelection({
      modeSlug: 'dance_with_dragons',
      deckSlug: 'alternative',
    })

    expect(readLastCreateSelection()).toEqual({
      modeSlug: 'dance_with_dragons',
      deckSlug: 'alternative',
    })
  })
})
