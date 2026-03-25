import { create } from 'zustand'
import type { SceneId } from '../types/scene'

interface SceneStore {
  activeSceneId: SceneId
  setScene: (id: SceneId) => void
  sidebarCollapsed: boolean
  toggleSidebar: () => void
}

export const useSceneStore = create<SceneStore>((set) => ({
  activeSceneId: 'gcd',
  setScene: (id) => set({ activeSceneId: id }),
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
}))
