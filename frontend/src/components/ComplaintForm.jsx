import { useDispatch, useSelector } from 'react-redux'
import { RotateCcw, Save } from 'lucide-react'
import FormField from './FormField'
import { resetForm, saveComplaint } from '../store/complaintSlice'

const SEVERITY_OPTIONS = ['Low', 'Medium', 'High', 'Critical']
const PRIORITY_OPTIONS = ['Low', 'Normal', 'High', 'Urgent']

const STATUS_STYLES = {
  'Pending Triage': 'bg-clay text-white',
  'In Review': 'bg-accent text-white',
  Resolved: 'bg-ink text-white',
}

function Section({ number, title, children }) {
  return (
    <section className="grid grid-cols-[28px_1fr] gap-4">
      <div className="pt-0.5">
        <span className="font-mono text-xs text-muted">{String(number).padStart(2, '0')}</span>
      </div>
      <div>
        <p className="text-[11px] font-semibold tracking-wide text-muted mb-4 uppercase">{title}</p>
        {children}
      </div>
    </section>
  )
}

export default function ComplaintForm() {
  const dispatch = useDispatch()
  const { fields, status, fieldsUpdated, saveState } = useSelector((s) => s.complaint)

  const isUpdated = (name) => fieldsUpdated.includes(name)
  const statusClass = STATUS_STYLES[status] || 'bg-clay text-white'

  return (
    <div className="bg-white border border-line rounded-lg overflow-hidden">
      <div className="h-1 bg-accent" />
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-lg font-semibold text-ink">Log Customer Complaint</h1>
            <p className="text-sm text-muted mt-0.5">API &amp; FDF Quality Assurance Module</p>
          </div>
          <span className={`text-xs font-medium font-mono rounded px-2.5 py-1 whitespace-nowrap ${statusClass}`}>
            {status}
          </span>
        </div>
        <div className="border-t border-line mb-7" />

        <div className="space-y-9">
          <Section number={1} title="Origin & Customer Details">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Complaint Source" value={fields.complaint_source} justUpdated={isUpdated('complaint_source')} />
              <FormField label="Customer Name" value={fields.customer_name} justUpdated={isUpdated('customer_name')} />
            </div>
          </Section>

          <Section number={2} title="Product & Batch Identification">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <FormField label="Product Name" value={fields.product_name} justUpdated={isUpdated('product_name')} />
              <FormField
                label="Product Strength/Grade"
                value={fields.product_strength_grade}
                isMono
                justUpdated={isUpdated('product_strength_grade')}
              />
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <FormField
                label="Batch/Lot Number"
                value={fields.batch_lot_number}
                isMono
                justUpdated={isUpdated('batch_lot_number')}
              />
              <FormField
                label="Manufacturing Date"
                value={fields.manufacturing_date}
                isDate
                isMono
                justUpdated={isUpdated('manufacturing_date')}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                label="Expiry Date"
                value={fields.expiry_date}
                isDate
                isMono
                justUpdated={isUpdated('expiry_date')}
              />
              <FormField
                label="Quantity Affected"
                value={fields.quantity_affected}
                isMono
                suffix={fields.quantity_unit || 'kg'}
                justUpdated={isUpdated('quantity_affected')}
              />
            </div>
          </Section>

          <Section number={3} title="Complaint Details">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <FormField label="Complaint Type" value={fields.complaint_type} justUpdated={isUpdated('complaint_type')} />
              <FormField
                label="Complaint Date"
                value={fields.complaint_date}
                isDate
                isMono
                justUpdated={isUpdated('complaint_date')}
              />
            </div>
            <FormField
              label="Detailed Complaint Description"
              value={fields.detailed_complaint_description}
              isTextarea
              justUpdated={isUpdated('detailed_complaint_description')}
            />
          </Section>

          <Section number={4} title="Initial Assessment & Priority">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                label="Initial Severity"
                value={fields.initial_severity}
                isSelect
                options={SEVERITY_OPTIONS}
                justUpdated={isUpdated('initial_severity')}
              />
              <FormField
                label="Priority"
                value={fields.priority}
                isSelect
                options={PRIORITY_OPTIONS}
                justUpdated={isUpdated('priority')}
              />
            </div>
          </Section>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between mt-8 pt-5 border-t border-line">
          <button
            onClick={() => dispatch(resetForm())}
            className="flex items-center gap-2 text-sm font-medium text-muted border border-line rounded-md px-4 py-2 hover:bg-paper transition-colors"
          >
            <RotateCcw size={15} />
            Reset Form
          </button>
          <button
            onClick={() => dispatch(saveComplaint())}
            disabled={saveState === 'saving'}
            className="flex items-center gap-2 text-sm font-medium text-white bg-accent rounded-md px-4 py-2 hover:bg-accent-dark disabled:opacity-60 transition-colors"
          >
            <Save size={15} />
            {saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Saved ✓' : 'Save Complaint'}
          </button>
        </div>
      </div>
    </div>
  )
}
