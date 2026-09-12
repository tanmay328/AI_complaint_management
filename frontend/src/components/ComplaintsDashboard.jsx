import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RefreshCw, X, ClipboardList } from 'lucide-react'
import { fetchComplaints, fetchComplaintById, clearSelectedComplaint } from '../store/complaintSlice'

const SEVERITY_COLORS = {
  Low: 'text-muted bg-paper border border-line',
  Medium: 'text-clay bg-clay-soft',
  High: 'text-clay bg-clay-soft',
  Critical: 'text-white bg-clay',
}

const PRIORITY_COLORS = {
  Low: 'text-muted bg-paper border border-line',
  Normal: 'text-accent-dark bg-accent-soft',
  High: 'text-clay bg-clay-soft',
  Urgent: 'text-white bg-clay',
}

function Badge({ value, colorMap }) {
  if (!value) return <span className="text-xs text-muted/60 font-mono">—</span>
  const cls = colorMap[value] || 'text-muted bg-paper border border-line'
  return <span className={`text-xs font-mono font-medium rounded px-2 py-0.5 ${cls}`}>{value}</span>
}

function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function DetailPanel({ complaint, onClose }) {
  if (!complaint) return null
  const rows = [
    ['Complaint Source', complaint.complaint_source],
    ['Customer Name', complaint.customer_name],
    ['Product Name', complaint.product_name],
    ['Product Strength/Grade', complaint.product_strength_grade],
    ['Batch/Lot Number', complaint.batch_lot_number],
    ['Manufacturing Date', formatDate(complaint.manufacturing_date)],
    ['Expiry Date', formatDate(complaint.expiry_date)],
    ['Quantity Affected', complaint.quantity_affected ? `${complaint.quantity_affected} ${complaint.quantity_unit || ''}` : '—'],
    ['Complaint Type', complaint.complaint_type],
    ['Complaint Date', formatDate(complaint.complaint_date)],
  ]

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-line rounded-lg max-w-lg w-full max-h-[85vh] overflow-y-auto">
        <div className="h-1 bg-accent" />
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-ink">Complaint Details</h3>
              <p className="text-xs text-muted font-mono mt-0.5">{complaint.id}</p>
            </div>
            <button onClick={onClose} className="text-muted hover:text-ink">
              <X size={20} />
            </button>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <Badge value={complaint.initial_severity} colorMap={SEVERITY_COLORS} />
            <Badge value={complaint.priority} colorMap={PRIORITY_COLORS} />
            <span className="text-xs font-mono font-medium bg-clay text-white rounded px-2 py-0.5">
              {complaint.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-4">
            {rows.map(([label, value]) => (
              <div key={label}>
                <p className="text-[11px] text-muted uppercase tracking-wide">{label}</p>
                <p className="text-sm text-ink font-mono">{value || '—'}</p>
              </div>
            ))}
          </div>

          <div>
            <p className="text-[11px] text-muted uppercase tracking-wide mb-1">Detailed Complaint Description</p>
            <p className="text-sm text-ink bg-paper border border-line rounded-md p-3">
              {complaint.detailed_complaint_description || '—'}
            </p>
          </div>

          <p className="text-xs text-muted font-mono mt-4">Logged {formatDate(complaint.created_at)}</p>
        </div>
      </div>
    </div>
  )
}

export default function ComplaintsDashboard() {
  const dispatch = useDispatch()
  const { savedComplaints, savedComplaintsStatus, selectedComplaint } = useSelector((s) => s.complaint)

  useEffect(() => {
    dispatch(fetchComplaints())
  }, [dispatch])

  return (
    <div className="bg-white border border-line rounded-lg overflow-hidden">
      <div className="h-1 bg-accent" />
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <ClipboardList size={19} className="text-ink" />
            <h1 className="text-lg font-semibold text-ink">Saved Complaints</h1>
          </div>
          <button
            onClick={() => dispatch(fetchComplaints())}
            className="flex items-center gap-2 text-sm font-medium text-muted border border-line rounded-md px-3 py-1.5 hover:bg-paper transition-colors"
          >
            <RefreshCw size={13} className={savedComplaintsStatus === 'loading' ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {savedComplaintsStatus === 'loading' && savedComplaints.length === 0 && (
          <p className="text-sm text-muted">Loading complaints…</p>
        )}

        {savedComplaintsStatus === 'succeeded' && savedComplaints.length === 0 && (
          <p className="text-sm text-muted">No complaints saved yet. Log one to see it here.</p>
        )}

        {savedComplaints.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] text-muted uppercase tracking-wide border-b border-line">
                  <th className="pb-2 font-medium">Customer</th>
                  <th className="pb-2 font-medium">Product</th>
                  <th className="pb-2 font-medium">Batch/Lot</th>
                  <th className="pb-2 font-medium">Type</th>
                  <th className="pb-2 font-medium">Severity</th>
                  <th className="pb-2 font-medium">Priority</th>
                  <th className="pb-2 font-medium">Logged</th>
                </tr>
              </thead>
              <tbody>
                {savedComplaints.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => dispatch(fetchComplaintById(c.id))}
                    className="border-b border-line/60 hover:bg-paper cursor-pointer transition-colors"
                  >
                    <td className="py-3 text-ink">{c.customer_name || '—'}</td>
                    <td className="py-3 text-ink">{c.product_name || '—'}</td>
                    <td className="py-3 text-muted font-mono">{c.batch_lot_number || '—'}</td>
                    <td className="py-3 text-muted">{c.complaint_type || '—'}</td>
                    <td className="py-3">
                      <Badge value={c.initial_severity} colorMap={SEVERITY_COLORS} />
                    </td>
                    <td className="py-3">
                      <Badge value={c.priority} colorMap={PRIORITY_COLORS} />
                    </td>
                    <td className="py-3 text-muted font-mono">{formatDate(c.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedComplaint && (
        <DetailPanel complaint={selectedComplaint} onClose={() => dispatch(clearSelectedComplaint())} />
      )}
    </div>
  )
}
