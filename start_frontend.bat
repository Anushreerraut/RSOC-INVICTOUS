@echo off
echo.
echo  ========================================
echo    RSOC - API Security Scanner
echo    Starting Frontend (React + Vite)
echo    Open: http://localhost:5173
echo  ========================================
echo.
cd /d "%~dp0rsoc-ui"
npm run dev
pause
