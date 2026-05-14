@echo off
cd /d "%~dp0"
echo Demarrage du serveur local...
start /b py -m http.server 8765 > nul 2>&1
timeout /t 1 /nobreak > nul
start "" "http://localhost:8765/plan de classe.html"
echo.
echo Ouvrez Chrome sur http://localhost:8765/plan de classe.html
echo Cliquez sur l'icone d'installation dans la barre d'adresse.
echo Une fois installe, vous pouvez fermer cette fenetre.
pause
