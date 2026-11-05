@echo off
echo ====================================================
echo Starting SchoolFlow Backend Server on Port 5001...
echo ====================================================
cd /d "%~dp0server"
node index.js
pause
