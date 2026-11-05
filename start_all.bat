@echo off
echo Starting SchoolFlow Platform...
start "SchoolFlow Backend (Port 5001)" cmd /k "cd /d %~dp0server && node index.js"
start "SchoolFlow Frontend (Port 3000)" cmd /k "cd /d %~dp0client && npm run dev"
echo Both servers started!
echo Open http://localhost:3000 in your browser.
pause
