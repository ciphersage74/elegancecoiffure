import os
import sys
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from src.cache import cache
from src.models.models import db
from src.routes.auth import auth_bp
from src.routes.services import services_bp
from src.routes.employees import employees_bp
from src.routes.appointments import appointments_bp
from src.routes.admin import admin_bp
from src.routes.salon import salon_bp
from src.routes.booking_page import booking_page_bp

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(os.path.dirname(__file__)), 'static'), static_url_path='/')
app.config['SECRET_KEY'] = 'salon-coiffure-secret-key-2025'
app.config['JWT_SECRET_KEY'] = 'jwt-salon-secret-key-2025'
app.config['JWT_TOKEN_LOCATION'] = ['headers']
app.config['JWT_HEADER_NAME'] = 'Authorization'
app.config['JWT_HEADER_TYPE'] = 'Bearer'
app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'static', 'uploads')

# Configuration CORS
CORS(app, resources={r"/api/*": {"origins": "*", "allow_headers": ["Content-Type", "Authorization"]}})

# Configuration JWT
jwt = JWTManager(app)

# Configuration du cache
cache.init_app(app, config={'CACHE_TYPE': 'SimpleCache'})

# Enregistrement des blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(services_bp, url_prefix='/api/services')
app.register_blueprint(employees_bp, url_prefix='/api/employees')
app.register_blueprint(appointments_bp, url_prefix='/api/appointments')
app.register_blueprint(admin_bp, url_prefix='/api/admin')
app.register_blueprint(salon_bp, url_prefix='/api/salon')
app.register_blueprint(booking_page_bp, url_prefix='/api')

# Configuration de la base de données
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'database', 'app.db')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

# Initialisation de la base de données
with app.app_context():
    # Créer le dossier database s'il n'existe pas
    db_folder = os.path.join(os.path.dirname(__file__), 'database')
    os.makedirs(db_folder, exist_ok=True)
    
    # Vérifier si la base de données existe déjà
    db_path = os.path.join(db_folder, 'app.db')
    db_exists = os.path.exists(db_path)
    
    if not db_exists:
        # Créer la base de données seulement si elle n'existe pas
        print("Création de la base de données...")
        db.create_all()
        
        # Import des données de démonstration
        from src.utils.seed_data import seed_database
        seed_database(db)
        print("Base de données initialisée avec succès!")
    else:
        # La base existe déjà, ne rien faire
        print("Base de données existante chargée.")
        # S'assurer que toutes les tables existent (pour les migrations)
        db.create_all()

from flask import current_app

@app.route('/uploads/<path:filename>')
def uploaded_files(filename):
    return send_from_directory(current_app.config['UPLOAD_FOLDER'], filename)

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    # Don't serve static files for API routes
    if path.startswith('api/'):
        return "Not found", 404
    
    static_folder_path = app.static_folder
    if static_folder_path is None:
        return "Static folder not configured", 404

    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    else:
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(static_folder_path, 'index.html')
        else:
            return "index.html not found", 404

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

