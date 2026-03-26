import { describe, it, expect } from 'vitest'
import { buildRulerTicks, packIntoLanes } from '../timeline'
import type { TLEvent } from '../../types/timeline'

describe('buildRulerTicks', () => {
  it('returns correct number of ticks', () => {
    const ticks = buildRulerTicks(1000, 5)
    expect(ticks).toHaveLength(5)
    expect(ticks).toEqual([200, 400, 600, 800, 1000])
  })

  it('defaults to 5 ticks', () => {
    const ticks = buildRulerTicks(3000)
    expect(ticks).toHaveLength(5)
    expect(ticks[4]).toBe(3000)
  })
})

describe('packIntoLanes', () => {
  it('groups events by lane preserving order', () => {
    const events: TLEvent[] = [
      { lane: 'A', label: 'a1', color: 'red', dimColor: 'dim', startMs: 0, endMs: 100 },
      { lane: 'B', label: 'b1', color: 'blue', dimColor: 'dim', startMs: 0, endMs: 200 },
      { lane: 'A', label: 'a2', color: 'red', dimColor: 'dim', startMs: 150, endMs: 300 },
    ]
    const lanes = packIntoLanes(events, 300)
    expect(lanes).toHaveLength(2)
    expect(lanes[0].name).toBe('A')
    expect(lanes[1].name).toBe('B')
  })

  it('packs non-overlapping events into same sub-row', () => {
    const events: TLEvent[] = [
      { lane: 'A', label: 'e1', color: 'c', dimColor: 'd', startMs: 0, endMs: 100 },
      { lane: 'A', label: 'e2', color: 'c', dimColor: 'd', startMs: 200, endMs: 300 },
    ]
    const lanes = packIntoLanes(events, 300)
    expect(lanes[0].subRows).toHaveLength(1)
    expect(lanes[0].subRows[0].events).toHaveLength(2)
  })

  it('splits overlapping events into separate sub-rows', () => {
    const events: TLEvent[] = [
      { lane: 'A', label: 'e1', color: 'c', dimColor: 'd', startMs: 0, endMs: 200 },
      { lane: 'A', label: 'e2', color: 'c', dimColor: 'd', startMs: 50, endMs: 250 },
    ]
    const lanes = packIntoLanes(events, 300)
    expect(lanes[0].subRows).toHaveLength(2)
  })

  it('returns empty array for no events', () => {
    const lanes = packIntoLanes([], 0)
    expect(lanes).toHaveLength(0)
  })
})
