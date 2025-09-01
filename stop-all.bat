@echo off
title Discord Tracker Pro - Stop All Services
color 0C

echo.
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║                    DISCORD TRACKER PRO                      ║
echo  ║                    Stop All Services                        ║
echo  ╚══════════════════════════════════════════════════════════════╝
echo.
echo  🛑 Stopping all Discord Tracker Pro services...
echo.

echo  🔍 Finding running processes...
echo.

echo  Stopping Node.js processes...
tasklist /fi "imagename eq node.exe" 2>nul | find /i "node.exe" >nul
if %errorlevel% equ 0 (
    echo  Found Node.js processes, stopping them...
    taskkill /f /im node.exe >nul 2>&1
    if %errorlevel% equ 0 (
        echo  ✅ Node.js processes stopped
    ) else (
        echo  ❌ Failed to stop Node.js processes
    )
) else (
    echo  ℹ️  No Node.js processes found
)

echo.
echo  Stopping HTTP Server processes...
tasklist /fi "imagename eq http-server.exe" 2>nul | find /i "http-server.exe" >nul
if %errorlevel% equ 0 (
    echo  Found HTTP Server processes, stopping them...
    taskkill /f /im http-server.exe >nul 2>&1
    if %errorlevel% equ 0 (
        echo  ✅ HTTP Server processes stopped
    ) else (
        echo  ❌ Failed to stop HTTP Server processes
    )
) else (
    echo  ℹ️  No HTTP Server processes found
)

echo.
echo  Stopping Command Prompt windows...
tasklist /fi "imagename eq cmd.exe" 2>nul | find /i "cmd.exe" >nul
if %errorlevel% equ 0 (
    echo  Found Command Prompt windows, stopping them...
    taskkill /f /im cmd.exe >nul 2>&1
    if %errorlevel% equ 0 (
        echo  ✅ Command Prompt windows stopped
    ) else (
        echo  ❌ Failed to stop Command Prompt windows
    )
) else (
    echo  ℹ️  No Command Prompt windows found
)

echo.
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║                        COMPLETED                             ║
echo  ╚══════════════════════════════════════════════════════════════╝
echo.
echo  🎯 All Discord Tracker Pro services have been stopped
echo.
echo  💡 To start services again, use:
echo     - quick-start.bat (recommended)
echo     - DiscordTrackerPro.bat (advanced)
echo     - start-backend.bat + start-frontend.bat (manual)
echo.
pause
