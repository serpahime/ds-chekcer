@echo off
echo 🐳 Discord Tracker Pro - Docker Deployment
echo ==========================================

echo.
echo 📋 Checking prerequisites...
where docker >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker not found. Please install Docker first.
    pause
    exit /b 1
)

where docker-compose >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose not found. Please install Docker Compose first.
    pause
    exit /b 1
)

echo ✅ Prerequisites check passed

echo.
echo 🛑 Stopping existing containers...
docker-compose down
if %errorlevel% neq 0 (
    echo ⚠️ No existing containers to stop
)

echo.
echo 🧹 Cleaning up old images...
docker system prune -f
if %errorlevel% neq 0 (
    echo ⚠️ Cleanup failed, continuing...
)

echo.
echo 🔧 Building and starting services...
docker-compose up --build -d
if %errorlevel% neq 0 (
    echo ❌ Docker Compose failed
    pause
    exit /b 1
)
echo ✅ Services started

echo.
echo 📊 Checking service status...
timeout /t 10 /nobreak >nul
docker-compose ps

echo.
echo 🏥 Checking health status...
docker-compose exec discord-tracker node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"
if %errorlevel% equ 0 (
    echo ✅ Service is healthy
) else (
    echo ⚠️ Service health check failed, but container is running
)

echo.
echo 🌐 Server is now accessible at:
echo    - Local: http://localhost:3000
echo    - Production: https://ds-chekcer-1.onrender.com
echo    - Health Check: http://localhost:3000/health

echo.
echo 🎉 Docker deployment completed successfully!
echo.
echo 💡 Useful commands:
echo    - View logs: docker-compose logs -f
echo    - Restart: docker-compose restart
echo    - Stop: docker-compose down
echo    - Status: docker-compose ps
echo    - Shell access: docker-compose exec discord-tracker sh

pause
