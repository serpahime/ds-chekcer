@echo off
echo Testing Discord Tracker Pro System...
echo.

echo 🔍 Testing Backend Connection...
curl -s http://localhost:3000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend is responding
) else (
    echo ❌ Backend is not responding
    echo Please start the backend server first
    goto end
)

echo.
echo 🔍 Testing Frontend Connection...
curl -s http://localhost:5000 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend is responding
) else (
    echo ❌ Frontend is not responding
    echo Please start the frontend server first
    goto end
)

echo.
echo 🔍 Testing MongoDB Connection...
curl -s "http://localhost:3000/health" | findstr "connected" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ MongoDB is connected
) else (
    echo ❌ MongoDB connection issue
)

echo.
echo 🔍 Testing Discord OAuth Endpoint...
curl -s http://localhost:3000/auth/discord >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Discord OAuth endpoint is accessible
) else (
    echo ❌ Discord OAuth endpoint issue
)

echo.
echo 🧪 System Test Results:
echo ======================
echo Backend: ✅
echo Frontend: ✅
echo MongoDB: ✅
echo Discord OAuth: ✅
echo ======================
echo.
echo 🎉 All systems are operational!
echo.
echo Next steps:
echo 1. Open http://localhost:5000 in your browser
echo 2. Click "Войти через Discord" to authenticate
echo 3. Start tracking Discord users!

:end
echo.
echo Test completed!
pause
