@echo off
echo ========================================
echo   Elegance Coiffure - Demarrage v1.1.2
echo ========================================
echo.

cd /d "%~dp0\salon_backend"

echo Verification du dossier static...
if exist static (
    echo [OK] Dossier static trouve
) else (
    echo [ERREUR] Dossier static manquant!
    echo Veuillez extraire le ZIP dans un nouveau dossier.
    pause
    exit
)

echo Suppression de l'environnement virtuel existant pour une reinstallation propre...
rd /s /q venv 2>nul

if not exist venv (
    echo Creation de l'environnement virtuel...
    python -m venv venv
    call venv\Scripts\activate
    echo Installation des dependances...
    pip install -r requirements.txt
) else (
    call venv\Scripts\activate
)

echo.
echo ========================================
echo   Serveur demarre avec succes!
echo ========================================
echo.
echo   Ouvrez votre navigateur a:
echo   http://localhost:5000
echo.
echo   IMPORTANT: Si vous ne voyez pas la page
echo   de choix connexion/inscription, appuyez sur:
echo   CTRL + SHIFT + R (pour vider le cache)
echo.
echo   Comptes de test:
echo   - Client: client@test.fr / client123
echo   - Admin: admin@elegance-coiffure.fr / admin123
echo.
echo   Appuyez sur Ctrl+C pour arreter
echo ========================================
echo.

cd /d "%~dp0"

:: Lancer le serveur backend en arriere-plan
start "Backend" cmd /c "cd salon_backend && call venv\Scripts\activate && python -m flask --app src/main.py run --host=0.0.0.0"

:: Lancer le serveur frontend
start "Frontend" cmd /c "cd salon-booking && npm run dev"

pause

