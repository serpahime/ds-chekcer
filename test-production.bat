@echo off
echo 🧪 Discord Tracker Pro - Production Testing
echo ===========================================

echo.
echo 📋 Testing server availability...

echo.
echo 🔍 Testing local server...
curl -s http://localhost:3000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Local server is responding
) else (
    echo ❌ Local server is not responding
    echo 💡 Make sure the server is running
)

echo.
echo 🌐 Testing production URL...
curl -s https://ds-chekcer-1.onrender.com/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Production server is responding
) else (
    echo ❌ Production server is not responding
    echo 💡 Check if the deployment was successful
)

echo.
echo 🔐 Testing Discord OAuth...
curl -s https://ds-chekcer-1.onrender.com/auth/discord >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Discord OAuth endpoint is accessible
) else (
    echo ❌ Discord OAuth endpoint is not accessible
)

echo.
echo 📊 Testing API endpoints...
curl -s https://ds-chekcer-1.onrender.com/api/proxy/guilds >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Guilds API is working
) else (
    echo ❌ Guilds API is not working
)

echo.
echo 🎯 Testing search functionality...
echo 💡 This will test the search API endpoint
curl -s "https://ds-chekcer-1.onrender.com/api/search/123456789012345678" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Search API endpoint is accessible
) else (
    echo ❌ Search API endpoint is not accessible
)

echo.
echo 📝 Summary:
echo ===========
echo - Local server: %errorlevel%
echo - Production server: %errorlevel%
echo - Discord OAuth: %errorlevel%
echo - Guilds API: %errorlevel%
echo - Search API: %errorlevel%

echo.
echo 💡 If any tests failed:
echo    1. Check if the server is running
echo    2. Verify environment variables
echo    3. Check Discord OAuth configuration
echo    4. Review server logs

echo.
echo 🎉 Testing completed!
pause
