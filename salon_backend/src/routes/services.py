from flask import Blueprint, request, jsonify
from src.models.models import db, Service
from src.cache import cache

services_bp = Blueprint('services', __name__)

@services_bp.route('/', methods=['GET'])
@cache.cached(timeout=600) # Cache pendant 10 minutes
def get_services():
    """Récupérer tous les services actifs"""
    try:
        services = Service.query.filter_by(is_active=True).all()
        return jsonify([service.to_dict() for service in services]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@services_bp.route('/<int:service_id>', methods=['GET'])
def get_service(service_id):
    """Récupérer un service spécifique"""
    try:
        service = Service.query.get(service_id)
        if not service:
            return jsonify({'error': 'Service non trouvé'}), 404
        return jsonify(service.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@services_bp.route('/categories', methods=['GET'])
@cache.cached(timeout=3600) # Cache pendant 1 heure
def get_categories():
    """Récupérer toutes les catégories de services"""
    try:
        categories = db.session.query(Service.category).filter(Service.category.isnot(None)).distinct().all()
        return jsonify([cat[0] for cat in categories if cat[0]]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

