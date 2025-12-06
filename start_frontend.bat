@echo off
REM Start Frontend Vite Server
REM This script launches the Vite development server on port 5173

cd /d "%~dp0frontend"

echo.
echo ============================================================
echo  TEI VIRTUAL STORE - Frontend Development Server
echo ============================================================
echo.
echo Starting Vite dev server on port 5173...
echo.
echo Access the dashboard at:
echo   http://localhost:5173/dashboard/store
echo.
echo Login with:
echo   Username: admin
echo   Password: admin123
echo.
echo ============================================================
echo.

npm run dev

pause
