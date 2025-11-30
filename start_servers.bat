@echo off
echo ========================================
echo Iniciando Servidores TEI
echo ========================================

:: Iniciar Backend en una nueva ventana
start "TEI Backend" cmd /k "cd /d %~dp0 && uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000"

:: Esperar 3 segundos
timeout /t 3 /nobreak

:: Iniciar Frontend en una nueva ventana
start "TEI Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ========================================
echo Servidores iniciados!
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
echo ========================================
echo.
echo Presiona cualquier tecla para cerrar esta ventana
echo (Los servidores seguiran corriendo en sus propias ventanas)
pause
