from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.models.models import db, SalonInfo, Gallery, BusinessHours, User
from src.cache import cache

salon_bp = Blueprint('salon', __name__)

@salon_bp.route('/info', methods=['GET'])
@cache.cached(timeout=3600) # Cache pendant 1 heure
def get_salon_info():
    """Récupérer les informations du salon"""
    try:
        salon_info = SalonInfo.query.first()
        if not salon_info:
            return jsonify({'error': 'Informations non trouvées'}), 404
        return jsonify(salon_info.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@salon_bp.route('/info', methods=['PUT'])
@jwt_required()
def update_salon_info():
    """Mettre à jour les informations du salon (admin seulement)"""
    try:
        user_id = get_jwt_identity()
        # Convertir l'ID de string en integer car JWT retourne un string
        user = User.query.get(int(user_id))
        
        if not user or user.role != 'admin':
            return jsonify({'error': 'Accès non autorisé'}), 403
        
        salon_info = SalonInfo.query.first()
        if not salon_info:
            salon_info = SalonInfo()
            db.session.add(salon_info)
        
        data = request.get_json()
        
        if 'name' in data:
            salon_info.name = data['name']
        if 'description' in data:
            salon_info.description = data['description']
        if 'address' in data:
            salon_info.address = data['address']
        if 'phone' in data:
            salon_info.phone = data['phone']
        if 'email' in data:
            salon_info.email = data['email']
        if 'logo_url' in data:
            salon_info.logo_url = data['logo_url']
        if 'cancellation_policy' in data:
            salon_info.cancellation_policy = data['cancellation_policy']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Informations mises à jour',
            'salon_info': salon_info.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@salon_bp.route('/gallery', methods=['GET'])
@cache.cached(timeout=600) # Cache pendant 10 minutes
def get_gallery():
    """Récupérer la galerie du salon"""
    try:
        gallery_items = Gallery.query.order_by(Gallery.display_order).all()
        return jsonify([item.to_dict() for item in gallery_items]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@salon_bp.route('/hours', methods=['GET'])
@cache.cached(timeout=3600) # Cache pendant 1 heure
def get_hours():
    """Récupérer les horaires d'ouverture du salon"""
    try:
        hours = BusinessHours.query.order_by(BusinessHours.day_of_week).all()
        return jsonify([h.to_dict() for h in hours]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

