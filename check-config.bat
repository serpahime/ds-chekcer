@echo off
echo Checking Discord Tracker Pro Configuration...
echo.

echo Checking config.env file...
if exist config.env (
    echo ✅ config.env exists
    echo.
    echo Configuration contents:
    echo ======================
    type config.env
    echo ======================
) else (
    echo ❌ config.env not found!
    echo Please create config.env with your Discord OAuth credentials
)

echo.
echo Checking package.json...
if exist package.json (
    echo ✅ package.json exists
) else (
    echo ❌ package.json not found!
)

echo.
echo Checking server.js...
if exist server.js (
    echo ✅ server.js exists
) else (
    echo ❌ server.js not found!
)

echo.
echo Checking models directory...
if exist models (
    echo ✅ models directory exists
    if exist models\User.js (
        echo ✅ User.js model exists
    ) else (
        echo ❌ User.js model not found!
    )
    if exist models\TrackedUser.js (
        echo ✅ TrackedUser.js model exists
    ) else (
        echo ❌ TrackedUser.js model not found!
    )
) else (
    echo ❌ models directory not found!
)

echo.
echo Configuration check completed!
pause
