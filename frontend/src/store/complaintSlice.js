import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../api/client'

const emptyFields = {
  complaint_source: null,
  customer_name: null,
  product_name: null,
  product_strength_grade: null,
  batch_lot_number: null,
  manufacturing_date: null,
  expiry_date: null,
  quantity_affected: null,
  quantity_unit: 'kg',
  complaint_type: null,
  complaint_date: null,
  detailed_complaint_description: null,
  initial_severity: null,
  priority: null,
}

// Sends a chat message to the AI agent; agent extracts fields from natural
// language and returns the merged form state + a conversational reply.
export const sendChatMessage = createAsyncThunk(
  'complaint/sendChatMessage',
  async (message, { getState }) => {
    const { complaint } = getState()
    const response = await api.post('/api/assistant/chat', {
      message,
      current_fields: complaint.fields,
    })
    return response.data
  }
)

// Uploads a complaint document (PDF/DOCX/TXT/EML); agent extracts text and fields.
export const uploadComplaintDocument = createAsyncThunk(
  'complaint/uploadComplaintDocument',
  async (file, { getState }) => {
    const { complaint } = getState()
    const formData = new FormData()
    formData.append('file', file)
    formData.append('current_fields', JSON.stringify(complaint.fields))
    const response = await api.post('/api/assistant/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: () => {},
    })
    return response.data
  }
)

export const saveComplaint = createAsyncThunk(
  'complaint/saveComplaint',
  async (_, { getState }) => {
    const { complaint } = getState()
    const response = await api.post('/api/complaints', complaint.fields)
    return response.data
  }
)

// Fetches all saved complaints for the dashboard list view.
export const fetchComplaints = createAsyncThunk(
  'complaint/fetchComplaints',
  async () => {
    const response = await api.get('/api/complaints')
    return response.data
  }
)

export const fetchComplaintById = createAsyncThunk(
  'complaint/fetchComplaintById',
  async (id) => {
    const response = await api.get(`/api/complaints/${id}`)
    return response.data
  }
)

const initialState = {
  fields: { ...emptyFields },
  status: 'Pending Triage',
  messages: [
    {
      role: 'assistant',
      content:
        'Upload a complaint document or paste text above. I will automatically extract the details and populate the form for you.',
    },
  ],
  extractionProgress: 0,
  isExtracting: false,
  fieldsUpdated: [],
  missingRequiredFields: [],
  saveState: 'idle', // idle | saving | saved | error
  error: null,

  // Saved complaints dashboard/list state
  savedComplaints: [],
  savedComplaintsStatus: 'idle', // idle | loading | succeeded | error
  selectedComplaint: null,

  // Bonus AI features
  capaRecommendation: null,
  duplicateWarning: null,
}

const complaintSlice = createSlice({
  name: 'complaint',
  initialState,
  reducers: {
    resetForm: (state) => {
      state.fields = { ...emptyFields }
      state.fieldsUpdated = []
      state.missingRequiredFields = []
      state.saveState = 'idle'
      state.capaRecommendation = null
      state.duplicateWarning = null
    },
    setFieldManually: (state, action) => {
      // kept for completeness (e.g. dropdown correction after AI fill),
      // but the UI does not expose free manual entry per requirements
      const { field, value } = action.payload
      state.fields[field] = value
    },
    userMessageAppended: (state, action) => {
      state.messages.push({ role: 'user', content: action.payload })
    },
    clearSelectedComplaint: (state) => {
      state.selectedComplaint = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Chat-based extraction
      .addCase(sendChatMessage.pending, (state) => {
        state.isExtracting = true
        state.extractionProgress = 10
        state.error = null
      })
      .addCase(sendChatMessage.fulfilled, (state, action) => {
        const { fields, assistant_reply, fields_updated, missing_required_fields, capa_recommendation, duplicate_warning } = action.payload
        state.fields = fields
        state.fieldsUpdated = fields_updated
        state.missingRequiredFields = missing_required_fields
        state.capaRecommendation = capa_recommendation || null
        state.duplicateWarning = duplicate_warning || null
        state.messages.push({ role: 'assistant', content: assistant_reply })
        state.isExtracting = false
        state.extractionProgress = 100
        state.saveState = 'idle' // new data came in — this is unsaved until Save is clicked again
      })
      .addCase(sendChatMessage.rejected, (state, action) => {
        state.isExtracting = false
        state.extractionProgress = 0
        state.error = action.error.message
        state.messages.push({
          role: 'assistant',
          content: "Sorry, I couldn't process that. Please try again.",
        })
      })
      // Document upload extraction
      .addCase(uploadComplaintDocument.pending, (state) => {
        state.isExtracting = true
        state.extractionProgress = 10
        state.error = null
      })
      .addCase(uploadComplaintDocument.fulfilled, (state, action) => {
        const { fields, assistant_reply, fields_updated, missing_required_fields, capa_recommendation, duplicate_warning } = action.payload
        state.fields = fields
        state.fieldsUpdated = fields_updated
        state.missingRequiredFields = missing_required_fields
        state.capaRecommendation = capa_recommendation || null
        state.duplicateWarning = duplicate_warning || null
        state.messages.push({ role: 'assistant', content: assistant_reply })
        state.isExtracting = false
        state.extractionProgress = 100
        state.saveState = 'idle' // new data came in — this is unsaved until Save is clicked again
      })
      .addCase(uploadComplaintDocument.rejected, (state, action) => {
        state.isExtracting = false
        state.extractionProgress = 0
        state.error = action.error.message
        state.messages.push({
          role: 'assistant',
          content:
            'I had trouble reading that document. Please check the format (PDF, DOCX, TXT, EML) and try again.',
        })
      })
      // Save complaint
      .addCase(saveComplaint.pending, (state) => {
        state.saveState = 'saving'
      })
      .addCase(saveComplaint.fulfilled, (state) => {
        state.saveState = 'saved'
        state.status = 'Pending Triage'
      })
      .addCase(saveComplaint.rejected, (state, action) => {
        state.saveState = 'error'
        state.error = action.error.message
      })
      // Fetch list of saved complaints
      .addCase(fetchComplaints.pending, (state) => {
        state.savedComplaintsStatus = 'loading'
      })
      .addCase(fetchComplaints.fulfilled, (state, action) => {
        state.savedComplaintsStatus = 'succeeded'
        state.savedComplaints = action.payload
      })
      .addCase(fetchComplaints.rejected, (state, action) => {
        state.savedComplaintsStatus = 'error'
        state.error = action.error.message
      })
      // Fetch single complaint detail
      .addCase(fetchComplaintById.fulfilled, (state, action) => {
        state.selectedComplaint = action.payload
      })
  },
})

export const { resetForm, setFieldManually, userMessageAppended, clearSelectedComplaint } = complaintSlice.actions
export default complaintSlice.reducer
