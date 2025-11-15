from flask import Blueprint, request, jsonify
from src.models.models import db, Employee, EmployeeHours
from datetime import time

employees_bp = Blueprint('employees', __name__)

@employees_bp.route('/', methods=['GET'])
def get_employees():
    """Récupérer tous les employés actifs"""
    try:
        employees = Employee.query.filter_by(is_active=True).options(db.joinedload(Employee.user)).all()
        return jsonify([employee.to_dict() for employee in employees]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@employees_bp.route('/<int:employee_id>', methods=['GET'])
def get_employee(employee_id):
    """Récupérer un employé spécifique"""
    try:
        employee = Employee.query.get(employee_id)
        if not employee:
            return jsonify({'error': 'Employé non trouvé'}), 404
        return jsonify(employee.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@employees_bp.route('/by-service/<int:service_id>', methods=['GET'])
def get_employees_by_service(service_id):
    """Récupérer les employés qui proposent un service spécifique"""
    try:
        from src.models.models import Service
        service = Service.query.get(service_id)
        if not service:
            return jsonify({'error': 'Service non trouvé'}), 404
        
        employees = [emp.to_dict() for emp in service.employees if emp.is_active]
        return jsonify(employees), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@employees_bp.route('/<int:employee_id>/hours', methods=['GET'])
def get_employee_hours(employee_id):
    """Récupérer les horaires de travail d'un employé spécifique"""
    try:
        employee = Employee.query.get(employee_id)
        if not employee:
            return jsonify({'error': 'Employé non trouvé'}), 404
        
        hours = EmployeeHours.query.filter_by(employee_id=employee_id).all()
        return jsonify([h.to_dict() for h in hours]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@employees_bp.route('/<int:employee_id>/hours', methods=['PUT'])
def update_employee_hours(employee_id):
    """Mettre à jour les horaires de travail d'un employé spécifique"""
    try:
        employee = Employee.query.get(employee_id)
        if not employee:
            return jsonify({'error': 'Employé non trouvé'}), 404
        
        data = request.json
        if not isinstance(data, list):
            return jsonify({'error': 'Les données doivent être une liste d\'horaires'}), 400
        
        # Supprimer les horaires existants pour cet employé
        EmployeeHours.query.filter_by(employee_id=employee_id).delete()
        
        new_hours = []
        for hour_data in data:
            day_of_week = hour_data.get('day_of_week')
            start_time_str = hour_data.get('start_time')
            end_time_str = hour_data.get('end_time')

            if day_of_week is None or not start_time_str or not end_time_str:
                return jsonify({'error': 'Chaque horaire doit avoir un jour de la semaine, une heure de début et une heure de fin'}), 400
            
            try:
                start_time = time.fromisoformat(start_time_str)
                end_time = time.fromisoformat(end_time_str)
            except ValueError:
                return jsonify({'error': 'Format d\'heure invalide. Utilisez HH:MM:SS'}), 400
            
            new_hour = EmployeeHours(
                employee_id=employee_id,
                day_of_week=day_of_week,
                start_time=start_time,
                end_time=end_time
            )
            db.session.add(new_hour)
            new_hours.append(new_hour)
            
        db.session.commit()
        return jsonify([h.to_dict() for h in new_hours]), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


