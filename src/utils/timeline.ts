import type { TLEvent, TLLane } from '../types/timeline'

export const TL_TOTAL_MS = 3000

/**
 * Groups events by lane, then applies greedy interval sub-row packing
 * so simultaneous events on the same lane don't overlap.
 */
export function packIntoLanes(events: TLEvent[], now: number): TLLane[] {
  const laneOrder: string[] = []
  const laneMap = new Map<string, TLEvent[]>()

  for (const ev of events) {
    if (!laneMap.has(ev.lane)) {
      laneOrder.push(ev.lane)
      laneMap.set(ev.lane, [])
    }
    laneMap.get(ev.lane)!.push(ev)
  }

  return laneOrder.map((name) => {
    const laneEvents = laneMap.get(name)!
    const subRows: TLEvent[][] = []

    for (const ev of laneEvents) {
      let placed = false
      for (const row of subRows) {
        const last = row[row.length - 1]
        const lastEnd = last.endMs != null ? last.endMs : now + 50
        if (ev.startMs >= lastEnd - 10) {
          row.push(ev)
          placed = true
          break
        }
      }
      if (!placed) {
        subRows.push([ev])
      }
    }

    return {
      name,
      subRows: subRows.map((events) => ({ events })),
    }
  })
}

export function buildRulerTicks(totalMs: number, count = 5): number[] {
  const ticks: number[] = []
  for (let i = 1; i <= count; i++) {
    ticks.push(Math.round((totalMs / count) * i))
  }
  return ticks
}
