@echo off
title Nidel Muebles - Servidor Web
echo =======================================================
echo          INICIANDO NIDEL MUEBLES (WEB)
echo =======================================================
echo.
echo 1. Iniciando servidor en http://localhost:9002 ...
echo 2. Abriendo tu navegador web automaticamente...
echo.
echo (Nota: Deja esta ventana abierta mientras uses el programa.
echo  Para cerrarlo, simplemente cierra esta ventana).
echo =======================================================
echo.

cd /d "%~dp0"

:: Abrir el navegador en http://localhost:9002 despues de 4 segundos
start "" powershell -NoProfile -Command "Start-Sleep -Seconds 4; Start-Process 'http://localhost:9002'"

:: Ejecutar el servidor Next.js
call npm run dev

echo.
echo El servidor se ha detenido.
pause
