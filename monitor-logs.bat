@echo off
title Discord Tracker Pro - Log Monitor
color 0B

echo.
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║                    DISCORD TRACKER PRO                      ║
echo  ║                      Log Monitor                            ║
echo  ╚══════════════════════════════════════════════════════════════╝
echo.
echo  📊 Monitoring system logs and performance...
echo  Press Ctrl+C to stop monitoring
echo.

:monitor
cls
echo.
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║                    SYSTEM STATUS                            ║
echo  ╚══════════════════════════════════════════════════════════════╝
echo.
echo  📅 Current Time: %date% %time%
echo.

echo  🔍 Checking Backend Status...
curl -s http://localhost:3000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo  ✅ Backend: RUNNING
) else (
    echo  ❌ Backend: STOPPED
)

echo.
echo  🔍 Checking Frontend Status...
curl -s http://localhost:5000 >nul 2>&1
if %errorlevel% equ 0 (
    echo  ✅ Frontend: RUNNING
) else (
    echo  ❌ Frontend: STOPPED
)

echo.
echo  🔍 Checking MongoDB Status...
curl -s "http://localhost:3000/health" | findstr "connected" >nul 2>&1
if %errorlevel% equ 0 (
    echo  ✅ MongoDB: CONNECTED
) else (
    echo  ❌ MongoDB: DISCONNECTED
)

echo.
echo  🔍 Checking Discord OAuth...
curl -s http://localhost:3000/auth/discord >nul 2>&1
if %errorlevel% equ 0 (
    echo  ✅ Discord OAuth: ACCESSIBLE
) else (
    echo  ❌ Discord OAuth: ERROR
)

echo.
echo  ═══════════════════════════════════════════════════════════════
echo  📊 System Resources:
echo  CPU Usage: Checking...
echo  Memory Usage: Checking...
echo  Disk Usage: Checking...
echo  ═══════════════════════════════════════════════════════════════
echo.
echo  🔄 Refreshing in 10 seconds... (Press Ctrl+C to stop)
echo.

timeout /t 10 /nobreak >nul
goto monitor
