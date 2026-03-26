import { useSceneStore } from '../../store/sceneStore'
import { CODES } from '../../constants/codeSnippets'

export default function CodePanel() {
  const activeSceneId = useSceneStore((s) => s.activeSceneId)
  const codePanelOpen = useSceneStore((s) => s.codePanelOpen)
  const toggleCodePanel = useSceneStore((s) => s.toggleCodePanel)
  const code = CODES[activeSceneId]

  return (
    <>
      {codePanelOpen && (
        <div className="code-panel-overlay" onClick={toggleCodePanel} aria-hidden="true" />
      )}
      <div className={`code-panel${codePanelOpen ? ' mobile-open' : ''}`}>
        <div className="code-panel-header">
          <span
            style={{
              width: 7,
              height: 7,
              background: 'var(--teal)',
              borderRadius: '50%',
              display: 'inline-block',
              flexShrink: 0,
            }}
          />
          Swift Code
          <button
            className="code-panel-close"
            onClick={toggleCodePanel}
            aria-label="Close code panel"
          >
            &#x2715;
          </button>
        </div>
        <div className="code-scroll">
          <pre dangerouslySetInnerHTML={{ __html: code }} />
        </div>
      </div>
    </>
  )
}
