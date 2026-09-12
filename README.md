# AI-Powered Customer Complaint Management System
Pharmaceutical API & FDF Quality Assurance Module

Matches the reference UI: a **Log Customer Complaint** form on the left (read-only,
AI-populated) and an **AI Complaint Intake Assistant** chat panel on the right.
**There is no manual form entry** — every field is filled by the LangGraph agent,
either from a natural-language chat message or from an uploaded/pasted document
(PDF, DOCX, TXT, EML).

## Architecture

```
Frontend (React + Redux Toolkit)
   |
   |  POST /api/assistant/chat     (natural language -> extracted fields)
   |  POST /api/assistant/upload   (document -> extracted text -> extracted fields)
   |  POST /api/complaints         (save final form)
   v
Backend (FastAPI)
   |
   v
LangGraph Agent  (extract_fields -> merge_fields -> generate_reply)
   |                 |
   |  gemma2-9b-it    |  llama-3.3-70b-versatile
   |  (structured      |  (conversational reply)
   |   extraction)      |
   v
Groq API
   |
   v
Postgres / MySQL  (via SQLAlchemy — works with either)
```

## How the AI flow satisfies the requirement
The chat panel on the right is the **only** input surface. The user either:
1. Drags/drops or browses a complaint document, or
2. Pastes complaint text/email, or
3. Types a free-form chat message describing the complaint.

Each of these calls the same LangGraph agent:
- **extract_fields node** — Groq `gemma2-9b-it` pulls the 14 form fields out of
  the raw text as strict JSON.
- **merge_fields node** — merges newly-found fields into whatever's already on
  the form (never blanks out existing values), and computes which required
  fields are still missing.
- **generate_reply node** — Groq `llama-3.3-70b-versatile` writes a short
  conversational reply confirming what was filled and asking for anything
  still missing (e.g. "I've filled in the product name and batch number.
  Could you confirm the customer name?").

The frontend then re-renders the form fields (highlighting the ones that just
updated) — the person never types directly into a form field.

## Backend setup

### Windows (PowerShell or CMD)

```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
:: edit .env in Notepad/VS Code: set GROQ_API_KEY and DATABASE_URL

:: start Postgres (or point DATABASE_URL at MySQL instead)
:: requires Docker Desktop for Windows to be installed and running
docker compose -f ..\docker-compose.yml up -d

uvicorn app.main:app --reload --port 8000
```

If `python` isn't recognized, try `py -3 -m venv venv` instead (the standard
Python launcher on Windows).

### macOS / Linux

```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# edit .env: set GROQ_API_KEY and DATABASE_URL

# start Postgres (or point DATABASE_URL at MySQL instead)
docker compose -f ../docker-compose.yml up -d

uvicorn app.main:app --reload --port 8000
```

Tables are auto-created on startup via `Base.metadata.create_all`. For
production, swap this for Alembic migrations (the `alembic` dependency is
already included).

### Quick start on Windows (double-click scripts)
Instead of typing the commands above, you can run:
- `backend\setup_windows.bat` — creates the venv, installs deps, copies `.env.example` to `.env`
- `backend\run_windows.bat` — activates the venv and starts the FastAPI server (run after editing `.env`)
- `frontend\setup_windows.bat` — runs `npm install`
- `frontend\run_windows.bat` — runs `npm run dev`

### Windows-specific notes
- **psycopg2-binary** and **pymysql** both ship prebuilt wheels for Windows,
  so `pip install -r requirements.txt` should not require a C compiler.
- If activation fails with a script-execution policy error in PowerShell, run:
  `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` in that window,
  then retry `venv\Scripts\activate`.
- Docker Desktop on Windows needs WSL2 enabled for `docker compose` to work.
  If you don't want to use Docker, install Postgres or MySQL natively for
  Windows instead and point `DATABASE_URL` in `.env` at it.

### Key backend files
- `app/agents/nodes.py` — the extraction prompt + merge/reply logic (the core AI logic)
- `app/agents/graph.py` — LangGraph graph wiring the three nodes together
- `app/api/assistant.py` — `/chat` and `/upload` endpoints the frontend calls
- `app/api/complaints.py` — CRUD for saving/listing complaints
- `app/models/complaint.py` — SQLAlchemy model (dialect-agnostic UUID type, so it runs on Postgres or MySQL unmodified)

## Frontend setup

Works the same on Windows, macOS, and Linux (Node.js handles the platform differences):

```bash
cd frontend
npm install
npm run dev
```

On Windows you can also just run `frontend\setup_windows.bat` then `frontend\run_windows.bat`.

Runs on `http://localhost:5173` by default and expects the backend at
`http://localhost:8000` (override with `VITE_API_BASE_URL` env var).

### Key frontend files
- `src/store/complaintSlice.js` — Redux slice: `sendChatMessage`,
  `uploadComplaintDocument`, `saveComplaint` thunks; holds the single source
  of truth for form field state
- `src/components/ComplaintForm.jsx` — left panel, 4 sections matching the
  reference screenshot exactly, all fields read-only
- `src/components/AiIntakeAssistant.jsx` — right panel: drag-and-drop upload,
  paste-text box, chat thread, extraction progress bar

## Environment variables (backend `.env`)

| Variable | Description |
|---|---|
| `DATABASE_URL` | SQLAlchemy connection string — Postgres or MySQL |
| `GROQ_API_KEY` | Your Groq API key (console.groq.com) |
| `GROQ_EXTRACTION_MODEL` | `gemma2-9b-it` |
| `GROQ_CHAT_MODEL` | `llama-3.3-70b-versatile` |
| `FRONTEND_ORIGIN` | CORS allow-list, e.g. `http://localhost:5173` |

## Next steps / things intentionally left simple for an intern-scope assignment
- Auth/RBAC for QA reviewers is not implemented.
- No streaming responses (Groq calls are synchronous request/response).
- File storage for uploaded originals is not persisted (only extracted text is used).
- Alembic migrations are scaffolded via the dependency but not yet configured —
  `create_all` is used for simplicity.
