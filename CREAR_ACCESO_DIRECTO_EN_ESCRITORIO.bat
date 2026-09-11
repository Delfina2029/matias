@echo off
title Crear Acceso Directo - Nidel Muebles
echo =======================================================
echo     CREANDO ACCESO DIRECTO EN TU ESCRITORIO
echo =======================================================
echo.

set SCRIPT="%TEMP%\%RANDOM%-%RANDOM%_shortcut.vbs"
set TARGET_PATH=%~dp0INICIAR_PROGRAMA.bat
set WORKING_DIR=%~dp0

echo Set oWS = WScript.CreateObject("WScript.Shell") > %SCRIPT%
echo sLinkFile = oWS.SpecialFolders("Desktop") ^& "\Nidel Muebles.lnk" >> %SCRIPT%
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> %SCRIPT%
echo oLink.TargetPath = "%TARGET_PATH%" >> %SCRIPT%
echo oLink.WorkingDirectory = "%WORKING_DIR%" >> %SCRIPT%
echo oLink.Description = "Iniciar Nidel Muebles" >> %SCRIPT%
echo oLink.WindowStyle = 1 >> %SCRIPT%
echo oLink.Save >> %SCRIPT%

cscript //nologo %SCRIPT%
del %SCRIPT%

echo =======================================================
echo  EXITO: Se creo el acceso directo "Nidel Muebles"
echo  en tu Escritorio de Windows.
echo.
echo  Ahora podras abrir tu web con un doble clic desde
echo  el Escritorio sin necesidad de abrir Antigravity!
echo =======================================================
echo.
pause
