from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, date, time, timedelta
from src.models.models import db, Appointment, User, Employee, Service, BusinessHours, EmployeeHours, ClosedDate, EmployeeAvailability
from sqlalchemy import func

appointments_bp = Blueprint('appointments', __name__)

@appointments_bp.route('/', methods=['POST'])
@jwt_required()
def create_appointment():
    """Créer un nouveau rendez-vous"""
    try:
        user_id = get_jwt_identity()
        # Convertir l'ID de string en integer car JWT retourne un string
        user_id = int(user_id)
        data = request.get_json()
        
        # Vérifier que le service existe
        service = Service.query.get(data.get('service_id'))
        if not service:
            return jsonify({'error': 'Service non trouvé'}), 404
        
        # Vérifier que l'employé existe
        employee = Employee.query.get(data.get('employee_id'))
        if not employee:
            return jsonify({'error': 'Employé non trouvé'}), 404
        
        # Parser la date et l'heure - accepter deux formats
        if 'appointment_date' in data and 'T' in data['appointment_date']:
            # Format combiné: "2025-10-15T14:30"
            datetime_str = data['appointment_date']
            try:
                appointment_datetime = datetime.strptime(datetime_str, '%Y-%m-%dT%H:%M:%S')
            except ValueError:
                appointment_datetime = datetime.strptime(datetime_str, '%Y-%m-%dT%H:%M')
            appointment_date = appointment_datetime.date()
            start_time = appointment_datetime.time()
        elif 'appointment_date' in data and 'start_time' in data:
            # Format séparé
            appointment_date = datetime.strptime(data['appointment_date'], '%Y-%m-%d').date()
            start_time = datetime.strptime(data['start_time'], '%H:%M').time()
        elif 'date' in data and 'time' in data:
            # Format alternatif
            appointment_date = datetime.strptime(data['date'], '%Y-%m-%d').date()
            start_time = datetime.strptime(data['time'], '%H:%M').time()
        else:
            return jsonify({'error': 'Date et heure requises'}), 400
        
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
            return jsonify({'error': 'Ce créneau n\'est pas disponible'}), 400
        
        # Créer le rendez-vous
        appointment = Appointment(
            client_id=int(user_id),
            employee_id=data['employee_id'],
            service_id=data['service_id'],
            appointment_date=appointment_date,
            start_time=start_time,
            end_time=end_time,
            status='pending',
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

@appointments_bp.route('/my', methods=['GET'])
@jwt_required()
def get_my_appointments():
    """Récupérer les rendez-vous de l'utilisateur connecté"""
    try:
        user_id = get_jwt_identity()
        # Convertir l'ID de string en integer car JWT retourne un string
        user_id = int(user_id)
        
        # Filtrer par statut si spécifié
        status = request.args.get('status')
        query = Appointment.query.filter_by(client_id=user_id)
        
        if status:
            query = query.filter_by(status=status)
        
        # Charger les relations client, employee (avec user) et service pour éviter les problèmes N+1
        query = query.options(
            db.joinedload(Appointment.client),
            db.joinedload(Appointment.employee).joinedload(Employee.user),
            db.joinedload(Appointment.service)
        )
        
        # Trier par date décroissante
        appointments = query.order_by(Appointment.appointment_date.desc(), Appointment.start_time.desc()).all()
        
        return jsonify([apt.to_dict() for apt in appointments]), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@appointments_bp.route('/<int:appointment_id>', methods=['GET'])
@jwt_required()
def get_appointment(appointment_id):
    """Récupérer un rendez-vous spécifique"""
    try:
        user_id = get_jwt_identity()
        # Convertir user_id en integer car JWT retourne un string
        user_id = int(user_id)
        appointment = Appointment.query.get(appointment_id)
        
        if not appointment:
            return jsonify({'error': 'Rendez-vous non trouvé'}), 404
        
        # Vérifier que l'utilisateur est le propriétaire
        if appointment.client_id != user_id:
            return jsonify({'error': 'Accès non autorisé'}), 403
        
        return jsonify(appointment.to_dict()), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@appointments_bp.route('/<int:appointment_id>', methods=['PUT'])
@jwt_required()
def update_appointment(appointment_id):
    """Mettre à jour un rendez-vous"""
    try:
        user_id = get_jwt_identity()
        # Convertir user_id en integer car JWT retourne un string
        user_id = int(user_id)
        appointment = Appointment.query.get(appointment_id)
        
        if not appointment:
            return jsonify({'error': 'Rendez-vous non trouvé'}), 404
        
        # Vérifier que l'utilisateur est le propriétaire
        if appointment.client_id != user_id:
            return jsonify({'error': 'Accès non autorisé'}), 403
        
        data = request.get_json()
        
        # Mettre à jour les champs autorisés
        if 'notes' in data:
            appointment.notes = data['notes']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Rendez-vous mis à jour',
            'appointment': appointment.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@appointments_bp.route('/<int:appointment_id>/cancel', methods=['POST'])
@jwt_required()
def cancel_appointment(appointment_id):
    """Annuler un rendez-vous"""
    try:
        user_id = get_jwt_identity()
        # Convertir user_id en integer car JWT retourne un string
        user_id = int(user_id)
        appointment = Appointment.query.get(appointment_id)
        
        if not appointment:
            return jsonify({'error': 'Rendez-vous non trouvé'}), 404
        
        # Vérifier que l'utilisateur est le propriétaire
        if appointment.client_id != user_id:
            return jsonify({'error': 'Accès non autorisé'}), 403
        
        # Vérifier que le rendez-vous n'est pas déjà annulé ou terminé
        if appointment.status in ['cancelled', 'completed']:
            return jsonify({'error': 'Ce rendez-vous ne peut pas être annulé'}), 400
        
        appointment.status = 'cancelled'
        db.session.commit()
        
        return jsonify({
            'message': 'Rendez-vous annulé',
            'appointment': appointment.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500



@appointments_bp.route('/availability', methods=['GET'])
@jwt_required()
def get_appointment_availability():
    """
    Récupérer les créneaux horaires disponibles pour un service, un employé et une date donnés,
    en tenant compte des horaires de travail de l'employé et des rendez-vous existants.
    """
    try:
        service_id = request.args.get('service_id', type=int)
        employee_id = request.args.get('employee_id', type=int)
        date_str = request.args.get('date')

        # Gérer le cas "Peu importe le collaborateur"
        if employee_id == 0: # '0' ou une autre valeur convenue pour "any"
            available_slots = get_all_employees_availability(service_id, date_str)
            return jsonify({'slots': sorted(list(set(available_slots)))}), 200

        if not all([service_id, employee_id, date_str]):
            return jsonify({'error': 'Service, employé et date sont requis'}), 400
        
        appointment_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        day_of_week = appointment_date.weekday() # Lundi est 0, Dimanche est 6
        
        service = Service.query.get(service_id)
        employee = Employee.query.get(employee_id)
        
        if not service:
            return jsonify({'error': 'Service non trouvé'}), 404
        if not employee:
            return jsonify({'error': 'Employé non trouvé'}), 404
            
        # Récupérer les heures de travail de l'employé pour ce jour
        employee_working_hours = EmployeeHours.query.filter_by(
            employee_id=employee_id,
            day_of_week=day_of_week
        ).all()

        if not employee_working_hours:
            return jsonify({'available_slots': []}), 200 # Pas d'heures de travail définies pour ce jour

        # Récupérer les indisponibilités de l'employé pour ce jour
        unavailabilities = EmployeeAvailability.query.filter_by(
            employee_id=employee_id,
            date=appointment_date
        ).all()

        # Récupérer les rendez-vous existants pour cet employé et cette date
        existing_appointments = Appointment.query.filter(
            Appointment.employee_id == employee_id,
            Appointment.appointment_date == appointment_date,
            Appointment.status.in_(['pending', 'confirmed'])
        ).all()

        booked_and_unavailable_slots = []
        for apt in existing_appointments:
            booked_and_unavailable_slots.append({
                'start': datetime.combine(appointment_date, apt.start_time),
                'end': datetime.combine(appointment_date, apt.end_time)
            })
        
        for unav in unavailabilities:
            if unav.start_time and unav.end_time:
                booked_and_unavailable_slots.append({
                    'start': datetime.combine(appointment_date, unav.start_time),
                    'end': datetime.combine(appointment_date, unav.end_time)
                })
            else: # Si pas d'heure de début/fin, c'est toute la journée
                return jsonify({'available_slots': []}), 200

        available_slots = []
        for hours in employee_working_hours:
            start_work = datetime.combine(appointment_date, hours.start_time)
            end_work = datetime.combine(appointment_date, hours.end_time)

            current_slot_start = start_work
            while current_slot_start + timedelta(minutes=service.duration) <= end_work:
                current_slot_end = current_slot_start + timedelta(minutes=service.duration)
                
                is_available = True
                for blocked in booked_and_unavailable_slots:
                    # Vérifier les chevauchements
                    if not (current_slot_end <= blocked['start'] or current_slot_start >= blocked['end']):
                        is_available = False
                        break
                
                if is_available:
                    available_slots.append(current_slot_start.strftime('%H:%M'))
                
                current_slot_start += timedelta(minutes=15)
        
        return jsonify({'slots': sorted(list(set(available_slots)))}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

def get_available_slots_for_employee(service_id, employee_id, appointment_date):
    """
    Calcule les créneaux disponibles pour un employé, un service et une date donnés.
    Refactorisation de la logique de get_appointment_availability.
    """
    day_of_week = appointment_date.weekday()
    service = Service.query.get(service_id)
    
    if not service:
        return []

    # Heures de travail de l'employé
    employee_working_hours = EmployeeHours.query.filter_by(
        employee_id=employee_id, day_of_week=day_of_week
    ).all()
    if not employee_working_hours:
        return []

    # Indisponibilités
    unavailabilities = EmployeeAvailability.query.filter_by(
        employee_id=employee_id, date=appointment_date
    ).all()

    # Rendez-vous existants
    existing_appointments = Appointment.query.filter(
        Appointment.employee_id == employee_id,
        Appointment.appointment_date == appointment_date,
        Appointment.status.in_(['pending', 'confirmed'])
    ).all()

    blocked_slots = []
    for apt in existing_appointments:
        blocked_slots.append({
            'start': datetime.combine(appointment_date, apt.start_time),
            'end': datetime.combine(appointment_date, apt.end_time)
        })
    for unav in unavailabilities:
        if unav.start_time and unav.end_time:
            blocked_slots.append({
                'start': datetime.combine(appointment_date, unav.start_time),
                'end': datetime.combine(appointment_date, unav.end_time)
            })
        else:
            return [] # Indisponible toute la journée

    available_slots = []
    for hours in employee_working_hours:
        start_work = datetime.combine(appointment_date, hours.start_time)
        end_work = datetime.combine(appointment_date, hours.end_time)
        current_slot_start = start_work
        
        while current_slot_start + timedelta(minutes=service.duration) <= end_work:
            current_slot_end = current_slot_start + timedelta(minutes=service.duration)
            is_available = True
            for blocked in blocked_slots:
                if not (current_slot_end <= blocked['start'] or current_slot_start >= blocked['end']):
                    is_available = False
                    break
            if is_available:
                available_slots.append(current_slot_start.strftime('%H:%M'))
            current_slot_start += timedelta(minutes=15) # Intervalle de vérification
            
    return available_slots

def get_all_employees_availability(service_id, date_str):
    """
    Récupère les créneaux pour un service et une date, tous employés confondus.
    """
    appointment_date = datetime.strptime(date_str, '%Y-%m-%d').date()
    service = Service.query.get(service_id)
    if not service:
        return []

    # Récupérer les employés qui peuvent effectuer ce service
    employees = Employee.query.join(Employee.services).filter(Service.id == service_id).all()
    
    all_slots = []
    for emp in employees:
        all_slots.extend(get_available_slots_for_employee(service_id, emp.id, appointment_date))
        
    return sorted(list(set(all_slots)))


@appointments_bp.route('/availability-by-service', methods=['GET'])
@jwt_required()
def get_availability_by_service():
    """
    Retourne les jours disponibles pour un service donné sur une période.
    """
    try:
        service_id = request.args.get('service_id', type=int)
        start_date_str = request.args.get('start_date')
        end_date_str = request.args.get('end_date')

        if not all([service_id, start_date_str, end_date_str]):
            return jsonify({'error': 'service_id, start_date et end_date sont requis'}), 400

        start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
        end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
        
        service = Service.query.get(service_id)
        if not service:
            return jsonify({'error': 'Service non trouvé'}), 404

        # Employés pouvant réaliser le service
        employees = Employee.query.join(Employee.services).filter(Service.id == service_id).all()
        employee_ids = [emp.id for emp in employees]

        if not employee_ids:
            return jsonify({'available_days': []}), 200

        available_days = set()
        current_date = start_date
        while current_date <= end_date:
            # Vérifier si au moins un employé a un créneau ce jour-là
            for emp_id in employee_ids:
                slots = get_available_slots_for_employee(service_id, emp_id, current_date)
                if slots:
                    available_days.add(current_date.strftime('%Y-%m-%d'))
                    break # Passer au jour suivant dès qu'un créneau est trouvé
            current_date += timedelta(days=1)
            
        return jsonify({'available_days': sorted(list(available_days))}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
