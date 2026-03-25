export type SceneId =
  | 'gcd'
  | 'mainthread'
  | 'qos'
  | 'deadlock'
  | 'race'
  | 'explosion'
  | 'barrier'
  | 'actor'
  | 'serial'
  | 'asyncawait'
  | 'combine'
  | 'reentrancy'
  | 'dispatchgroup'
  | 'semaphore'
  | 'taskgroup'
  | 'taskcancellation'
  | 'locks'
  | 'atomic'
  | 'sendable'
  | 'priorityinversion'

export type NavSection =
  | 'Fundamentals'
  | 'Pitfalls'
  | 'Synchronization'
  | 'Modern Swift'
  | 'Coordination'
  | 'Safety & Tools'

export interface SceneMeta {
  id: SceneId
  title: string
  badge: string
  section: NavSection
  accentColor: string
}
