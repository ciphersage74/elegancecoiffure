import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon, Clock, User, Check, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from "@/components/ui/calendar";
import { useAuth } from '../context/AuthContext';
import { servicesAPI, employeesAPI, appointmentsAPI } from '../services/api';
import { format, addDays, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

const STEPS = ['Service', 'Employé', 'Date & Heure', 'Confirmation'];

export default function Booking() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  
  // Rediriger vers la page de choix auth si l'utilisateur n'est pas connecté
  useEffect(() => {
    if (!authLoading && !user) {
      // Sauvegarder l'intention de réserver
      localStorage.setItem('redirectAfterLogin', '/booking');
      navigate('/auth-choice');
    }
  }, [user, authLoading, navigate]);
  const [currentStep, setCurrentStep] = useState(0);
  const [services, setServices] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [availableDays, setAvailableDays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingDays, setLoadingDays] = useState(false);

  const [bookingData, setBookingData] = useState({
    service_id: null,
    employee_id: null,
    date: '',
    time: '',
    notes: ''
  });

  const [selectedService, setSelectedService] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  useEffect(() => {
    fetchServices();
    // BUG FIX #1: Restaurer les données de réservation après connexion
    const pendingBooking = localStorage.getItem('pendingBooking');
    if (pendingBooking && user) {
      try {
        const { bookingData: savedData, selectedService: savedService, selectedEmployee: savedEmployee } = JSON.parse(pendingBooking);
        setBookingData(savedData);
        setSelectedService(savedService);
        setSelectedEmployee(savedEmployee);
        setCurrentStep(3); // Aller directement à la confirmation
        localStorage.removeItem('pendingBooking');
        // Auto-créer le rendez-vous
        setTimeout(() => {
          handleConfirmWithData(savedData);
        }, 500);
      } catch (error) {
        console.error('Erreur lors de la restauration:', error);
        localStorage.removeItem('pendingBooking');
      }
    }
  }, [user]);

  useEffect(() => {
    if (bookingData.service_id) {
      fetchEmployeesByService(bookingData.service_id);
      fetchAvailableDays(bookingData.service_id);
    }
  }, [bookingData.service_id]);

  useEffect(() => {
    if (bookingData.employee_id !== null && bookingData.date) {
      fetchAvailableSlots();
    }
  }, [bookingData.employee_id, bookingData.date]);

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/booking-data');
      const data = await response.json();
      setServices(data.services || []);
    } catch (error) {
      console.error('Erreur:', error);
      setServices([]);
    }
  };

  const fetchEmployeesByService = async (serviceId) => {
    try {
      const response = await employeesAPI.getByService(serviceId);
      // Ajouter l'option "Peu importe"
      const anyEmployee = {
        id: 0,
        first_name: 'Peu importe',
        last_name: 'le collaborateur',
        position: 'Prochain créneau disponible',
      };
      setEmployees([anyEmployee, ...response.data]);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const fetchAvailableDays = async (serviceId) => {
    setLoadingDays(true);
    try {
      const startDate = format(new Date(), 'yyyy-MM-dd');
      const endDate = format(addDays(new Date(), 30), 'yyyy-MM-dd');
      const response = await appointmentsAPI.getAvailabilityByService(serviceId, startDate, endDate);
      setAvailableDays(response.data.available_days || []);
    } catch (error) {
      console.error('Erreur lors de la récupération des jours disponibles:', error);
      setAvailableDays([]);
    } finally {
      setLoadingDays(false);
    }
  };

  const fetchAvailableSlots = async () => {
    setLoading(true);
    try {
      const response = await appointmentsAPI.getAvailability(
        bookingData.service_id,
        bookingData.employee_id,
        bookingData.date
      );
      setAvailableSlots(response.data.slots || []);
    } catch (error) {
      console.error('Erreur:', error);
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const handleServiceSelect = (service) => {
    setSelectedService(service);
    setBookingData({ ...bookingData, service_id: service.id });
    setCurrentStep(1);
  };

  const handleEmployeeSelect = (employee) => {
    setSelectedEmployee(employee);
    setBookingData({ ...bookingData, employee_id: employee.id });
    setCurrentStep(2);
  };

  const handleDateSelect = (date) => {
    setBookingData({ ...bookingData, date, time: '' });
  };

  const handleTimeSelect = (time) => {
    setBookingData({ ...bookingData, time });
    setCurrentStep(3);
  };

  const handleConfirmWithData = async (data) => {
    if (!user) return;
    
    setLoading(true);
    try {
      await appointmentsAPI.create({
        ...data,
        appointment_date: `${data.date}T${data.time}`
      });
      alert('Rendez-vous confirmé avec succès !');
      navigate('/');
    } catch (error) {
      console.error('Erreur:', error);
      alert(error.response?.data?.error || 'Erreur lors de la réservation');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!user) {
      // BUG FIX #1: Sauvegarder les données avant la redirection
      localStorage.setItem('pendingBooking', JSON.stringify({
        bookingData,
        selectedService,
        selectedEmployee
      }));
      navigate('/login', { state: { from: '/booking' } });
      return;
    }

    await handleConfirmWithData(bookingData);
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    return maxDate.toISOString().split('T')[0];
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <button
            onClick={() => currentStep > 0 ? setCurrentStep(currentStep - 1) : navigate('/')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </button>
          <h1 className="text-3xl font-bold">Prendre rendez-vous</h1>
        </div>

        <div className="mb-8">
          <div className="flex justify-between">
            {STEPS.map((step, index) => (
              <div key={index} className="flex-1">
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    index <= currentStep 
                      ? 'bg-amber-600 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {index < currentStep ? <Check className="w-5 h-5" /> : index + 1}
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={`flex-1 h-1 mx-2 ${
                      index < currentStep ? 'bg-amber-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
                <div className="mt-2 text-xs font-medium text-center">{step}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          {currentStep === 0 && (
            <div>
              <h2 className="text-2xl font-semibold mb-6">Choisissez votre service</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map(service => (
                  <div
                    key={service.id}
                    onClick={() => handleServiceSelect(service)}
                    className="border rounded-lg p-4 cursor-pointer hover:border-amber-600 hover:shadow-md transition-all"
                  >
                    <h3 className="font-semibold text-lg mb-2">{service.name}</h3>
                    <p className="text-sm text-gray-600 mb-3">{service.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-amber-600 font-bold">{service.price}€</span>
                      <span className="text-sm text-gray-500 flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {service.duration} min
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div>
              <h2 className="text-2xl font-semibold mb-6">Choisissez votre coiffeur</h2>
              {employees.length === 0 ? (
                <p className="text-gray-500">Aucun employé disponible pour ce service</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {employees.map(employee => (
                    <div
                      key={employee.id}
                      onClick={() => handleEmployeeSelect(employee)}
                      className="border rounded-lg p-4 cursor-pointer hover:border-amber-600 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center mb-3">
                        {employee.id === 0 ? (
                           <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
                             <User className="w-8 h-8 text-amber-600" />
                           </div>
                        ) : employee.photo_url ? (
                          <img
                            src={employee.photo_url}
                            alt={`${employee.first_name} ${employee.last_name}`}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
                            <User className="w-8 h-8 text-amber-600" />
                          </div>
                        )}
                        <div className="ml-4">
                          <h3 className="font-semibold">
                            {employee.first_name} {employee.last_name}
                          </h3>
                          <p className="text-sm text-gray-600">{employee.position}</p>
                        </div>
                      </div>
                      {employee.specialties && (
                        <p className="text-sm text-gray-600">{employee.specialties}</p>
                      )}
                      {employee.years_experience > 0 && (
                        <p className="text-xs text-gray-500 mt-2">
                          {employee.years_experience} ans d'expérience
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {currentStep === 2 && (
            <div>
              <h2 className="text-2xl font-semibold mb-6">Choisissez la date et l'heure</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-sm font-medium mb-2">Date</label>
                  {loadingDays ? (
                    <p>Chargement des disponibilités...</p>
                  ) : (
                    <Calendar
                      mode="single"
                      selected={bookingData.date ? parseISO(bookingData.date) : undefined}
                      onSelect={(date) => handleDateSelect(date ? format(date, 'yyyy-MM-dd') : '')}
                      disabled={(date) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        if (date < today) return true;
                        if (availableDays.length > 0) {
                          return !availableDays.includes(format(date, 'yyyy-MM-dd'));
                        }
                        return false;
                      }}
                      locale={fr}
                      className="rounded-md border"
                    />
                  )}
                </div>

                {bookingData.date && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Créneaux disponibles</label>
                    {loading ? (
                      <p className="text-gray-500">Chargement des créneaux...</p>
                    ) : availableSlots.length === 0 ? (
                      <p className="text-gray-500">Aucun créneau disponible pour cette date</p>
                    ) : (
                      <div className="grid grid-cols-3 gap-2">
                        {availableSlots.map(slot => (
                          <button
                            key={slot}
                            onClick={() => handleTimeSelect(slot)}
                            className={`px-4 py-2 border rounded-md text-sm ${
                              bookingData.time === slot
                                ? 'bg-amber-600 text-white border-amber-600'
                                : 'hover:border-amber-600'
                            }`}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div>
              <h2 className="text-2xl font-semibold mb-6">Confirmation</h2>
              
              <div className="space-y-4 mb-6">
                <div className="border-l-4 border-amber-600 pl-4">
                  <p className="text-sm text-gray-600">Service</p>
                  <p className="font-semibold">{selectedService?.name}</p>
                  <p className="text-sm text-gray-600">
                    {selectedService?.duration} min - {selectedService?.price}€
                  </p>
                </div>

                <div className="border-l-4 border-amber-600 pl-4">
                  <p className="text-sm text-gray-600">Coiffeur</p>
                  <p className="font-semibold">
                    {selectedEmployee?.first_name} {selectedEmployee?.last_name}
                  </p>
                </div>

                <div className="border-l-4 border-amber-600 pl-4">
                  <p className="text-sm text-gray-600">Date et heure</p>
                  <p className="font-semibold">
                    {new Date(bookingData.date).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  <p className="font-semibold">{bookingData.time}</p>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">
                  Notes (optionnel)
                </label>
                <textarea
                  value={bookingData.notes}
                  onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
                  className="w-full px-4 py-2 border rounded-md"
                  rows="3"
                  placeholder="Informations complémentaires..."
                />
              </div>

              {!user && (
                <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-6">
                  <p className="text-sm text-amber-800">
                    Vous devez être connecté pour confirmer votre rendez-vous.
                    Vous serez redirigé vers la page de connexion.
                  </p>
                </div>
              )}

              <Button
                onClick={handleConfirm}
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Confirmation...' : 'Confirmer le rendez-vous'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
