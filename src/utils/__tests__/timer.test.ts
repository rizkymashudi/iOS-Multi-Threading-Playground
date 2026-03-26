import { describe, it, expect } from 'vitest'
import { scaledDelay } from '../timer'

describe('scaledDelay', () => {
  it('returns original ms at 1x speed', () => {
    expect(scaledDelay(1000, 1)).toBe(1000)
  })

  it('halves delay at 2x speed', () => {
    expect(scaledDelay(1000, 2)).toBe(500)
  })

  it('doubles delay at 0.5x speed', () => {
    expect(scaledDelay(1000, 0.5)).toBe(2000)
  })

  it('rounds to nearest integer', () => {
    expect(scaledDelay(1000, 3)).toBe(333)
  })
})
