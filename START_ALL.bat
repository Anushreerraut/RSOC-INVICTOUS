@echo off
echo.
echo  ========================================
echo    RSOC - Automated API Security Scanner
echo    Starting all services...
echo  ========================================
echo.

echo [1/2] Launching Backend on http://localhost:8000 ...
start "RSOC Backend" cmd /k "cd /d "%~dp0backend" && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

timeout /t 3 /nobreak >nul

echo [2/2] Launching Frontend on http://localhost:5173 ...
start "RSOC Frontend" cmd /k "cd /d "%~dp0rsoc-ui" && npm run dev"

timeout /t 4 /nobreak >nul

echo.
echo  ✅ Both servers are starting!
echo.
echo     Backend:  http://localhost:8000
echo     API Docs: http://localhost:8000/docs
echo     Frontend: http://localhost:5173
echo.
start http://localhost:5173
pause
