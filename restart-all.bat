@echo off
echo Restarting Discord Tracker Pro Services...
echo.

echo Stopping existing processes...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /f /im http-server.exe >nul 2>&1

echo.
echo Waiting for processes to stop...
timeout /t 3 /nobreak >nul

echo.
echo Starting Backend...
start "Discord Tracker Backend" start-backend.bat

echo.
echo Waiting for backend to start...
timeout /t 5 /nobreak >nul

echo.
echo Starting Frontend...
start "Discord Tracker Frontend" start-frontend.bat

echo.
echo Services restarted!
echo Backend: http://localhost:3000
echo Frontend: http://localhost:5000
echo.
pause
