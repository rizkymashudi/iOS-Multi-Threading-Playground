import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import LogPanel from '../shared/LogPanel'
import type { LogEntry } from '../../types/simulation'

describe('LogPanel', () => {
  it('renders empty log panel', () => {
    render(<LogPanel id="test" entries={[]} />)
    expect(screen.getByText('Console Output')).toBeInTheDocument()
  })

  it('renders log entries', () => {
    const entries: LogEntry[] = [
      { id: '1', timestamp: '0.0s', thread: 'main', message: 'Hello world', type: 'ok' },
      { id: '2', timestamp: '0.1s', thread: 'bg', message: 'Background task', type: '' },
    ]
    render(<LogPanel id="test" entries={entries} />)
    expect(screen.getByText('Hello world')).toBeInTheDocument()
    expect(screen.getByText('Background task')).toBeInTheDocument()
  })

  it('renders thread labels', () => {
    const entries: LogEntry[] = [
      { id: '1', timestamp: '0.0s', thread: 'main', message: 'test', type: '' },
    ]
    render(<LogPanel id="test" entries={entries} />)
    expect(screen.getByText('[main]')).toBeInTheDocument()
  })

  it('renders clear button when onClear provided', () => {
    const onClear = vi.fn()
    render(<LogPanel id="test" entries={[]} onClear={onClear} />)
    const clearBtn = screen.getByText('Clear')
    fireEvent.click(clearBtn)
    expect(onClear).toHaveBeenCalledOnce()
  })

  it('does not render clear button when onClear not provided', () => {
    render(<LogPanel id="test" entries={[]} />)
    expect(screen.queryByText('Clear')).not.toBeInTheDocument()
  })
})
