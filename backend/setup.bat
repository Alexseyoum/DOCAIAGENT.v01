@echo off
echo Setting up Document Processing Agent Backend...
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: Node.js is not installed. Please install Node.js 20 or higher.
    exit /b 1
)

echo Node.js version:
node -v
echo.

REM Install dependencies
echo Installing dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo Error: Failed to install dependencies
    exit /b 1
)
echo Dependencies installed successfully
echo.

REM Create .env file if it doesn't exist
if not exist .env (
    echo Creating .env file from template...
    copy .env.example .env
    echo .env file created
    echo WARNING: Please add your ANTHROPIC_API_KEY to .env file
) else (
    echo .env file already exists
)
echo.

REM Create uploads directory
if not exist uploads (
    echo Creating uploads directory...
    mkdir uploads
    echo Uploads directory created
)
echo.

REM Create test fixtures directory
if not exist src\__tests__\fixtures (
    echo Creating test fixtures directory...
    mkdir src\__tests__\fixtures
    echo Test fixtures directory created
)
echo.

echo Setup complete!
echo.
echo Next steps:
echo 1. Add your ANTHROPIC_API_KEY to .env file
echo 2. Run 'npm run dev' to start development server
echo 3. Run 'npm test' to run tests
echo.
pause
