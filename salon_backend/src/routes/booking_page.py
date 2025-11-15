from flask import Blueprint, render_template_string, jsonify
from src.models.models import Service, Employee, User

booking_page_bp = Blueprint('booking_page', __name__)

@booking_page_bp.route('/booking-data')
def get_booking_data():
    """Route pour obtenir toutes les données nécessaires à la réservation en une seule requête"""
    try:
        # Récupérer tous les services
        services = Service.query.filter_by(is_active=True).all()
        services_data = [service.to_dict() for service in services]
        
        # Récupérer tous les employés actifs
        employees = Employee.query.filter_by(is_active=True).all()
        employees_data = []
        for emp in employees:
            user = User.query.get(emp.user_id)
            emp_dict = emp.to_dict()
            if user:
                emp_dict['first_name'] = user.first_name
                emp_dict['last_name'] = user.last_name
            employees_data.append(emp_dict)
        
        return jsonify({
            'services': services_data,
            'employees': employees_data
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

