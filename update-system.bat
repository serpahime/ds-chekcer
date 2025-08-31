@echo off
title Discord Tracker Pro - System Update
color 0D

echo.
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║                    DISCORD TRACKER PRO                      ║
echo  ║                      System Update                           ║
echo  ╚══════════════════════════════════════════════════════════════╝
echo.
echo  🔄 Updating Discord Tracker Pro system...
echo.

echo  ⚠️  WARNING: This will stop all services and update dependencies
echo.
set /p confirm="Continue with update? (y/N): "
if /i not "%confirm%"=="y" goto cancel

echo.
echo  🛑 Stopping all services...
call stop-all.bat >nul 2>&1

echo.
echo  📦 Updating Node.js dependencies...
npm update

echo.
echo  🔍 Checking for outdated packages...
npm outdated

echo.
echo  📥 Installing latest versions...
npm install

echo.
echo  🧹 Cleaning npm cache...
npm cache clean --force

echo.
echo  ✅ System update completed!
echo.
echo  🚀 Starting services with updated dependencies...
call quick-start.bat

goto end

:cancel
echo.
echo  Update cancelled.

:end
pause
