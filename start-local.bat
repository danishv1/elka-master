@echo off
echo Starting Invoice Manager locally...
echo.
echo Development mode: Authentication will work with mock user
echo Production mode: Requires HTTPS and proper Firebase Auth setup
echo.
echo Starting HTTP server on port 8080...
echo Opening Chrome automatically...
start chrome http://localhost:8080
npx http-server public -p 8080
