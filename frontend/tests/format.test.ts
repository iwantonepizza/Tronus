import { describe, expect, it } from 'vitest'
import { formatPlayerRange } from '@/lib/format'

describe('formatPlayerRange', () => {
  it('returns a single number when min and max are equal', () => {
    expect(formatPlayerRange(4, 4)).toBe('4')
  })

  it('returns a range when min and max differ', () => {
    expect(formatPlayerRange(3, 6)).toBe('3-6')
  })
})
