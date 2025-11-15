from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    phone = db.Column(db.String(20))
    role = db.Column(db.String(20), default='client')  # client, admin, employee
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relations
    appointments = db.relationship('Appointment', back_populates='client', foreign_keys='Appointment.client_id')
    employee_profile = db.relationship('Employee', back_populates='user', uselist=False)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'phone': self.phone,
            'role': self.role,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Employee(db.Model):
    __tablename__ = 'employees'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    photo_url = db.Column(db.String(255))
    bio = db.Column(db.Text)
    specialties = db.Column(db.String(255))
    position = db.Column(db.String(100))
    years_experience = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True)
    
    # Relations
    user = db.relationship('User', back_populates='employee_profile')
    services = db.relationship('Service', secondary='employee_services', back_populates='employees')
    appointments = db.relationship('Appointment', back_populates='employee')
    working_hours = db.relationship('EmployeeHours', back_populates='employee', cascade='all, delete-orphan')
    
    def to_dict(self):
        base_url = "http://localhost:5000"
        photo_url = f"{base_url}{self.photo_url}" if self.photo_url else None
        return {
            'id': self.id,
            'user_id': self.user_id,
            'first_name': self.user.first_name if self.user else None,
            'last_name': self.user.last_name if self.user else None,
            'name': f"{self.user.first_name} {self.user.last_name}" if self.user else None,
            'email': self.user.email if self.user else None,
            'phone': self.user.phone if self.user else None,
            'photo_url': photo_url,
            'bio': self.bio,
            'specialties': self.specialties,
            'position': self.position,
            'years_experience': self.years_experience,
            'is_active': self.is_active,
            'services': [s.id for s in self.services],
            'working_hours': [wh.to_dict() for wh in self.working_hours]
        }

class Service(db.Model):
    __tablename__ = 'services'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    duration = db.Column(db.Integer, nullable=False)  # in minutes
    price = db.Column(db.Float, nullable=False)
    category = db.Column(db.String(50))
    image_url = db.Column(db.String(255))
    is_active = db.Column(db.Boolean, default=True)
    
    # Relations
    employees = db.relationship('Employee', secondary='employee_services', back_populates='services')
    appointments = db.relationship('Appointment', back_populates='service')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'duration': self.duration,
            'price': self.price,
            'category': self.category,
            'image_url': self.image_url,
            'is_active': self.is_active,
            'employees': [e.id for e in self.employees]
        }

# Table d'association many-to-many
employee_services = db.Table('employee_services',
    db.Column('employee_id', db.Integer, db.ForeignKey('employees.id'), primary_key=True),
    db.Column('service_id', db.Integer, db.ForeignKey('services.id'), primary_key=True)
)

