@echo off
chcp 65001 >nul
cd /d "%~dp0app"

echo ============================================
echo   POPOTT - lancement de l'application en local
echo ============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js n'est pas installe sur cet ordinateur.
  echo.
  echo   1. Va sur https://nodejs.org
  echo   2. Telecharge la version "LTS"
  echo   3. Installe-la en cliquant Suivant partout
  echo   4. Relance ce fichier
  echo.
  pause
  exit /b 1
)

if not exist node_modules (
  echo Premiere fois : installation des outils, compte une a deux minutes.
  echo.
  call npm install
  echo.
)

echo L'application demarre. Deux adresses vont s'afficher juste en dessous :
echo.
echo   Local    ^> a ouvrir dans le navigateur de cet ordinateur
echo   Network  ^> a taper sur le telephone, connecte au meme wifi
echo.
echo Laisse cette fenetre ouverte tant que tu travailles.
echo Pour arreter : Ctrl+C, ou ferme la fenetre.
echo.

call npm run dev

pause
