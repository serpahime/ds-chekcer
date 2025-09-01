@echo off
echo 🔧 External API Test Script
echo ===========================
echo.
echo This script will test different approaches to connect to the fishonxd.su API
echo and help diagnose the 403 access denied error.
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if axios is installed
echo 📦 Checking dependencies...
npm list axios >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  Warning: axios not found, installing...
    npm install axios
    if %errorlevel% neq 0 (
        echo ❌ Failed to install axios
        pause
        exit /b 1
    )
)

echo.
echo 🚀 Starting API tests...
echo.

REM Run the test script
node test-external-api.js

echo.
echo ✅ Test completed!
echo.
pause
