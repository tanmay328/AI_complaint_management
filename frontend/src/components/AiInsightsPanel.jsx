import { useSelector } from 'react-redux'
import { CopyCheck, ListChecks, AlertOctagon } from 'lucide-react'

function DuplicateBanner({ duplicateWarning }) {
  if (!duplicateWarning) return null

  return (
    <div className="flex items-start gap-2.5 bg-clay-soft border border-clay/30 rounded-md px-4 py-3 mb-5">
      <AlertOctagon size={16} className="text-clay mt-0.5 shrink-0" />
      <div>
        <p className="text-sm font-medium text-clay">Possible Duplicate Complaint</p>
        <p className="text-xs text-clay/90 mt-0.5">{duplicateWarning.reason}</p>
        <p className="text-[11px] font-mono text-clay/70 mt-1">ID: {duplicateWarning.complaint_id}</p>
      </div>
    </div>
  )
}

function CapaSteps({ capaRecommendation }) {
  if (!capaRecommendation) {
    return (
      <p className="text-sm text-muted">
        Once enough complaint detail is extracted (product, complaint type, description), the AI
        Copilot will generate a recommended CAPA (Corrective and Preventive Action) plan here.
      </p>
    )
  }

  // Split numbered lines like "1. ..." into an array, falling back to
  // sentence-splitting if the model didn't number them.
  const lines = capaRecommendation
    .split(/\n+/)
    .map((l) => l.replace(/^\d+[\.\)]\s*/, '').trim())
    .filter(Boolean)

  return (
    <ul className="space-y-2.5">
      {lines.map((line, idx) => (
        <li key={idx} className="text-sm text-ink/90 flex gap-2.5">
          <span className="font-mono text-accent shrink-0">{String(idx + 1).padStart(2, '0')}</span>
          {line}
        </li>
      ))}
    </ul>
  )
}

export default function AiInsightsPanel() {
  const { capaRecommendation, duplicateWarning } = useSelector((s) => s.complaint)

  return (
    <div className="bg-white border border-line rounded-lg overflow-hidden">
      <div className="h-1 bg-accent" />
      <div className="p-6">
        <div className="flex items-center gap-2 mb-5">
          <ListChecks size={18} className="text-ink" />
          <h2 className="text-base font-semibold text-ink">AI Insights</h2>
          <span className="text-[10px] font-mono font-semibold text-accent-dark bg-accent-soft rounded px-2 py-0.5 ml-auto">
            AUTO
          </span>
        </div>

        <DuplicateBanner duplicateWarning={duplicateWarning} />

        <div className="flex items-center gap-2 mb-3">
          <CopyCheck size={14} className="text-muted" />
          <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">
            CAPA Recommendation
          </p>
        </div>
        <CapaSteps capaRecommendation={capaRecommendation} />
      </div>
    </div>
  )
}
