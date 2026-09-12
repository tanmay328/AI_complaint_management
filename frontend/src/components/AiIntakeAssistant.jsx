import { useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Sparkles, UploadCloud, FileText, Send, Info, Bot, User } from 'lucide-react'
import {
  sendChatMessage,
  uploadComplaintDocument,
  userMessageAppended,
} from '../store/complaintSlice'

export default function AiIntakeAssistant() {
  const dispatch = useDispatch()
  const { messages, isExtracting, extractionProgress } = useSelector((s) => s.complaint)
  const [inputValue, setInputValue] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [showPasteBox, setShowPasteBox] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const fileInputRef = useRef(null)

  const handleFile = (file) => {
    if (!file) return
    dispatch(uploadComplaintDocument(file))
  }

  const onDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    handleFile(file)
  }

  const submitPastedText = () => {
    if (!pasteText.trim()) return
    dispatch(userMessageAppended(pasteText))
    dispatch(sendChatMessage(pasteText))
    setPasteText('')
    setShowPasteBox(false)
  }

  const submitChatMessage = () => {
    if (!inputValue.trim() || isExtracting) return
    dispatch(userMessageAppended(inputValue))
    dispatch(sendChatMessage(inputValue))
    setInputValue('')
  }

  return (
    <div className="bg-white border border-line rounded-lg overflow-hidden flex flex-col">
      <div className="h-1 bg-clay" />
      <div className="p-6 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Sparkles size={17} className="text-clay" />
            <h2 className="text-base font-semibold text-ink">AI Complaint Intake Assistant</h2>
          </div>
          <span className="text-[10px] font-mono font-semibold text-clay bg-clay-soft rounded px-2 py-0.5">BETA</span>
        </div>

        {/* Drag & drop zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          className={`border border-dashed rounded-lg py-8 px-4 flex flex-col items-center justify-center text-center transition-colors ${
            isDragging ? 'border-accent bg-accent-soft' : 'border-line'
          }`}
        >
          <UploadCloud size={26} className="text-muted mb-2" />
          <p className="text-sm text-ink/80">
            Drag &amp; drop complaint document here
            <br />
            or{' '}
            <button
              className="text-accent font-medium hover:underline"
              onClick={() => fileInputRef.current?.click()}
            >
              click to browse
            </button>
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt,.eml"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </div>

        {/* OR divider */}
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-line" />
          <span className="text-[11px] font-mono text-muted">OR</span>
          <div className="flex-1 h-px bg-line" />
        </div>

        {/* Paste text option */}
        {!showPasteBox ? (
          <button
            onClick={() => setShowPasteBox(true)}
            className="flex items-center justify-center gap-2 w-full border border-line rounded-lg py-3 text-sm text-ink/80 hover:bg-paper transition-colors"
          >
            <FileText size={15} />
            Paste Complaint Text / Email
          </button>
        ) : (
          <div className="border border-line rounded-lg p-3">
            <textarea
              autoFocus
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Paste the complaint email or text here…"
              rows={4}
              className="w-full text-sm outline-none resize-none placeholder:text-muted/60"
            />
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => setShowPasteBox(false)}
                className="text-xs font-medium text-muted px-3 py-1.5 hover:bg-paper rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={submitPastedText}
                className="text-xs font-medium text-white bg-accent px-3 py-1.5 rounded-md hover:bg-accent-dark"
              >
                Extract Details
              </button>
            </div>
          </div>
        )}

        {/* Supported formats note */}
        <div className="flex items-start gap-2 bg-accent-soft border border-accent/20 rounded-md px-3 py-2.5 mt-4">
          <Info size={13} className="text-accent-dark mt-0.5 shrink-0" />
          <p className="text-xs text-accent-dark leading-relaxed font-mono">
            Formats: PDF · DOCX · TXT · EML — Max 10MB
          </p>
        </div>

        {/* Extraction progress */}
        {isExtracting && (
          <div className="mt-4">
            <p className="text-[11px] font-semibold tracking-wide text-muted mb-2 uppercase">Extraction Progress</p>
            <div className="w-full h-1.5 bg-line rounded-full overflow-hidden">
              <div
                className="h-full bg-clay transition-all duration-500"
                style={{ width: `${extractionProgress}%` }}
              />
            </div>
            <p className="text-xs text-muted mt-2">Analyzing document content and extracting key details…</p>
          </div>
        )}

        {/* Chat / AI Assistant messages */}
        <div className="mt-5 flex-1">
          <p className="text-[11px] font-semibold tracking-wide text-muted mb-3 uppercase">AI Assistant</p>
          <div className="flex flex-col gap-3 max-h-80 overflow-y-auto pr-1">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div
                  className={`shrink-0 w-7 h-7 rounded flex items-center justify-center ${
                    m.role === 'user' ? 'bg-paper border border-line' : 'bg-accent-soft'
                  }`}
                >
                  {m.role === 'user' ? (
                    <User size={13} className="text-muted" />
                  ) : (
                    <Bot size={13} className="text-accent-dark" />
                  )}
                </div>
                <div
                  className={`text-sm rounded-lg px-3.5 py-2.5 max-w-[85%] ${
                    m.role === 'user' ? 'bg-paper border border-line text-ink/90' : 'bg-accent-soft text-ink/90'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat input */}
        <div className="flex items-center gap-2 mt-5 border border-line rounded-lg px-3 py-2">
          <input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submitChatMessage()}
            placeholder="Ask me anything about this complaint…"
            className="flex-1 text-sm outline-none placeholder:text-muted/60"
          />
          <button
            onClick={submitChatMessage}
            disabled={isExtracting}
            className="w-8 h-8 rounded-md bg-accent flex items-center justify-center text-white hover:bg-accent-dark disabled:opacity-60 transition-colors shrink-0"
          >
            <Send size={13} />
          </button>
        </div>
        <p className="text-[11px] text-muted text-center mt-2">AI responses may contain errors. Please verify information.</p>
      </div>
    </div>
  )
}
