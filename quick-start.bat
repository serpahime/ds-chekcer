@echo off
title Discord Tracker Pro - Quick Start
color 0E

echo.
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║                    DISCORD TRACKER PRO                      ║
echo  ║                      Quick Start                            ║
echo  ╚══════════════════════════════════════════════════════════════╝
echo.
echo  🚀 Starting Discord Tracker Pro services...
echo.

echo  🔧 Checking dependencies...
if not exist node_modules (
    echo  📦 Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo  ❌ Failed to install dependencies
        pause
        exit /b 1
    )
)

echo.
echo  🚀 Starting Backend Server...
start "Discord Tracker Backend" cmd /k "npm run dev"

echo.
echo  ⏳ Waiting for backend to start...
timeout /t 8 /nobreak >nul

echo.
echo  🌐 Starting Frontend Server...
start "Discord Tracker Frontend" cmd /k "npx http-server -p 5000"

echo.
echo  ⏳ Waiting for frontend to start...
timeout /t 5 /nobreak >nul

echo.
echo  🔍 Testing connections...
echo.

echo  Testing Backend...
curl -s http://localhost:3000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo  ✅ Backend is running on http://localhost:3000
) else (
    echo  ❌ Backend failed to start
)

echo  Testing Frontend...
curl -s http://localhost:5000 >nul 2>&1
if %errorlevel% equ 0 (
    echo  ✅ Frontend is running on http://localhost:5000
) else (
    echo  ❌ Frontend failed to start
)

echo.
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║                        SUCCESS!                             ║
echo  ╚══════════════════════════════════════════════════════════════╝
echo.
echo  🎉 Discord Tracker Pro is now running!
echo.
echo  📱 Open your browser and go to: http://localhost:5000
echo  🔐 Click "Войти через Discord" to authenticate
echo  🎯 Start tracking Discord users!
echo.
echo  ═══════════════════════════════════════════════════════════════
echo  📊 Backend:  http://localhost:3000
echo  🌐 Frontend: http://localhost:5000
echo  🏥 Health:   http://localhost:3000/health
echo  ═══════════════════════════════════════════════════════════════
echo.
echo  💡 Tip: Use DiscordTrackerPro.bat for advanced management
echo.
pause
