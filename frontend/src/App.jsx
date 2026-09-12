import { useState } from 'react'
import ComplaintForm from './components/ComplaintForm'
import AiIntakeAssistant from './components/AiIntakeAssistant'
import AiInsightsPanel from './components/AiInsightsPanel'
import ComplaintsDashboard from './components/ComplaintsDashboard'

export default function App() {
  const [view, setView] = useState('new') // 'new' | 'saved'

  return (
    <div className="min-h-screen bg-paper text-ink">
      {/* Document-style header bar */}
      <header className="border-b border-line bg-white">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-accent flex items-center justify-center text-white font-mono text-xs font-semibold">
              QA
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">Complaint Management System</p>
              <p className="text-xs text-muted font-mono leading-tight">API &amp; FDF Quality Assurance</p>
            </div>
          </div>

          <nav className="flex items-center gap-1">
            <button
              onClick={() => setView('new')}
              className={`text-sm font-medium rounded px-3.5 py-1.5 transition-colors ${
                view === 'new' ? 'bg-accent text-white' : 'text-muted hover:bg-accent-soft hover:text-accent-dark'
              }`}
            >
              Log Complaint
            </button>
            <button
              onClick={() => setView('saved')}
              className={`text-sm font-medium rounded px-3.5 py-1.5 transition-colors ${
                view === 'saved' ? 'bg-accent text-white' : 'text-muted hover:bg-accent-soft hover:text-accent-dark'
              }`}
            >
              Saved Complaints
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 py-6">
        {view === 'new' ? (
          <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr_0.9fr] gap-6 items-start">
            <ComplaintForm />
            <AiIntakeAssistant />
            <AiInsightsPanel />
          </div>
        ) : (
          <ComplaintsDashboard />
        )}
      </main>
    </div>
  )
}
