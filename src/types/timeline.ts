export interface TLEvent {
  lane: string
  label: string
  color: string
  dimColor: string
  startMs: number
  endMs: number | null
}

export interface SubRow {
  events: TLEvent[]
}

export interface TLLane {
  name: string
  subRows: SubRow[]
}
