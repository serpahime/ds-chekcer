@echo off
title Discord Tracker Pro - System Restore
color 0E

echo.
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║                    DISCORD TRACKER PRO                      ║
echo  ║                      System Restore                          ║
echo  ╚══════════════════════════════════════════════════════════════╝
echo.
echo  🔄 Restoring system from backup...
echo.

if not exist backups (
    echo  ❌ No backups found!
    echo  Please create a backup first using backup-system.bat
    pause
    exit /b 1
)

echo  📁 Available backups:
echo.
dir /B /AD backups
echo.

set /p backup_name="Enter backup folder name to restore from: "

if not exist backups\%backup_name% (
    echo  ❌ Backup folder not found: %backup_name%
    pause
    exit /b 1
)

echo.
echo  ⚠️  WARNING: This will overwrite current files!
echo  Current files will be backed up before restoration.
echo.
set /p confirm="Continue with restore? (y/N): "
if /i not "%confirm%"=="y" goto cancel

echo.
echo  🛑 Stopping all services...
call stop-all.bat >nul 2>&1

echo.
echo  💾 Creating safety backup of current files...
call backup-system.bat >nul 2>&1

echo.
echo  🔄 Restoring files from backup: %backup_name%
echo.

echo  Restoring configuration files...
copy backups\%backup_name%\config.env . >nul 2>&1
if %errorlevel% equ 0 (
    echo  ✅ config.env restored
) else (
    echo  ❌ Failed to restore config.env
)

copy backups\%backup_name%\package.json . >nul 2>&1
if %errorlevel% equ 0 (
    echo  ✅ package.json restored
) else (
    echo  ❌ Failed to restore package.json
)

echo.
echo  Restoring source code...
if exist backups\%backup_name%\models (
    xcopy /E /I /Y backups\%backup_name%\models models >nul 2>&1
    if %errorlevel% equ 0 (
        echo  ✅ models directory restored
    ) else (
        echo  ❌ Failed to restore models directory
    )
)

copy backups\%backup_name%\server.js . >nul 2>&1
if %errorlevel% equ 0 (
    echo  ✅ server.js restored
) else (
    echo  ❌ Failed to restore server.js
)

copy backups\%backup_name%\index.htm . >nul 2>&1
if %errorlevel% equ 0 (
    echo  ✅ index.htm restored
) else (
    echo  ❌ Failed to restore index.htm
)

copy backups\%backup_name%\style.css . >nul 2>&1
if %errorlevel% equ 0 (
    echo  ✅ style.css restored
) else (
    echo  ❌ Failed to restore style.css
)

copy backups\%backup_name%\script.js . >nul 2>&1
if %errorlevel% equ 0 (
    echo  ✅ script.js restored
) else (
    echo  ❌ Failed to restore script.js
)

echo.
echo  📦 Installing dependencies...
npm install

echo.
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║                        RESTORE COMPLETED                     ║
echo  ╚══════════════════════════════════════════════════════════════╝
echo.
echo  🎯 System restored successfully from: %backup_name%
echo.
echo  🚀 Starting services with restored configuration...
call quick-start.bat

goto end

:cancel
echo.
echo  Restore cancelled.

:end
pause
