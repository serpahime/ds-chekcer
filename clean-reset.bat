@echo off
echo Cleaning and Resetting Discord Tracker Pro...
echo.

echo ⚠️  WARNING: This will stop all services and clear temporary data
echo.
set /p confirm="Are you sure? (y/N): "
if /i not "%confirm%"=="y" goto cancel

echo.
echo 🛑 Stopping all services...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /f /im http-server.exe >nul 2>&1

echo.
echo 🧹 Cleaning temporary files...
if exist node_modules\* rmdir /s /q node_modules
if exist package-lock.json del package-lock.json

echo.
echo 🔄 Resetting configuration...
echo Configuration files preserved. You can manually reset config.env if needed.

echo.
echo 📦 Reinstalling dependencies...
npm install

echo.
echo ✅ Clean and reset completed!
echo.
echo Next steps:
echo 1. Run start-backend.bat to start the backend server
echo 2. Run start-frontend.bat to start the frontend server
echo 3. Open http://localhost:5000 in your browser
echo.
goto end

:cancel
echo.
echo Operation cancelled.

:end
pause
