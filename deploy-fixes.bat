@echo off
echo Starting production deployment with error fixes...

echo Installing dependencies...
npm install

echo Building production version...
npm run build

echo Checking build for errors...
if errorlevel 1 (
    echo Build failed! Check errors above.
    pause
    exit /b 1
)

echo Build successful! Ready for deployment.
echo.
echo Next steps:
echo 1. Push changes to GitHub: git add . && git commit -m "Fix production errors" && git push
echo 2. Deploy to production (Vercel will auto-deploy from GitHub)
echo 3. Monitor production logs for any remaining issues
echo.
pause