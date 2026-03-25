import { create } from 'zustand'

interface SpeedStore {
  speed: number
  setSpeed: (v: number) => void
  scaled: (ms: number) => number
}

export const useSpeedStore = create<SpeedStore>((set, get) => ({
  speed: 1,
  setSpeed: (v) => set({ speed: v }),
  scaled: (ms) => Math.round(ms / get().speed),
}))
