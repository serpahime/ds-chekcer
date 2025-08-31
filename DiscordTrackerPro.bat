@echo off
title Discord Tracker Pro - Management Console
color 0A

:menu
cls
echo.
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║                    DISCORD TRACKER PRO                      ║
echo  ║                     Management Console                      ║
echo  ╚══════════════════════════════════════════════════════════════╝
echo.
echo  📋 Available Commands:
echo.
echo  1. 🔧 Install Dependencies
echo  2. 🚀 Start Backend Server
echo  3. 🌐 Start Frontend Server
echo  4. 🔄 Restart All Services
echo  5. 🏥 Check System Health
echo  6. ⚙️  Check Configuration
echo  7. 📖 Open Documentation
echo  8. 🚪 Exit
echo.
echo  ═══════════════════════════════════════════════════════════════
echo.

set /p choice="Enter your choice (1-8): "

if "%choice%"=="1" goto install
if "%choice%"=="2" goto backend
if "%choice%"=="3" goto frontend
if "%choice%"=="4" goto restart
if "%choice%"=="5" goto health
if "%choice%"=="6" goto config
if "%choice%"=="7" goto docs
if "%choice%"=="8" goto exit
goto invalid

:install
cls
echo Installing dependencies...
call install-dependencies.bat
goto menu

:backend
cls
echo Starting backend server...
start "Discord Tracker Backend" start-backend.bat
echo Backend server started in new window
timeout /t 3 /nobreak >nul
goto menu

:frontend
cls
echo Starting frontend server...
start "Discord Tracker Frontend" start-frontend.bat
echo Frontend server started in new window
timeout /t 3 /nobreak >nul
goto menu

:restart
cls
echo Restarting all services...
call restart-all.bat
goto menu

:health
cls
echo Checking system health...
call check-health.bat
goto menu

:config
cls
echo Checking configuration...
call check-config.bat
goto menu

:docs
cls
echo Opening documentation...
start https://github.com/your-repo/DiscordTrackerPro
goto menu

:invalid
echo Invalid choice! Please enter a number between 1 and 8.
timeout /t 2 /nobreak >nul
goto menu

:exit
cls
echo.
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║                    THANK YOU FOR USING                      ║
echo  ║                    DISCORD TRACKER PRO                      ║
echo  ╚══════════════════════════════════════════════════════════════╝
echo.
echo  🎯 Happy tracking!
echo.
pause
exit
