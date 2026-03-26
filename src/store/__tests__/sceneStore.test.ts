import { describe, it, expect, beforeEach } from 'vitest'
import { useSceneStore } from '../sceneStore'

describe('sceneStore', () => {
  beforeEach(() => {
    useSceneStore.setState({ activeSceneId: 'gcd', sidebarCollapsed: false })
  })

  it('has gcd as default active scene', () => {
    expect(useSceneStore.getState().activeSceneId).toBe('gcd')
  })

  it('setScene updates activeSceneId', () => {
    useSceneStore.getState().setScene('deadlock')
    expect(useSceneStore.getState().activeSceneId).toBe('deadlock')
  })

  it('toggleSidebar flips sidebarCollapsed', () => {
    expect(useSceneStore.getState().sidebarCollapsed).toBe(false)
    useSceneStore.getState().toggleSidebar()
    expect(useSceneStore.getState().sidebarCollapsed).toBe(true)
    useSceneStore.getState().toggleSidebar()
    expect(useSceneStore.getState().sidebarCollapsed).toBe(false)
  })
})
