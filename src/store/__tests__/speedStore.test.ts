import { describe, it, expect, beforeEach } from 'vitest'
import { useSpeedStore } from '../speedStore'

describe('speedStore', () => {
  beforeEach(() => {
    useSpeedStore.setState({ speed: 1 })
  })

  it('defaults to speed 1', () => {
    expect(useSpeedStore.getState().speed).toBe(1)
  })

  it('setSpeed updates speed value', () => {
    useSpeedStore.getState().setSpeed(2)
    expect(useSpeedStore.getState().speed).toBe(2)
  })

  it('scaled returns original ms at 1x', () => {
    expect(useSpeedStore.getState().scaled(1000)).toBe(1000)
  })

  it('scaled halves delay at 2x', () => {
    useSpeedStore.getState().setSpeed(2)
    expect(useSpeedStore.getState().scaled(1000)).toBe(500)
  })

  it('scaled doubles delay at 0.5x', () => {
    useSpeedStore.getState().setSpeed(0.5)
    expect(useSpeedStore.getState().scaled(1000)).toBe(2000)
  })

  it('scaled rounds to nearest integer', () => {
    useSpeedStore.getState().setSpeed(3)
    expect(useSpeedStore.getState().scaled(1000)).toBe(333)
  })
})
