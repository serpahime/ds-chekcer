@echo off
echo 🚀 Discord Tracker Pro - Production Launch
echo ==========================================

echo.
echo 📋 Starting production server...

echo.
echo 🔧 Setting environment variables...
set NODE_ENV=production
set HOST=0.0.0.0
set PORT=3000

echo.
echo 🚀 Launching server...
echo 💡 Server will be accessible at:
echo    - Local: http://localhost:3000
echo    - Network: http://%COMPUTERNAME%:3000
echo    - Internet: https://ds-chekcer-1.onrender.com

echo.
echo ⚠️  Press Ctrl+C to stop the server
echo.

node server.js

echo.
echo 🔄 Server stopped. Press any key to exit...
pause >nul