class Appointment(db.Model):
    __tablename__ = 'appointments'
    
    id = db.Column(db.Integer, primary_key=True)
    client_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id'), nullable=False, index=True)
    service_id = db.Column(db.Integer, db.ForeignKey('services.id'), nullable=False, index=True)
    appointment_date = db.Column(db.Date, nullable=False, index=True)
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)
    status = db.Column(db.String(20), default='pending', index=True)  # pending, confirmed, completed, cancelled
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relations
    client = db.relationship('User', back_populates='appointments', foreign_keys=[client_id])
    employee = db.relationship('Employee', back_populates='appointments')
    service = db.relationship('Service', back_populates='appointments')
    
    def to_dict(self):
        return {
            'id': self.id,
            'client_id': self.client_id,
            'client_name': f"{self.client.first_name} {self.client.last_name}" if self.client else None,
            'client_email': self.client.email if self.client else None,
            'client_phone': self.client.phone if self.client else None,
            'employee_id': self.employee_id,
            'employee_name': f"{self.employee.user.first_name} {self.employee.user.last_name}" if self.employee and self.employee.user else None,
            'service_id': self.service_id,
            'service_name': self.service.name if self.service else None,
            'service_duration': self.service.duration if self.service else None,
            'service_price': self.service.price if self.service else None,
            'appointment_date': self.appointment_date.isoformat() if self.appointment_date else None,
            'start_time': self.start_time.strftime('%H:%M') if self.start_time else None,
            'end_time': self.end_time.strftime('%H:%M') if self.end_time else None,
            'status': self.status,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class BusinessHours(db.Model):
    __tablename__ = 'business_hours'
    
    id = db.Column(db.Integer, primary_key=True)
    day_of_week = db.Column(db.Integer, nullable=False)  # 0=Monday, 6=Sunday
    open_time = db.Column(db.Time)
    close_time = db.Column(db.Time)
    is_closed = db.Column(db.Boolean, default=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'day_of_week': self.day_of_week,
            'open_time': self.open_time.strftime('%H:%M') if self.open_time else None,
            'close_time': self.close_time.strftime('%H:%M') if self.close_time else None,
            'is_closed': self.is_closed
        }

class EmployeeHours(db.Model):
    __tablename__ = 'employee_hours'
    
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id'), nullable=False, index=True)
    day_of_week = db.Column(db.Integer, nullable=False, index=True)  # 0=Monday, 6=Sunday
    start_time = db.Column(db.Time)
    end_time = db.Column(db.Time)
    
    # Relations
    employee = db.relationship('Employee', back_populates='working_hours')
    
    def to_dict(self):
        return {
            'id': self.id,
            'employee_id': self.employee_id,
            'day_of_week': self.day_of_week,
            'start_time': self.start_time.strftime('%H:%M') if self.start_time else None,
            'end_time': self.end_time.strftime('%H:%M') if self.end_time else None
        }

class EmployeeAvailability(db.Model):
    __tablename__ = 'employee_availability'
    
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id'), nullable=False, index=True)
    date = db.Column(db.Date, nullable=False, index=True)
    start_time = db.Column(db.Time, nullable=True)
    end_time = db.Column(db.Time, nullable=True)
    is_available = db.Column(db.Boolean, default=True)
    reason = db.Column(db.String(100))  # e.g., 'Congé', 'Maladie', 'Pause'

    employee = db.relationship('Employee')

    def to_dict(self):
        return {
            'id': self.id,
            'employee_id': self.employee_id,
            'date': self.date.isoformat(),
            'start_time': self.start_time.strftime('%H:%M') if self.start_time else None,
            'end_time': self.end_time.strftime('%H:%M') if self.end_time else None,
            'is_available': self.is_available,
            'reason': self.reason
        }

class ClosedDate(db.Model):
    __tablename__ = 'closed_dates'
    
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.Date, nullable=False, unique=True)
    reason = db.Column(db.String(255))
    
    def to_dict(self):
        return {
            'id': self.id,
            'date': self.date.isoformat() if self.date else None,
            'reason': self.reason
        }

class SalonInfo(db.Model):
    __tablename__ = 'salon_info'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    address = db.Column(db.String(255))
    phone = db.Column(db.String(20))
    email = db.Column(db.String(120))
    logo_url = db.Column(db.String(255))
    cancellation_policy = db.Column(db.Text)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'address': self.address,
            'phone': self.phone,
            'email': self.email,
            'logo_url': self.logo_url,
            'cancellation_policy': self.cancellation_policy
        }

class Gallery(db.Model):
    __tablename__ = 'gallery'
    
    id = db.Column(db.Integer, primary_key=True)
    image_url = db.Column(db.String(255), nullable=False)
    title = db.Column(db.String(100))
    display_order = db.Column(db.Integer, default=0)
    
    def to_dict(self):
        # L'URL est déjà relative, pas besoin d'ajouter le base_url ici
        image_url = self.image_url if self.image_url else None
        return {
            'id': self.id,
            'image_url': image_url,
            'title': self.title,
            'display_order': self.display_order
        }

