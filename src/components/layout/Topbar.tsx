import { useSceneStore } from '../../store/sceneStore'
import { useSpeedStore } from '../../store/speedStore'
import { useThemeStore } from '../../store/themeStore'
import { SCENES } from '../../constants/scenes'

export default function Topbar() {
  const activeSceneId = useSceneStore((s) => s.activeSceneId)
  const sidebarCollapsed = useSceneStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useSceneStore((s) => s.toggleSidebar)
  const speed = useSpeedStore((s) => s.speed)
  const setSpeed = useSpeedStore((s) => s.setSpeed)
  const isDark = useThemeStore((s) => s.isDark)
  const toggleTheme = useThemeStore((s) => s.toggle)

  const scene = SCENES[activeSceneId]

  return (
    <div className="topbar">
      <button
        className={`expand-btn${sidebarCollapsed ? ' visible' : ''}`}
        onClick={toggleSidebar}
        title="Expand sidebar"
      >
        &#x276F;
      </button>
      <div className="scene-title">{scene.title}</div>
      <span
        className="scene-badge"
        style={{
          background: `color-mix(in srgb, ${scene.accentColor} 15%, transparent)`,
          color: scene.accentColor,
        }}
      >
        {scene.badge}
      </span>
      <div className="speed-control" title="Simulation speed">
        <span>&#x23E9;</span>
        <span style={{ color: 'var(--text3)' }}>Speed</span>
        <input
          type="range"
          min="0.25"
          max="4"
          step="0.25"
          value={speed}
          onChange={(e) => setSpeed(parseFloat(e.target.value))}
        />
        <span className="speed-val">{speed}&times;</span>
      </div>
      <button className="theme-toggle" onClick={toggleTheme} title="Toggle light/dark mode">
        <span className="theme-icon">{isDark ? '\u2600' : '\u263D'}</span>
        <span>{isDark ? 'Light' : 'Dark'}</span>
      </button>
    </div>
  )
}
