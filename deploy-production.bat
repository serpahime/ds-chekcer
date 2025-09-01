@echo off
echo 🚀 Discord Tracker Pro - Production Deployment
echo ================================================

echo.
echo 📋 Checking prerequisites...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js not found. Please install Node.js first.
    pause
    exit /b 1
)

where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm not found. Please install npm first.
    pause
    exit /b 1
)

echo ✅ Prerequisites check passed

echo.
echo 🔧 Installing production dependencies...
call npm ci --only=production
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)
echo ✅ Dependencies installed

echo.
echo 🐳 Building Docker image...
docker build -t discord-tracker-pro:latest .
if %errorlevel% neq 0 (
    echo ❌ Docker build failed
    pause
    exit /b 1
)
echo ✅ Docker image built

echo.
echo 🚀 Starting production server with PM2...
call npm run pm2:start
if %errorlevel% neq 0 (
    echo ❌ PM2 start failed
    pause
    exit /b 1
)
echo ✅ Production server started

echo.
echo 📊 Checking server status...
timeout /t 5 /nobreak >nul
call npm run pm2:status

echo.
echo 🌐 Server is now accessible at:
echo    - Local: http://localhost:3000
echo    - Production: https://ds-chekcer-1.onrender.com
echo    - Health Check: http://localhost:3000/health

echo.
echo 🎉 Deployment completed successfully!
echo.
echo 💡 Useful commands:
echo    - View logs: npm run pm2:logs
echo    - Restart: npm run pm2:restart
echo    - Stop: npm run pm2:stop
echo    - Status: npm run pm2:status

pause
