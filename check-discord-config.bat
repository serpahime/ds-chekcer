@echo off
echo 🔍 Checking Discord OAuth Configuration...
echo.

echo 📋 Environment Variables Check:
echo ===============================

if defined DISCORD_CLIENT_ID (
    echo ✅ DISCORD_CLIENT_ID is set
    echo    Value: %DISCORD_CLIENT_ID%
) else (
    echo ❌ DISCORD_CLIENT_ID is not set
)

if defined DISCORD_CLIENT_SECRET (
    echo ✅ DISCORD_CLIENT_SECRET is set
    echo    Value: %DISCORD_CLIENT_SECRET:~0,10%...
) else (
    echo ❌ DISCORD_CLIENT_SECRET is not set
)

if defined DISCORD_CALLBACK_URL (
    echo ✅ DISCORD_CALLBACK_URL is set
    echo    Value: %DISCORD_CALLBACK_URL%
) else (
    echo ❌ DISCORD_CALLBACK_URL is not set
    echo    Default will be: http://localhost:3000/auth/discord/callback
)

echo.
echo 🔧 Discord Application Setup Instructions:
echo =========================================
echo.
echo 1. Go to https://discord.com/developers/applications
echo 2. Select your application (or create new one)
echo 3. Go to OAuth2 section
echo 4. Add these redirect URLs:
echo    - http://localhost:3000/auth/discord/callback
echo    - http://127.0.0.1:3000/auth/discord/callback
echo 5. Select these scopes:
echo    - identify
echo    - email
echo    - guilds
echo 6. Copy Client ID and Client Secret
echo 7. Update config.env file
echo.
echo 📝 Required config.env format:
echo ==============================
echo DISCORD_CLIENT_ID=your_client_id_here
echo DISCORD_CLIENT_SECRET=your_client_secret_here
echo DISCORD_CALLBACK_URL=http://localhost:3000/auth/discord/callback
echo.
echo 🧪 Testing OAuth Endpoint:
echo ==========================
curl -s http://localhost:3000/auth/discord >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Discord OAuth endpoint is accessible
) else (
    echo ❌ Discord OAuth endpoint is not accessible
    echo    Make sure the server is running on port 3000
)

echo.
echo 📖 For detailed setup instructions, see DISCORD_SETUP.md
echo.
pause
