@echo off
echo Checking Discord Tracker Pro Health...
echo.

echo Checking Backend (http://localhost:3000/health)...
curl -s http://localhost:3000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend is running
) else (
    echo ❌ Backend is not responding
)

echo.
echo Checking Frontend (http://localhost:5000)...
curl -s http://localhost:5000 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend is running
) else (
    echo ❌ Frontend is not responding
)

echo.
echo Health check completed!
pause
