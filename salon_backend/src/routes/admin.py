import os
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, date, timedelta
from src.models.models import db, User, Employee, Service, Appointment, BusinessHours, EmployeeHours, ClosedDate, Gallery, employee_services, EmployeeAvailability
from datetime import time
from werkzeug.utils import secure_filename
from src.cache import cache

admin_bp = Blueprint('admin', __name__)

def is_admin():
    """Vérifier si l'utilisateur est admin"""
    user_id = get_jwt_identity()
    # Convertir l'ID de string en integer car JWT retourne un string
    user = User.query.get(int(user_id))
    return user and user.role == 'admin'

# ===== GESTION DES SERVICES =====

@admin_bp.route('/services', methods=['GET'])
@jwt_required()
def get_all_services():
    """Récupérer tous les services (admin)"""
    if not is_admin():
        return jsonify({'error': 'Accès non autorisé'}), 403
    
    try:
        services = Service.query.all()
        return jsonify([service.to_dict() for service in services]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/services', methods=['POST'])
@jwt_required()
def create_service():
    """Créer un nouveau service"""
    if not is_admin():
        return jsonify({'error': 'Accès non autorisé'}), 403
    
    try:
        data = request.get_json()
        
        service = Service(
            name=data['name'],
            description=data.get('description'),
            duration=data['duration'],
            price=data['price'],
            category=data.get('category'),
            image_url=data.get('image_url'),
            is_active=data.get('is_active', True)
        )
        
        db.session.add(service)
        db.session.commit()
        
        return jsonify({
            'message': 'Service créé',
            'service': service.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/services/<int:service_id>', methods=['PUT'])
@jwt_required()
def update_service(service_id):
    """Mettre à jour un service"""
    if not is_admin():
        return jsonify({'error': 'Accès non autorisé'}), 403
    
    try:
        service = Service.query.get(service_id)
        if not service:
            return jsonify({'error': 'Service non trouvé'}), 404
        
        data = request.get_json()
        
        if 'name' in data:
            service.name = data['name']
        if 'description' in data:
            service.description = data['description']
        if 'duration' in data:
            service.duration = data['duration']
        if 'price' in data:
            service.price = data['price']
        if 'category' in data:
            service.category = data['category']
        if 'image_url' in data:
            service.image_url = data['image_url']
        if 'is_active' in data:
            service.is_active = data['is_active']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Service mis à jour',
            'service': service.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/services/<int:service_id>', methods=['DELETE'])
@jwt_required()
def delete_service(service_id):
    """Supprimer un service"""
    if not is_admin():
        return jsonify({'error': 'Accès non autorisé'}), 403
    
    try:
        service = Service.query.get(service_id)
        if not service:
            return jsonify({'error': 'Service non trouvé'}), 404
        
        db.session.delete(service)
        db.session.commit()
        
        return jsonify({'message': 'Service supprimé'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ===== GESTION DES CLIENTS =====

@admin_bp.route('/clients', methods=['GET'])
@jwt_required()
def get_all_clients():
    """Récupérer tous les clients (admin)"""
    if not is_admin():
        return jsonify({'error': 'Accès non autorisé'}), 403
    
    try:
        clients = User.query.filter_by(role='client').all()
        return jsonify([client.to_dict() for client in clients]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/clients', methods=['POST'])
@jwt_required()
def create_client():
    """Créer un nouveau client"""
    if not is_admin():
        return jsonify({'error': 'Accès non autorisé'}), 403
    
    try:
        data = request.get_json()
        
        # Vérifier si l'email existe déjà
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Un utilisateur avec cet email existe déjà'}), 400

        user = User(
            email=data['email'],
            first_name=data['first_name'],
            last_name=data['last_name'],
            phone=data.get('phone'),
            role='client'
        )
        user.set_password(data.get('password', 'password123')) # Mot de passe par défaut si non fourni
        
        db.session.add(user)
        db.session.commit()
        
        return jsonify({
            'message': 'Client créé avec succès',
            'client': user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/clients/<int:client_id>', methods=['PUT'])
@jwt_required()
def update_client(client_id):
    """Mettre à jour un client"""
    if not is_admin():
        return jsonify({'error': 'Accès non autorisé'}), 403
    
    try:
        client = User.query.filter_by(id=client_id, role='client').first()
        if not client:
            return jsonify({'error': 'Client non trouvé'}), 404
        
        data = request.get_json()
        
        if 'first_name' in data:
            client.first_name = data['first_name']
        if 'last_name' in data:
            client.last_name = data['last_name']
        if 'email' in data:
            # Vérifier si le nouvel email est déjà pris par un autre utilisateur
            if User.query.filter(User.email == data['email'], User.id != client_id).first():
                return jsonify({'error': 'Cet email est déjà utilisé par un autre utilisateur'}), 400
            client.email = data['email']
        if 'phone' in data:
            client.phone = data['phone']
        if 'password' in data and data['password']:
            client.set_password(data['password'])
        
        db.session.commit()
        
        return jsonify({
            'message': 'Client mis à jour avec succès',
            'client': client.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/clients/<int:client_id>', methods=['DELETE'])
@jwt_required()
def delete_client(client_id):
    """Supprimer un client"""
    if not is_admin():
        return jsonify({'error': 'Accès non autorisé'}), 403
    
    try:
        client = User.query.filter_by(id=client_id, role='client').first()
        if not client:
            return jsonify({'error': 'Client non trouvé'}), 404
        
        db.session.delete(client)
        db.session.commit()
        
        return jsonify({'message': 'Client supprimé avec succès'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ===== GESTION DES EMPLOYÉS =====

@admin_bp.route('/employees', methods=['GET'])
@jwt_required()
def get_all_employees():
    """Récupérer tous les employés (admin)"""
    if not is_admin():
        return jsonify({'error': 'Accès non autorisé'}), 403
    
    try:
        employees = Employee.query.all()
        return jsonify([emp.to_dict() for emp in employees]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/employees', methods=['POST'])
@jwt_required()
def create_employee():
    """Créer un nouvel employé"""
    if not is_admin():
        return jsonify({'error': 'Accès non autorisé'}), 403
    
    try:
        data = request.get_json()
        
        # Créer l'utilisateur
        user = User(
            email=data['email'],
            first_name=data['first_name'],
            last_name=data['last_name'],
            phone=data.get('phone'),
            role='employee'
        )
        user.set_password(data.get('password', 'password123'))
        
        db.session.add(user)
        db.session.flush()
        
        # Créer le profil employé
        employee = Employee(
            user_id=user.id,
            photo_url=data.get('photo_url'),
            bio=data.get('bio'),
            specialties=data.get('specialties'),
            position=data.get('position'),
            years_experience=data.get('years_experience', 0),
            is_active=data.get('is_active', True)
        )
        
        db.session.add(employee)
        db.session.flush()
        
        # Assigner les services
        if 'service_ids' in data:
            for service_id in data['service_ids']:
                service = Service.query.get(service_id)
                if service:
                    employee.services.append(service)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Employé créé',
            'employee': employee.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/employees/<int:employee_id>', methods=['PUT'])
@jwt_required()
def update_employee(employee_id):
    """Mettre à jour un employé"""
    if not is_admin():
        return jsonify({'error': 'Accès non autorisé'}), 403
    
    try:
        employee = Employee.query.get(employee_id)
        if not employee:
            return jsonify({'error': 'Employé non trouvé'}), 404
        
        data = request.get_json()
        
        # Mettre à jour l'utilisateur
        if employee.user:
            if 'first_name' in data:
                employee.user.first_name = data['first_name']
            if 'last_name' in data:
                employee.user.last_name = data['last_name']
            if 'email' in data:
                employee.user.email = data['email']
            if 'phone' in data:
                employee.user.phone = data['phone']
        
        # Mettre à jour le profil employé
        if 'photo_url' in data:
            employee.photo_url = data['photo_url']
        if 'bio' in data:
            employee.bio = data['bio']
        if 'specialties' in data:
            employee.specialties = data['specialties']
        if 'position' in data:
            employee.position = data['position']
        if 'years_experience' in data:
            employee.years_experience = data['years_experience']
        if 'is_active' in data:
            employee.is_active = data['is_active']
        
        # Mettre à jour les services
        if 'service_ids' in data:
            employee.services = []
            for service_id in data['service_ids']:
                service = Service.query.get(service_id)
                if service:
                    employee.services.append(service)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Employé mis à jour',
            'employee': employee.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/employees/<int:employee_id>', methods=['DELETE'])
@jwt_required()
def delete_employee(employee_id):
    """Supprimer un employé"""
    if not is_admin():
        return jsonify({'error': 'Accès non autorisé'}), 403
    
    try:
        employee = Employee.query.get(employee_id)
        if not employee:
            return jsonify({'error': 'Employé non trouvé'}), 404
        
        # Supprimer l'utilisateur associé
        if employee.user:
            db.session.delete(employee.user)
        
        db.session.delete(employee)
        db.session.commit()
        
        return jsonify({'message': 'Employé supprimé'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ===== GESTION DES RENDEZ-VOUS =====

@admin_bp.route('/employees/<int:employee_id>/hours', methods=['GET'])
@jwt_required()
def get_employee_working_hours(employee_id):
    """Récupérer les heures de travail d'un employé spécifique"""
    if not is_admin():
        return jsonify({'error': 'Accès non autorisé'}), 403
    
    try:
        employee = Employee.query.get(employee_id)
        if not employee:
            return jsonify({'error': 'Employé non trouvé'}), 404
        
        hours = EmployeeHours.query.filter_by(employee_id=employee_id).order_by(EmployeeHours.day_of_week).all()
        return jsonify([h.to_dict() for h in hours]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/employees/<int:employee_id>/hours', methods=['PUT'])
@jwt_required()
def update_employee_working_hours(employee_id):
    """Mettre à jour les heures de travail d'un employé spécifique"""
    if not is_admin():
        return jsonify({'error': 'Accès non autorisé'}), 403
    
    try:
        employee = Employee.query.get(employee_id)
        if not employee:
            return jsonify({'error': 'Employé non trouvé'}), 404
        
        data = request.get_json()
        
        # Supprimer les horaires existants pour cet employé
        EmployeeHours.query.filter_by(employee_id=employee_id).delete()
        
        new_hours = []
        for hour_data in data:
            day_of_week = hour_data.get('day_of_week')
            start_time_str = hour_data.get('start_time')
            end_time_str = hour_data.get('end_time')

            # Si les heures sont vides ou nulles, on considère que l'employé ne travaille pas ce jour-là
            if not start_time_str or not end_time_str:
                continue
            
            try:
                start_time = time.fromisoformat(start_time_str)
                end_time = time.fromisoformat(end_time_str)
            except (ValueError, TypeError):
                # Gérer le cas où les chaînes sont vides ou nulles après la première vérification
                continue
            
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

@admin_bp.route('/appointments', methods=['GET'])
@jwt_required()
def get_all_appointments():
    """Récupérer tous les rendez-vous (admin)"""
    if not is_admin():
        return jsonify({'error': 'Accès non autorisé'}), 403
    
    try:
        # Filtres optionnels
        date_str = request.args.get('date')
        employee_id = request.args.get('employee_id', type=int)
        status = request.args.get('status')
        
        query = Appointment.query
        
        if date_str:
            target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            query = query.filter_by(appointment_date=target_date)
        
        if employee_id:
            query = query.filter_by(employee_id=employee_id)
        
        if status:
            query = query.filter_by(status=status)
        
        appointments = query.order_by(Appointment.appointment_date.desc(), Appointment.start_time.desc()).all()
        
        return jsonify([apt.to_dict() for apt in appointments]), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/appointments/<int:appointment_id>/status', methods=['PUT'])
@jwt_required()
def update_appointment_status(appointment_id):
    """Mettre à jour le statut d'un rendez-vous"""
    if not is_admin():
        return jsonify({'error': 'Accès non autorisé'}), 403
    
    try:
        appointment = Appointment.query.get(appointment_id)
        if not appointment:
            return jsonify({'error': 'Rendez-vous non trouvé'}), 404
        
        data = request.get_json()
        
        if 'status' in data:
            appointment.status = data['status']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Statut mis à jour',
            'appointment': appointment.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/employee-appointments/<int:employee_id>', methods=['GET'])
@jwt_required()
def get_employee_appointments(employee_id):
    """Récupérer les rendez-vous d'un employé pour une période donnée (admin)"""
    if not is_admin():
        return jsonify({'error': 'Accès non autorisé'}), 403

    try:
        start_date_str = request.args.get('start_date')
        end_date_str = request.args.get('end_date')

        if not start_date_str or not end_date_str:
            return jsonify({'error': 'Les dates de début et de fin sont requises'}), 400

        start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
        end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()

        appointments = Appointment.query.filter(
            Appointment.employee_id == employee_id,
            Appointment.appointment_date >= start_date,
            Appointment.appointment_date <= end_date
        ).order_by(Appointment.appointment_date, Appointment.start_time).all()

        return jsonify([apt.to_dict() for apt in appointments]), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/appointments', methods=['POST'])
@jwt_required()
def admin_create_appointment():
    """Créer un nouveau rendez-vous depuis le panneau admin"""
    if not is_admin():
        return jsonify({'error': 'Accès non autorisé'}), 403
    
    try:
        data = request.get_json()
        
        # Vérifier que le client existe
        client = User.query.get(data.get('client_id'))
        if not client or client.role != 'client':
            return jsonify({'error': 'Client non trouvé ou rôle incorrect'}), 404

        # Vérifier que le service existe
        service = Service.query.get(data.get('service_id'))
        if not service:
            return jsonify({'error': 'Service non trouvé'}), 404
        
        # Vérifier que l'employé existe
        employee = Employee.query.get(data.get('employee_id'))
        if not employee:
            return jsonify({'error': 'Employé non trouvé'}), 404
        
        # Parser la date et l'heure
        appointment_date = datetime.strptime(data['appointment_date'], '%Y-%m-%d').date()
        start_time = datetime.strptime(data['start_time'], '%H:%M').time()
        
        # Calculer l'heure de fin
        start_datetime = datetime.combine(appointment_date, start_time)
        end_datetime = start_datetime + timedelta(minutes=service.duration)
        end_time = end_datetime.time()
        
        # Vérifier les conflits de rendez-vous
        conflicts = Appointment.query.filter(
            Appointment.employee_id == data['employee_id'],
            Appointment.appointment_date == appointment_date,
            Appointment.status.in_(['pending', 'confirmed']),
            db.or_(
                db.and_(Appointment.start_time <= start_time, Appointment.end_time > start_time),
                db.and_(Appointment.start_time < end_time, Appointment.end_time >= end_time),
                db.and_(Appointment.start_time >= start_time, Appointment.end_time <= end_time)
            )
        ).first()
        
        if conflicts:
            return jsonify({'error': 'Ce créneau n\'est pas disponible pour cet employé'}), 400
        
        # Créer le rendez-vous
        appointment = Appointment(
            client_id=data['client_id'],
            employee_id=data['employee_id'],
            service_id=data['service_id'],
            appointment_date=appointment_date,
            start_time=start_time,
            end_time=end_time,
            status=data.get('status', 'confirmed'), # Par défaut confirmé pour l'admin
            notes=data.get('notes')
        )
        
        db.session.add(appointment)
        db.session.commit()
        
        return jsonify({
            'message': 'Rendez-vous créé avec succès',
            'appointment': appointment.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/appointments/<int:appointment_id>', methods=['DELETE'])
@jwt_required()
def delete_appointment(appointment_id):
    """Supprimer un rendez-vous (admin)"""
    if not is_admin():
        return jsonify({'error': 'Accès non autorisé'}), 403
    
    try:
        appointment = Appointment.query.get(appointment_id)
        if not appointment:
            return jsonify({'error': 'Rendez-vous non trouvé'}), 404
        
        db.session.delete(appointment)
        db.session.commit()
        
        return jsonify({'message': 'Rendez-vous supprimé avec succès'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ===== GESTION DES HORAIRES =====

@admin_bp.route('/business-hours', methods=['GET'])
@jwt_required()
def get_business_hours():
    """Récupérer les horaires d'ouverture"""
    if not is_admin():
        return jsonify({'error': 'Accès non autorisé'}), 403
    
    try:
        hours = BusinessHours.query.order_by(BusinessHours.day_of_week).all()
        return jsonify([h.to_dict() for h in hours]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/business-hours', methods=['PUT'])
@jwt_required()
def update_business_hours():
    """Mettre à jour les horaires d'ouverture"""
    if not is_admin():
        return jsonify({'error': 'Accès non autorisé'}), 403
    
    try:
        data = request.get_json()
        
        for day_data in data.get('hours', []):
            day_of_week = day_data['day_of_week']
            hours = BusinessHours.query.filter_by(day_of_week=day_of_week).first()
            
            if not hours:
                hours = BusinessHours(day_of_week=day_of_week)
                db.session.add(hours)
            
            if 'open_time' in day_data:
                hours.open_time = datetime.strptime(day_data['open_time'], '%H:%M').time() if day_data['open_time'] else None
            if 'close_time' in day_data:
                hours.close_time = datetime.strptime(day_data['close_time'], '%H:%M').time() if day_data['close_time'] else None
            if 'is_closed' in day_data:
                hours.is_closed = day_data['is_closed']
        
        db.session.commit()
        
        return jsonify({'message': 'Horaires mis à jour'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/closed-dates', methods=['GET'])
@jwt_required()
def get_closed_dates():
    """Récupérer les dates de fermeture"""
    if not is_admin():
        return jsonify({'error': 'Accès non autorisé'}), 403
    
    try:
        closed_dates = ClosedDate.query.order_by(ClosedDate.date).all()
        return jsonify([cd.to_dict() for cd in closed_dates]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/closed-dates', methods=['POST'])
@jwt_required()
def add_closed_date():
    """Ajouter une date de fermeture"""
    if not is_admin():
        return jsonify({'error': 'Accès non autorisé'}), 403
    
    try:
        data = request.get_json()
        
        closed_date = ClosedDate(
            date=datetime.strptime(data['date'], '%Y-%m-%d').date(),
            reason=data.get('reason')
        )
        
        db.session.add(closed_date)
        db.session.commit()
        
        return jsonify({
            'message': 'Date de fermeture ajoutée',
            'closed_date': closed_date.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/closed-dates/<int:closed_date_id>', methods=['DELETE'])
@jwt_required()
def delete_closed_date(closed_date_id):
    """Supprimer une date de fermeture"""
    if not is_admin():
        return jsonify({'error': 'Accès non autorisé'}), 403
    
    try:
        closed_date = ClosedDate.query.get(closed_date_id)
        if not closed_date:
            return jsonify({'error': 'Date non trouvée'}), 404
        
        db.session.delete(closed_date)
        db.session.commit()
        
        return jsonify({'message': 'Date de fermeture supprimée'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ===== STATISTIQUES =====

@admin_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_stats():
    """Récupérer les statistiques du salon"""
    if not is_admin():
        return jsonify({'error': 'Accès non autorisé'}), 403
    
    try:
        today = date.today()
        
        # Rendez-vous du jour
        today_appointments = Appointment.query.filter_by(appointment_date=today).count()
        
        # Rendez-vous du mois
        first_day_month = today.replace(day=1)
        month_appointments = Appointment.query.filter(
            Appointment.appointment_date >= first_day_month,
            Appointment.appointment_date <= today
        ).count()
        
        # Revenus du mois (estimation)
        month_revenue_query = db.session.query(db.func.sum(Service.price)).join(Appointment).filter(
            Appointment.appointment_date >= first_day_month,
            Appointment.appointment_date <= today,
            Appointment.status.in_(['confirmed', 'completed'])
        ).scalar()
        
        month_revenue = float(month_revenue_query) if month_revenue_query else 0
        
        # Nombre total de clients
        total_clients = User.query.filter_by(role='client').count()
        
        # Taux d'occupation (simplifié)
        total_slots = 50  # Exemple
        occupied_slots = today_appointments
        occupation_rate = (occupied_slots / total_slots * 100) if total_slots > 0 else 0
        
        return jsonify({
            'today_appointments': today_appointments,
            'month_appointments': month_appointments,
            'month_revenue': month_revenue,
            'total_clients': total_clients,
            'occupation_rate': round(occupation_rate, 2)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ===== GESTION DE LA GALERIE =====

@admin_bp.route('/gallery', methods=['GET'])
@jwt_required()
def get_gallery_images():
    """Récupérer toutes les images de la galerie (admin)"""
    if not is_admin():
        return jsonify({'error': 'Accès non autorisé'}), 403
    
    try:
        images = Gallery.query.order_by(Gallery.display_order).all()
        return jsonify([image.to_dict() for image in images]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/gallery', methods=['POST'])
@jwt_required()
def add_gallery_image():
    """Ajouter une image à la galerie"""
    if not is_admin():
        return jsonify({'error': 'Accès non autorisé'}), 403
    
    try:
        data = request.get_json()
        
        gallery_item = Gallery(
            image_url=data['image_url'],
            title=data.get('title'),
            display_order=data.get('display_order', 0)
        )
        
        db.session.add(gallery_item)
        db.session.commit()
        
        return jsonify({
            'message': 'Image ajoutée',
            'gallery_item': gallery_item.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/gallery/<int:gallery_id>', methods=['DELETE'])
@jwt_required()
def delete_gallery_image(gallery_id):
    """Supprimer une image de la galerie"""
    if not is_admin():
        return jsonify({'error': 'Accès non autorisé'}), 403
    
    try:
        print(f"Tentative de suppression de l'image de la galerie avec l'ID : {gallery_id}")
        gallery_item = Gallery.query.get(gallery_id)
        if not gallery_item:
            print(f"Image de la galerie avec l'ID {gallery_id} non trouvée.")
            return jsonify({'error': 'Image non trouvée'}), 404
        
        db.session.delete(gallery_item)
        db.session.commit()
        
        return jsonify({'message': 'Image supprimée'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/gallery/upload', methods=['POST'])
@jwt_required()
def upload_gallery_photo():
    """Téléverser une photo pour la galerie"""
    if not is_admin():
        return jsonify({'error': 'Accès non autorisé'}), 403

    if 'photo' not in request.files:
        return jsonify({'error': 'Aucun fichier photo trouvé'}), 400

    file = request.files['photo']
    title = request.form.get('title', '')

    if file.filename == '':
        return jsonify({'error': 'Aucun fichier sélectionné'}), 400

    if file:
        filename = secure_filename(f"gallery_{datetime.now().timestamp()}.{file.filename.rsplit('.', 1)[1].lower()}")
        upload_folder = os.path.join(current_app.config['UPLOAD_FOLDER'], 'gallery')
        
        if not os.path.exists(upload_folder):
            os.makedirs(upload_folder)
            
        file_path = os.path.join(upload_folder, filename)
        file.save(file_path)
        
        # Créer l'URL relative
        image_url = f"/uploads/gallery/{filename}"

        # Ajouter à la base de données
        new_image = Gallery(
            image_url=image_url,
            title=title
        )
        db.session.add(new_image)
        db.session.commit()

        return jsonify({
            'message': 'Image téléversée avec succès',
            'gallery_item': new_image.to_dict()
        }), 201

    return jsonify({'error': 'Une erreur est survenue lors du téléversement'}), 500


# ===== GESTION DES INFORMATIONS DU SALON =====

@admin_bp.route('/salon-info', methods=['PUT'])
@jwt_required()
def update_salon_info():
    """Mettre à jour les informations du salon"""
    if not is_admin():
        return jsonify({'error': 'Accès non autorisé'}), 403
    
    try:
        from src.models.models import SalonInfo
        
        data = request.get_json()
        
        # Récupérer ou créer les informations du salon
        salon_info = SalonInfo.query.first()
        if not salon_info:
            salon_info = SalonInfo()
            db.session.add(salon_info)
        
        # Mettre à jour les champs
        allowed_fields = [
            'name',
            'description',
            'address',
            'city',
            'postal_code',
            'country',
            'phone',
            'email',
            'website',
            'facebook_url',
            'instagram_url',
            'booking_advance_days',
            'booking_cancel_hours',
            'slot_duration',
            'logo_url'
        ]

        for field in allowed_fields:
            if field in data and hasattr(salon_info, field):
                value = data[field]
                if field in {'booking_advance_days', 'booking_cancel_hours', 'slot_duration'}:
                    try:
                        value = int(value) if value is not None else None
                    except (TypeError, ValueError):
                        continue

                setattr(salon_info, field, value)

        db.session.commit()

        # Invalider le cache pour refléter les dernières informations côté public
        cache.clear()

        return jsonify({
            'message': 'Informations mises à jour',
            'salon_info': salon_info.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ===== GESTION DE LA DISPONIBILITÉ DES EMPLOYÉS =====

@admin_bp.route('/employees/<int:employee_id>/availability', methods=['POST'])
@jwt_required()
def add_employee_availability(employee_id):
    """Ajouter une période d'indisponibilité pour un employé"""
    if not is_admin():
        return jsonify({'error': 'Accès non autorisé'}), 403
    try:
        employee = Employee.query.get(employee_id)
        if not employee:
            return jsonify({'error': 'Employé non trouvé'}), 404
        
        data = request.json
        required_fields = ['date', 'is_available']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Les champs date et is_available sont requis'}), 400

        try:
            availability_date = date.fromisoformat(data['date'])
        except ValueError:
            return jsonify({'error': 'Format de date invalide. Utilisez YYYY-MM-DD'}), 400

        start_time = time.fromisoformat(data['start_time']) if data.get('start_time') else None
        end_time = time.fromisoformat(data['end_time']) if data.get('end_time') else None

        new_availability = EmployeeAvailability(
            employee_id=employee_id,
            date=availability_date,
            start_time=start_time,
            end_time=end_time,
            is_available=data['is_available'],
            reason=data.get('reason')
        )
        
        db.session.add(new_availability)
        db.session.commit()
        
        return jsonify(new_availability.to_dict()), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/employees/<int:employee_id>/availability', methods=['GET'])
@jwt_required()
def get_employee_availability(employee_id):
    """Récupérer les périodes d'indisponibilité d'un employé"""
    if not is_admin():
        return jsonify({'error': 'Accès non autorisé'}), 403
    try:
        employee = Employee.query.get(employee_id)
        if not employee:
            return jsonify({'error': 'Employé non trouvé'}), 404
        
        availabilities = EmployeeAvailability.query.filter_by(employee_id=employee_id).all()
        return jsonify([a.to_dict() for a in availabilities]), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/availability/<int:availability_id>', methods=['DELETE'])
@jwt_required()
def delete_employee_availability(availability_id):
    """Supprimer une période d'indisponibilité"""
    if not is_admin():
        return jsonify({'error': 'Accès non autorisé'}), 403
    try:
        availability = EmployeeAvailability.query.get(availability_id)
        if not availability:
            return jsonify({'error': 'Période d\'indisponibilité non trouvée'}), 404
        
        db.session.delete(availability)
        db.session.commit()
        
        return jsonify({'message': 'Période d\'indisponibilité supprimée avec succès'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

