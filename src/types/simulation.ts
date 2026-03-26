export type LogType = 'ok' | 'warn' | 'error' | ''

export interface LogEntry {
  id: string
  timestamp: string
  thread: string
  message: string
  type: LogType
  color?: string
}

export interface TaskBlockProps {
  label: string
  color: string
  dimColor: string
  borderColor: string
  running?: boolean
  faded?: boolean
}

export interface StatusPillProps {
  text: string
  bgColor: string
  color: string
}
