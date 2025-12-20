@echo off
echo ========================================
echo  TomeSphere - Copy to External Drive
echo ========================================
echo.

echo Creating destination folder on D: drive...
mkdir "D:\TomeSphere-Complete" 2>nul

echo.
echo Copying TomeSphere Application...
echo This may take a few minutes...
echo.

xcopy "C:\Users\VARALAKSHMI\.gemini\antigravity\playground\retrograde-void" "D:\TomeSphere-Complete\TomeSphere-App\" /E /I /H /Y

echo.
echo Copying Documentation...
xcopy "C:\Users\VARALAKSHMI\.gemini\antigravity\brain\76b12d8c-b17b-4ed2-9653-a95bf1b31bff" "D:\TomeSphere-Complete\Documentation\" /E /I /H /Y

echo.
echo ========================================
echo  COPY COMPLETE!
echo ========================================
echo.
echo Your project has been copied to:
echo D:\TomeSphere-Complete\
echo.
echo Contents:
echo - TomeSphere-App     (Your Next.js application)
echo - Documentation      (Walkthrough, flowchart, guides)
echo.
echo To use on another computer:
echo 1. Copy files from D: to local drive
echo 2. Run: npm install
echo 3. Run: npm run dev
echo.
pause
