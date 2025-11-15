from datetime import time, date, timedelta
from src.models.models import User, Employee, Service, BusinessHours, EmployeeHours, SalonInfo, Gallery

def seed_database(db):
    """Initialiser la base de données avec des données de démonstration"""
    
    # Vérifier si les données existent déjà
    if User.query.first():
        return
    
    print("Initialisation de la base de données avec des données de démonstration...")
    
    # Créer un utilisateur admin
    admin = User(
        email='admin@elegance-coiffure.fr',
        first_name='Admin',
        last_name='Salon',
        phone='0123456789',
        role='admin'
    )
    admin.set_password('admin123')
    db.session.add(admin)
    
    # Créer des utilisateurs employés
    employee_users = [
        {
            'email': 'sophie.martin@elegance-coiffure.fr',
            'first_name': 'Sophie',
            'last_name': 'Martin',
            'phone': '0612345678',
            'bio': 'Directrice et styliste avec 15 ans d\'expérience. Spécialisée en coupes modernes et colorations.',
            'specialties': 'Coupe, Coloration, Balayage',
            'position': 'Directrice & Styliste',
            'years_experience': 15
        },
        {
            'email': 'julie.dubois@elegance-coiffure.fr',
            'first_name': 'Julie',
            'last_name': 'Dubois',
            'phone': '0623456789',
            'bio': 'Coloriste experte avec 10 ans d\'expérience. Passionnée par les techniques de coloration innovantes.',
            'specialties': 'Coloration, Balayage, Mèches',
            'position': 'Coloriste Expert',
            'years_experience': 10
        },
        {
            'email': 'marc.lefebvre@elegance-coiffure.fr',
            'first_name': 'Marc',
            'last_name': 'Lefebvre',
            'phone': '0634567890',
            'bio': 'Coiffeur barbier avec 8 ans d\'expérience. Expert en coupes homme et entretien de barbe.',
            'specialties': 'Coupe homme, Barbe, Brushing',
            'position': 'Coiffeur Barbier',
            'years_experience': 8
        }
    ]
    
    employees = []
    for emp_data in employee_users:
        user = User(
            email=emp_data['email'],
            first_name=emp_data['first_name'],
            last_name=emp_data['last_name'],
            phone=emp_data['phone'],
            role='employee'
        )
        user.set_password('password123')
        db.session.add(user)
        db.session.flush()
        
        employee = Employee(
            user_id=user.id,
            bio=emp_data['bio'],
            specialties=emp_data['specialties'],
            position=emp_data['position'],
            years_experience=emp_data['years_experience'],
            is_active=True
        )
        db.session.add(employee)
        employees.append(employee)
    
    db.session.flush()
    
    # Créer des services
    services_data = [
        {'name': 'Coupe Femme', 'description': 'Coupe personnalisée avec brushing', 'duration': 45, 'price': 45.0, 'category': 'Coupe'},
        {'name': 'Coupe Homme', 'description': 'Coupe moderne et tendance', 'duration': 30, 'price': 28.0, 'category': 'Coupe'},
        {'name': 'Coupe Enfant', 'description': 'Coupe adaptée aux enfants (-12 ans)', 'duration': 25, 'price': 20.0, 'category': 'Coupe'},
        {'name': 'Coloration', 'description': 'Coloration complète avec soin', 'duration': 90, 'price': 65.0, 'category': 'Coloration'},
        {'name': 'Balayage', 'description': 'Balayage naturel et lumineux', 'duration': 120, 'price': 85.0, 'category': 'Coloration'},
        {'name': 'Mèches', 'description': 'Mèches pour illuminer votre chevelure', 'duration': 90, 'price': 70.0, 'category': 'Coloration'},
        {'name': 'Brushing', 'description': 'Mise en forme professionnelle', 'duration': 30, 'price': 30.0, 'category': 'Coiffage'},
        {'name': 'Soin Capillaire', 'description': 'Soin réparateur en profondeur', 'duration': 45, 'price': 35.0, 'category': 'Soin'},
        {'name': 'Lissage Brésilien', 'description': 'Lissage longue durée', 'duration': 180, 'price': 150.0, 'category': 'Soin'},
        {'name': 'Coupe + Barbe', 'description': 'Coupe homme avec taille de barbe', 'duration': 45, 'price': 38.0, 'category': 'Coupe'},
    ]
    
    services = []
    for service_data in services_data:
        service = Service(**service_data, is_active=True)
        db.session.add(service)
        services.append(service)
    
    db.session.flush()
    
    # Assigner des services aux employés
    # Sophie (tous les services sauf barbe)
    for service in services:
        if 'Barbe' not in service.name:
            employees[0].services.append(service)
    
    # Julie (colorations et soins)
    for service in services:
        if service.category in ['Coloration', 'Soin']:
            employees[1].services.append(service)
    
    # Marc (coupes homme et barbe)
    for service in services:
        if 'Homme' in service.name or 'Barbe' in service.name or service.name == 'Brushing':
            employees[2].services.append(service)
    
    # Créer les horaires d'ouverture (0 = Dimanche, 1 = Lundi, ..., 6 = Samedi)
    business_hours_data = [
        {'day_of_week': 0, 'open_time': None, 'close_time': None, 'is_closed': True},  # Dimanche
        {'day_of_week': 1, 'open_time': time(9, 0), 'close_time': time(19, 0), 'is_closed': False},  # Lundi
        {'day_of_week': 2, 'open_time': time(9, 0), 'close_time': time(19, 0), 'is_closed': False},  # Mardi
        {'day_of_week': 3, 'open_time': time(9, 0), 'close_time': time(19, 0), 'is_closed': False},  # Mercredi
        {'day_of_week': 4, 'open_time': time(9, 0), 'close_time': time(19, 0), 'is_closed': False},  # Jeudi
        {'day_of_week': 5, 'open_time': time(9, 0), 'close_time': time(19, 0), 'is_closed': False},  # Vendredi
        {'day_of_week': 6, 'open_time': time(9, 0), 'close_time': time(19, 0), 'is_closed': False},  # Samedi
    ]
    
    for hours_data in business_hours_data:
        hours = BusinessHours(**hours_data)
        db.session.add(hours)
    
    # Créer les horaires des employés (tous travaillent du lundi au samedi)
    for employee in employees:
        for day in range(1, 7):  # Lundi (1) à Samedi (6)
            emp_hours = EmployeeHours(
                employee_id=employee.id,
                day_of_week=day,
                start_time=time(9, 0),
                end_time=time(19, 0)
            )
            db.session.add(emp_hours)
    
    # Créer les informations du salon
    salon_info = SalonInfo(
        name='Élégance Coiffure',
        description='Votre salon de coiffure de confiance depuis 2010. Nous vous accueillons dans un cadre moderne et chaleureux pour sublimer votre beauté.',
        address='123 Avenue des Champs-Élysées, 75008 Paris, France',
        phone='01 23 45 67 89',
        email='contact@elegance-coiffure.fr',
        logo_url='',
        cancellation_policy='Les rendez-vous peuvent être annulés jusqu\'à 24 heures avant l\'heure prévue. Toute annulation tardive ou absence non justifiée pourra entraîner une facturation.'
    )
    db.session.add(salon_info)
    
    # Créer un client de test
    client = User(
        email='client@test.fr',
        first_name='Jean',
        last_name='Dupont',
        phone='0645678901',
        role='client'
    )
    client.set_password('client123')
    db.session.add(client)
    
    db.session.commit()
    print("Base de données initialisée avec succès!")
    print("Compte admin: admin@elegance-coiffure.fr / admin123")
    print("Compte client test: client@test.fr / client123")

