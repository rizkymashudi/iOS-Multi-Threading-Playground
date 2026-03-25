import { useSceneStore } from '../../store/sceneStore'
import { SCENES, NAV_SECTIONS } from '../../constants/scenes'

export default function Sidebar() {
  const collapsed = useSceneStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useSceneStore((s) => s.toggleSidebar)
  const activeSceneId = useSceneStore((s) => s.activeSceneId)
  const setScene = useSceneStore((s) => s.setScene)

  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
      <div className="sidebar-inner">
        <div className="sidebar-header">
          <div>
            <div className="sidebar-logo">iOS Dev</div>
            <div className="sidebar-logo-sub">
              Threading
              <br />
              Playground
            </div>
          </div>
          <button className="sidebar-toggle" onClick={toggleSidebar} title="Collapse sidebar">
            &#x276E;
          </button>
        </div>
        <nav className="nav">
          {NAV_SECTIONS.map(({ section, sceneIds }) => (
            <div key={section}>
              <div className="nav-section">{section}</div>
              {sceneIds.map((id) => {
                const scene = SCENES[id]
                return (
                  <div
                    key={id}
                    className={`nav-item${activeSceneId === id ? ' active' : ''}`}
                    onClick={() => setScene(id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setScene(id)
                    }}
                  >
                    <div className="nav-dot" style={{ background: scene.accentColor }} />
                    {scene.title}
                  </div>
                )
              })}
            </div>
          ))}
        </nav>
      </div>
    </aside>
  )
}
