@echo off
title Discord Tracker Pro - System Backup
color 0F

echo.
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║                    DISCORD TRACKER PRO                      ║
echo  ║                      System Backup                           ║
echo  ╚══════════════════════════════════════════════════════════════╝
echo.
echo  💾 Creating system backup...
echo.

set backup_date=%date:~-4,4%-%date:~3,2%-%date:~0,2%
set backup_time=%time:~0,2%-%time:~3,2%-%time:~6,2%
set backup_time=%backup_time: =0%
set backup_folder=backup_%backup_date%_%backup_time%

echo  📅 Backup Date: %backup_date%
echo  🕐 Backup Time: %backup_time%
echo  📁 Backup Folder: %backup_folder%
echo.

echo  🔍 Creating backup directory...
if not exist backups mkdir backups
if not exist backups\%backup_folder% mkdir backups\%backup_folder%

echo.
echo  📋 Backing up configuration files...
copy config.env backups\%backup_folder%\ >nul 2>&1
if %errorlevel% equ 0 (
    echo  ✅ config.env backed up
) else (
    echo  ❌ Failed to backup config.env
)

copy package.json backups\%backup_folder%\ >nul 2>&1
if %errorlevel% equ 0 (
    echo  ✅ package.json backed up
) else (
    echo  ❌ Failed to backup package.json
)

echo.
echo  📁 Backing up source code...
xcopy /E /I /Y models backups\%backup_folder%\models >nul 2>&1
if %errorlevel% equ 0 (
    echo  ✅ models directory backed up
) else (
    echo  ❌ Failed to backup models directory
)

copy server.js backups\%backup_folder%\ >nul 2>&1
if %errorlevel% equ 0 (
    echo  ✅ server.js backed up
) else (
    echo  ❌ Failed to backup server.js
)

copy index.htm backups\%backup_folder%\ >nul 2>&1
if %errorlevel% equ 0 (
    echo  ✅ index.htm backed up
) else (
    echo  ❌ Failed to backup index.htm
)

copy style.css backups\%backup_folder%\ >nul 2>&1
if %errorlevel% equ 0 (
    echo  ✅ style.css backed up
) else (
    echo  ❌ Failed to backup style.css
)

copy script.js backups\%backup_folder%\ >nul 2>&1
if %errorlevel% equ 0 (
    echo  ✅ script.js backed up
) else (
    echo  ❌ Failed to backup script.js
)

echo.
echo  📝 Creating backup info file...
echo Discord Tracker Pro Backup > backups\%backup_folder%\backup-info.txt
echo Date: %backup_date% >> backups\%backup_folder%\backup-info.txt
echo Time: %backup_time% >> backups\%backup_folder%\backup-info.txt
echo Version: 1.0.0 >> backups\%backup_folder%\backup-info.txt
echo Files: >> backups\%backup_folder%\backup-info.txt
dir /B backups\%backup_folder% >> backups\%backup_folder%\backup-info.txt

echo.
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║                        BACKUP COMPLETED                      ║
echo  ╚══════════════════════════════════════════════════════════════╝
echo.
echo  🎯 Backup created successfully in: backups\%backup_folder%
echo.
echo  📊 Backup Contents:
echo  - Configuration files (config.env, package.json)
echo  - Source code (server.js, models/, frontend files)
echo  - Backup information (backup-info.txt)
echo.
echo  💡 To restore from backup:
echo     1. Copy files from backup folder to project root
echo     2. Run npm install to restore dependencies
echo     3. Start services with quick-start.bat
echo.
pause
