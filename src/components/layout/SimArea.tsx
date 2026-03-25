import { Suspense, lazy } from 'react'
import type { SceneId } from '../../types/scene'
import { useSceneStore } from '../../store/sceneStore'

const SCENE_REGISTRY: Record<SceneId, React.LazyExoticComponent<React.ComponentType>> = {
  gcd: lazy(() => import('../scenes/fundamentals/GCDScene')),
  mainthread: lazy(() => import('../scenes/fundamentals/MainThreadScene')),
  qos: lazy(() => import('../scenes/fundamentals/QoSScene')),
  deadlock: lazy(() => import('../scenes/pitfalls/DeadlockScene')),
  race: lazy(() => import('../scenes/pitfalls/DataRaceScene')),
  explosion: lazy(() => import('../scenes/pitfalls/ThreadExplosionScene')),
  barrier: lazy(() => import('../scenes/synchronization/DispatchBarrierScene')),
  actor: lazy(() => import('../scenes/synchronization/SwiftActorsScene')),
  serial: lazy(() => import('../scenes/synchronization/SerialIsolationScene')),
  asyncawait: lazy(() => import('../scenes/modern-swift/AsyncAwaitScene')),
  combine: lazy(() => import('../scenes/modern-swift/CombineSchedulerScene')),
  reentrancy: lazy(() => import('../scenes/modern-swift/ActorReentrancyScene')),
  dispatchgroup: lazy(() => import('../scenes/coordination/DispatchGroupScene')),
  semaphore: lazy(() => import('../scenes/coordination/DispatchSemaphoreScene')),
  taskgroup: lazy(() => import('../scenes/coordination/TaskGroupScene')),
  taskcancellation: lazy(() => import('../scenes/coordination/TaskCancellationScene')),
  locks: lazy(() => import('../scenes/safety/LocksScene')),
  atomic: lazy(() => import('../scenes/safety/AtomicPropertyScene')),
  sendable: lazy(() => import('../scenes/safety/SendableScene')),
  priorityinversion: lazy(() => import('../scenes/safety/PriorityInversionScene')),
}

export default function SimArea() {
  const activeSceneId = useSceneStore((s) => s.activeSceneId)
  const SceneComponent = SCENE_REGISTRY[activeSceneId]

  return (
    <div className="sim-area">
      <Suspense fallback={null}>
        <SceneComponent />
      </Suspense>
    </div>
  )
}
