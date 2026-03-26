import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Timeline from '../shared/Timeline'
import type { TLEvent } from '../../types/timeline'

describe('Timeline', () => {
  it('renders empty state when no events', () => {
    render(<Timeline sceneId="test" events={[]} elapsedMs={0} />)
    expect(screen.getByText('Run a simulation to see the timeline')).toBeInTheDocument()
  })

  it('renders lanes for events', () => {
    const events: TLEvent[] = [
      { lane: 'Serial Q', label: 'task-1', color: 'red', dimColor: 'dim', startMs: 0, endMs: 500 },
      {
        lane: 'Concurrent Q',
        label: 'task-2',
        color: 'blue',
        dimColor: 'dim',
        startMs: 0,
        endMs: 300,
      },
    ]
    render(<Timeline sceneId="test" events={events} elapsedMs={600} totalMs={1000} />)
    expect(screen.getByTitle('Serial Q')).toBeInTheDocument()
    expect(screen.getByTitle('Concurrent Q')).toBeInTheDocument()
  })

  it('renders playhead with elapsed time', () => {
    const events: TLEvent[] = [
      { lane: 'A', label: 'a1', color: 'c', dimColor: 'd', startMs: 0, endMs: 100 },
    ]
    render(<Timeline sceneId="test" events={events} elapsedMs={500} totalMs={1000} />)
    expect(screen.getByText('500 ms')).toBeInTheDocument()
  })

  it('renders event blocks with tooltip', () => {
    const events: TLEvent[] = [
      { lane: 'A', label: 'myTask', color: 'c', dimColor: 'd', startMs: 100, endMs: 400 },
    ]
    render(<Timeline sceneId="test" events={events} elapsedMs={500} totalMs={1000} />)
    expect(screen.getByTitle('myTask (100–400ms)')).toBeInTheDocument()
  })
})
