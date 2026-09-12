@echo off
REM Run this from the backend\ folder: setup_windows.bat
echo Creating virtual environment...
python -m venv venv
if errorlevel 1 (
    echo Falling back to py launcher...
    py -3 -m venv venv
)

call venv\Scripts\activate.bat

echo Installing dependencies...
pip install -r requirements.txt

if not exist .env (
    copy .env.example .env
    echo Created .env from .env.example - edit it to add your GROQ_API_KEY and DATABASE_URL
)

echo.
echo Setup complete. Next steps:
echo   1. Edit backend\.env with your GROQ_API_KEY and DATABASE_URL
echo   2. Start the database: docker compose -f ..\docker-compose.yml up -d
echo   3. Run the server: uvicorn app.main:app --reload --port 8000
pause
