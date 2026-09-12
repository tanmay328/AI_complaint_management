import { Calendar } from 'lucide-react'

// Every field is AI-populated only (read-only inputs) per requirement:
// "no manual filling" - the AI chat panel is the sole way data enters the form.
// Identifiers (batch numbers, dates, quantities) use monospace, echoing how
// real batch-record paperwork typesets structured data fields.
export default function FormField({
  label,
  value,
  isDate = false,
  isTextarea = false,
  isSelect = false,
  isMono = false,
  options = [],
  suffix,
  justUpdated = false,
}) {
  const displayValue = value === null || value === undefined || value === '' ? '' : value
  const placeholder = 'Awaiting AI extraction…'

  const baseClasses = `w-full rounded-md border px-3 py-2 text-sm bg-paper text-ink placeholder:text-muted/60 outline-none transition-colors ${
    isMono ? 'font-mono' : ''
  } ${justUpdated ? 'border-accent bg-accent-soft ring-1 ring-accent/30' : 'border-line'}`

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] font-medium text-ink/80">{label}</label>
      <div className="relative">
        {isTextarea ? (
          <textarea
            readOnly
            value={displayValue}
            placeholder={placeholder}
            rows={3}
            className={`${baseClasses} resize-none`}
          />
        ) : isSelect ? (
          <select readOnly disabled value={displayValue || ''} className={`${baseClasses} appearance-none pr-8`}>
            <option value="">{placeholder}</option>
            {options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        ) : (
          <input
            readOnly
            type="text"
            value={displayValue}
            placeholder={placeholder}
            className={`${baseClasses} ${isDate || suffix ? 'pr-9' : ''}`}
          />
        )}
        {isDate && (
          <Calendar
            size={15}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
          />
        )}
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-muted pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
    </div>
  )
}
