@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ============================================
echo   Synchronisation du repo POPOTT vers GitHub
echo ============================================
echo.

git add -A

git diff --cached --quiet
if %errorlevel%==0 (
  echo Aucun changement a envoyer. Tout est deja a jour.
  echo.
  pause
  exit /b 0
)

echo Fichiers qui vont etre envoyes :
git diff --cached --name-status
echo.

set "msg="
set /p "msg=Message du commit (Entree = 'Update') : "
if "%msg%"=="" set "msg=Update"

echo.
git commit -m "%msg%"
git push

echo.
if %errorlevel%==0 (
  echo ---------------------------------------------
  echo   Termine ! Changements envoyes sur GitHub.
  echo ---------------------------------------------
) else (
  echo ***  Une erreur est survenue pendant le push.  ***
)
echo.
pause
