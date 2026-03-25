import { describe, it, expect } from 'vitest'
import { buildRulerTicks } from '../timeline'

describe('buildRulerTicks', () => {
  it('returns correct number of ticks', () => {
    const ticks = buildRulerTicks(1000, 5)
    expect(ticks).toHaveLength(5)
    expect(ticks).toEqual([200, 400, 600, 800, 1000])
  })
})
