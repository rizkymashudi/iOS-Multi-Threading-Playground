import type { TLEvent } from '../types/timeline'

export function packLaneEvents(events: TLEvent[], _now: number): TLEvent[] {
  return events.filter((e) => e.startMs <= _now)
}

export function buildRulerTicks(totalMs: number, count = 5): number[] {
  const ticks: number[] = []
  for (let i = 1; i <= count; i++) {
    ticks.push(Math.round((totalMs / count) * i))
  }
  return ticks
}
