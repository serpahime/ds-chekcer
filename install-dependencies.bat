@echo off
echo Installing Discord Tracker Pro Dependencies...
echo.

echo Installing Node.js dependencies...
npm install

echo.
echo Installing global http-server if not present...
npm install -g http-server

echo.
echo Dependencies installation completed!
echo.
echo Next steps:
echo 1. Run start-backend.bat to start the backend server
echo 2. Run start-frontend.bat to start the frontend server
echo 3. Open http://localhost:5000 in your browser
echo.
pause
