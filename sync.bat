@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ============================================
echo   Envoi de POPOTT sur GitHub
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
if errorlevel 1 (
  echo.
  echo ***  Une erreur est survenue pendant le push.  ***
  echo.
  pause
  exit /b 1
)

echo.
echo ---------------------------------------------
echo   Envoye. GitHub reconstruit le site tout seul.
echo ---------------------------------------------
echo.

REM Si l'outil GitHub est installe, on attend la publication et on le dit.
REM Sinon on s'arrete la : la publication se fait quand meme, en silence.
where gh >nul 2>nul
if errorlevel 1 (
  echo Le site sera a jour dans une minute environ :
  echo   https://dartois.studio/popott/
  echo.
  pause
  exit /b 0
)

echo Publication en cours, patiente...
echo.

REM On attend la publication de CE commit precisement. Prendre simplement la
REM plus recente annoncerait un faux succes en repechant celle d'avant.
for /f "usebackq tokens=*" %%i in (`git rev-parse HEAD`) do set "SHA=%%i"
set "RUNID="
set "ESSAIS=0"

:attente
for /f "usebackq tokens=*" %%i in (`gh run list --commit %SHA% --limit 1 --json databaseId --jq ".[0].databaseId"`) do set "RUNID=%%i"
if not "%RUNID%"=="" goto trouve
set /a ESSAIS+=1
if %ESSAIS% lss 12 (
  timeout /t 5 >nul
  goto attente
)

echo Impossible de retrouver la publication en cours. Verifie l'onglet Actions.
echo.
pause
exit /b 0

:trouve

gh run watch %RUNID% --exit-status >nul
if errorlevel 1 (
  echo.
  echo ***  La publication a echoue : le site en ligne n'a PAS change.  ***
  echo   Pour voir pourquoi : gh run view %RUNID% --log-failed
  echo.
  pause
  exit /b 1
)

echo.
echo ---------------------------------------------
echo   C'est en ligne : https://dartois.studio/popott/
echo   Sur le telephone, rafraichir la page.
echo ---------------------------------------------
echo.
pause
