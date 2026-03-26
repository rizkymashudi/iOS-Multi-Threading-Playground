import { create } from 'zustand'
import type { SceneId } from '../types/scene'

interface SceneStore {
  activeSceneId: SceneId
  setScene: (id: SceneId) => void
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  codePanelOpen: boolean
  toggleCodePanel: () => void
}

export const useSceneStore = create<SceneStore>((set) => ({
  activeSceneId: 'gcd',
  setScene: (id) => set({ activeSceneId: id }),
  sidebarCollapsed: typeof window !== 'undefined' && window.innerWidth < 768,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  codePanelOpen: false,
  toggleCodePanel: () => set((s) => ({ codePanelOpen: !s.codePanelOpen })),
}))
