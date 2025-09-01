@echo off
title Discord Tracker Pro - System Diagnosis
color 0C

echo.
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║                    DISCORD TRACKER PRO                      ║
echo  ║                      System Diagnosis                        ║
echo  ╚══════════════════════════════════════════════════════════════╝
echo.
echo  🔍 Running comprehensive system diagnosis...
echo.

echo  📋 System Information:
echo  ======================
echo  OS: %OS%
echo  Version: %OS_VERSION%
echo  Architecture: %PROCESSOR_ARCHITECTURE%
echo  Date: %date%
echo  Time: %time%
echo  ======================
echo.

echo  🔍 Checking Node.js...
node --version >nul 2>&1
if %errorlevel% equ 0 (
    echo  ✅ Node.js is installed
    for /f "tokens=*" %%i in ('node --version') do echo  Version: %%i
) else (
    echo  ❌ Node.js is not installed
    echo  💡 Please install Node.js from https://nodejs.org/
)

echo.
echo  🔍 Checking npm...
npm --version >nul 2>&1
if %errorlevel% equ 0 (
    echo  ✅ npm is installed
    for /f "tokens=*" %%i in ('npm --version') do echo  Version: %%i
) else (
    echo  ❌ npm is not installed
)

echo.
echo  🔍 Checking project files...
echo.
if exist package.json (
    echo  ✅ package.json exists
) else (
    echo  ❌ package.json missing
)

if exist config.env (
    echo  ✅ config.env exists
) else (
    echo  ❌ config.env missing
)

if exist server.js (
    echo  ✅ server.js exists
) else (
    echo  ❌ server.js missing
)

if exist index.htm (
    echo  ✅ index.htm exists
) else (
    echo  ❌ index.htm missing
)

if exist models (
    echo  ✅ models directory exists
) else (
    echo  ❌ models directory missing
)

echo.
echo  🔍 Checking dependencies...
if exist node_modules (
    echo  ✅ node_modules exists
    echo  📦 Checking package-lock.json...
    if exist package-lock.json (
        echo  ✅ package-lock.json exists
    ) else (
        echo  ❌ package-lock.json missing
        echo  💡 Run npm install to fix this
    )
) else (
    echo  ❌ node_modules missing
    echo  💡 Run npm install to install dependencies
)

echo.
echo  🔍 Checking network connectivity...
echo  Testing localhost connections...
curl -s http://localhost:3000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo  ✅ Backend is responding on port 3000
) else (
    echo  ❌ Backend is not responding on port 3000
)

curl -s http://localhost:5000 >nul 2>&1
if %errorlevel% equ 0 (
    echo  ✅ Frontend is responding on port 5000
) else (
    echo  ❌ Frontend is not responding on port 5000
)

echo.
echo  🔍 Checking MongoDB connection...
curl -s "http://localhost:3000/health" | findstr "connected" >nul 2>&1
if %errorlevel% equ 0 (
    echo  ✅ MongoDB connection is working
) else (
    echo  ❌ MongoDB connection issue detected
)

echo.
echo  🔍 Checking Discord OAuth configuration...
if exist config.env (
    findstr "DISCORD_CLIENT_ID" config.env >nul 2>&1
    if %errorlevel% equ 0 (
        echo  ✅ Discord Client ID is configured
    ) else (
        echo  ❌ Discord Client ID is missing
    )
    
    findstr "DISCORD_CLIENT_SECRET" config.env >nul 2>&1
    if %errorlevel% equ 0 (
        echo  ✅ Discord Client Secret is configured
    ) else (
        echo  ❌ Discord Client Secret is missing
    )
    
    findstr "MONGODB_URI" config.env >nul 2>&1
    if %errorlevel% equ 0 (
        echo  ✅ MongoDB URI is configured
    ) else (
        echo  ❌ MongoDB URI is missing
    )
)

echo.
echo  🔍 Checking running processes...
echo  Node.js processes:
tasklist /fi "imagename eq node.exe" 2>nul | find /i "node.exe" >nul
if %errorlevel% equ 0 (
    echo  ✅ Node.js processes are running
) else (
    echo  ❌ No Node.js processes found
)

echo  HTTP Server processes:
tasklist /fi "imagename eq http-server.exe" 2>nul | find /i "http-server.exe" >nul
if %errorlevel% equ 0 (
    echo  ✅ HTTP Server processes are running
) else (
    echo  ❌ No HTTP Server processes found
)

echo.
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║                    DIAGNOSIS COMPLETED                      ║
echo  ╚══════════════════════════════════════════════════════════════╝
echo.
echo  📊 Summary:
echo  - Check the ✅ and ❌ indicators above
echo  - Fix any ❌ issues before starting services
echo  - Common solutions:
echo    * Run npm install for missing dependencies
echo    * Check config.env for missing credentials
echo    * Ensure ports 3000 and 5000 are available
echo    * Verify MongoDB connection string
echo.
echo  💡 Next steps:
echo    1. Fix any identified issues
echo    2. Run quick-start.bat to start services
echo    3. Use test-system.bat to verify functionality
echo.
pause
