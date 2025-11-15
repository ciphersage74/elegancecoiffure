@echo off
echo ========================================
echo   DIAGNOSTIC - Elegance Coiffure
echo ========================================
echo.

cd /d "%~dp0"

echo [1] Verification de la structure...
if exist salon_backend (
    echo [OK] Dossier salon_backend existe
) else (
    echo [ERREUR] Dossier salon_backend manquant!
    pause
    exit
)

cd salon_backend

if exist static (
    echo [OK] Dossier static existe
) else (
    echo [ERREUR] Dossier static manquant!
    pause
    exit
)

if exist static\assets (
    echo [OK] Dossier static\assets existe
) else (
    echo [ERREUR] Dossier static\assets manquant!
    pause
    exit
)

echo.
echo [2] Verification des fichiers...
dir /b static\assets\*.js
if errorlevel 1 (
    echo [ERREUR] Aucun fichier JS trouve!
) else (
    echo [OK] Fichiers JS trouves
)

echo.
echo [3] Verification du contenu du JS...
findstr /C:"auth-choice" static\assets\*.js >nul
if errorlevel 1 (
    echo [ERREUR] 'auth-choice' NON trouve dans le JS!
    echo PROBLEME: Le fichier JS est ancien ou corrompu
    echo SOLUTION: Re-extraire le ZIP dans un nouveau dossier
) else (
    echo [OK] 'auth-choice' trouve dans le JS
)

findstr /C:"Bienvenue chez" static\assets\*.js >nul
if errorlevel 1 (
    echo [ERREUR] 'Bienvenue chez' NON trouve!
) else (
    echo [OK] 'Bienvenue chez' trouve
)

echo.
echo [4] Verification de la date des fichiers...
dir /T:W static\assets\*.js | find "2025"

echo.
echo ========================================
echo   DIAGNOSTIC TERMINE
echo ========================================
echo.
echo Si tous les tests sont [OK], le probleme vient
echo du CACHE de votre navigateur.
echo.
echo SOLUTION:
echo 1. Demarrer le serveur (start.bat)
echo 2. Ouvrir http://localhost:5000
echo 3. Appuyer sur CTRL + SHIFT + R
echo 4. Ou ouvrir en mode navigation privee
echo.
pause

