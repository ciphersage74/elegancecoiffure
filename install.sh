#!/bin/bash

# Script d'installation automatique - Élégance Coiffure
# Version 1.0.0

set -e  # Arrêter en cas d'erreur

echo "======================================"
echo "Installation - Élégance Coiffure"
echo "Système de Réservation de Salon"
echo "======================================"
echo ""

# Couleurs pour les messages
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

error() {
    echo -e "${RED}[ERREUR]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[ATTENTION]${NC} $1"
}

# Vérifier si le script est exécuté en tant que root
if [ "$EUID" -eq 0 ]; then 
    warning "Ne pas exécuter ce script en tant que root"
    exit 1
fi

# Détection de la distribution Linux
info "Détection de la distribution Linux..."
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$NAME
    VER=$VERSION_ID
    success "Distribution détectée: $OS $VER"
else
    error "Impossible de détecter la distribution Linux"
    exit 1
fi

# Vérifier les prérequis
info "Vérification des prérequis..."

# Vérifier Python 3.11
if ! command -v python3.11 &> /dev/null; then
    warning "Python 3.11 n'est pas installé"
    info "Installation de Python 3.11..."
    
    if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
        sudo apt update
        sudo apt install -y software-properties-common
        sudo add-apt-repository -y ppa:deadsnakes/ppa
        sudo apt update
        sudo apt install -y python3.11 python3.11-venv python3.11-dev
    elif [[ "$OS" == *"Fedora"* ]] || [[ "$OS" == *"Red Hat"* ]]; then
        sudo dnf install -y python3.11
    else
        error "Distribution non supportée pour l'installation automatique de Python 3.11"
        exit 1
    fi
    
    success "Python 3.11 installé"
else
    success "Python 3.11 est déjà installé"
fi

# Vérifier pip
if ! command -v pip3 &> /dev/null; then
    info "Installation de pip..."
    sudo apt install -y python3-pip
    success "pip installé"
else
    success "pip est déjà installé"
fi

# Vérifier Node.js
if ! command -v node &> /dev/null; then
    warning "Node.js n'est pas installé"
    info "Installation de Node.js 22..."
    
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt install -y nodejs
    
    success "Node.js installé"
else
    NODE_VERSION=$(node -v)
    success "Node.js est déjà installé: $NODE_VERSION"
fi

# Vérifier npm
if ! command -v npm &> /dev/null; then
    error "npm n'est pas installé"
    exit 1
else
    success "npm est installé"
fi

echo ""
info "Tous les prérequis sont satisfaits"
echo ""

# Installation du backend
info "Installation du backend Flask..."
cd salon_backend

info "Installation des dépendances Python..."
pip3 install flask flask-cors flask-jwt-extended flask-sqlalchemy sqlalchemy

success "Dépendances backend installées"

# Initialisation de la base de données
info "Initialisation de la base de données..."
if [ -f "database.db" ]; then
    warning "La base de données existe déjà, elle sera conservée"
else
    python3.11 src/main.py &
    BACKEND_PID=$!
    sleep 3
    kill $BACKEND_PID 2>/dev/null || true
    success "Base de données initialisée"
fi

cd ..

# Installation du frontend
info "Installation du frontend React..."
cd salon-booking

info "Installation des dépendances npm (cela peut prendre quelques minutes)..."
npm install

success "Dépendances frontend installées"

info "Build du frontend..."
npm run build

success "Frontend compilé"

cd ..

# Copier le build dans le backend
info "Déploiement du frontend dans le backend..."
rm -rf salon_backend/static
cp -r salon-booking/dist salon_backend/static

success "Frontend déployé"

echo ""
echo "======================================"
echo -e "${GREEN}Installation terminée avec succès !${NC}"
echo "======================================"
echo ""
echo "Pour démarrer l'application:"
echo ""
echo "  cd salon_backend"
echo "  python3.11 src/main.py"
echo ""
echo "Puis ouvrez votre navigateur à l'adresse:"
echo "  http://localhost:5000"
echo ""
echo "Comptes de test:"
echo ""
echo "  Client:"
echo "    Email: client@test.fr"
echo "    Mot de passe: client123"
echo ""
echo "  Admin:"
echo "    Email: admin@elegance-coiffure.fr"
echo "    Mot de passe: admin123"
echo ""
echo "======================================"
