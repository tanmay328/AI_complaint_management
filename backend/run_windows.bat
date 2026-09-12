@echo off
REM Run this from the backend\ folder after setup_windows.bat has been run once
call venv\Scripts\activate.bat
uvicorn app.main:app --reload --port 8000
