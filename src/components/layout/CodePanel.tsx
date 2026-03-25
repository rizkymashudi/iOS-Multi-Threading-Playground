import { useSceneStore } from '../../store/sceneStore'
import { CODES } from '../../constants/codeSnippets'

export default function CodePanel() {
  const activeSceneId = useSceneStore((s) => s.activeSceneId)
  const code = CODES[activeSceneId]

  return (
    <div className="code-panel">
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
      </div>
      <div className="code-scroll">
        <pre dangerouslySetInnerHTML={{ __html: code }} />
      </div>
    </div>
  )
}
