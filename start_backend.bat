@echo off
echo.
echo  ========================================
echo    RSOC - API Security Scanner
echo    Starting Backend (FastAPI + uvicorn)
echo  ========================================
echo.
cd /d "%~dp0backend"
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
pause
