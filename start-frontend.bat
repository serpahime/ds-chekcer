@echo off
echo Starting Discord Tracker Pro Frontend...
echo.
echo Backend should be running on http://localhost:3000
echo Frontend will be available on http://localhost:5000
echo.
echo Press Ctrl+C to stop the server
echo.
npx http-server -p 5000 -c-1
pause
