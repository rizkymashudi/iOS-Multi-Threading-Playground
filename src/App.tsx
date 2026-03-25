import Sidebar from './components/layout/Sidebar'
import Topbar from './components/layout/Topbar'
import SimArea from './components/layout/SimArea'
import CodePanel from './components/layout/CodePanel'

export default function App() {
  return (
    <div className="app">
      <Sidebar />
      <div className="center-col">
        <Topbar />
        <SimArea />
      </div>
      <CodePanel />
    </div>
  )
}
