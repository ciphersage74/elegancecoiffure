import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '../lib/utils';
import { CalendarIcon } from 'lucide-react';
import { adminAppointmentsAPI, adminEmployeesAPI, employeesAPI, servicesAPI, adminClientsAPI } from '../services/api';

export default function AddAppointmentModal({ isOpen, onClose, onAppointmentAdded, initialDate }) {
  const [formData, setFormData] = useState({
    client_id: '',
    employee_id: '',
    service_id: '',
    appointment_date: initialDate ? format(initialDate, 'yyyy-MM-dd') : '',
    start_time: '',
    notes: '',
    status: 'confirmed', // Default status for admin added appointments
  });
  const [clients, setClients] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [services, setServices] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadClients();
    loadEmployees();
    loadServices();
  }, []);

  useEffect(() => {
    if (formData.employee_id && formData.service_id && formData.appointment_date) {
      loadAvailableSlots();
    } else {
      setAvailableSlots([]);
    }
  }, [formData.employee_id, formData.service_id, formData.appointment_date]);

  useEffect(() => {
    if (initialDate) {
      setFormData(prev => ({ ...prev, appointment_date: format(initialDate, 'yyyy-MM-dd') }));
    }
  }, [initialDate]);

  const loadClients = async () => {
    try {
      const response = await adminClientsAPI.getAll();
      setClients(response.data);
    } catch (err) {
      console.error('Erreur lors du chargement des clients:', err);
    }
  };

  const loadEmployees = async () => {
    try {
      const response = await employeesAPI.getAll();
      const employeesData = response.data;
      setEmployees(employeesData);
    } catch (err) {
      console.error('Erreur lors du chargement des employés:', err);
    }
  };

  const loadServices = async () => {
    try {
      const response = await servicesAPI.getAll();
      setServices(response.data);
    } catch (err) {
      console.error('Erreur lors du chargement des services:', err);
    }
  };

  const loadAvailableSlots = async () => {
    setLoadingSlots(true);
    setError('');
    try {
      // Récupérer les heures de travail de l'employé sélectionné
      const response = await adminAppointmentsAPI.getAvailability(
        formData.service_id,
        formData.employee_id,
        formData.appointment_date
      );
      setAvailableSlots(response.data.available_slots || []);
    } catch (err) {
      console.error('Erreur lors du chargement des créneaux disponibles:', err);
      setError(err.response?.data?.error || 'Erreur lors du chargement des créneaux.');
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleInputChange = (id, value) => {
    setFormData(prev => ({ ...prev, [id]: value }));
    if (id === 'appointment_date' || id === 'employee_id' || id === 'service_id') {
      setFormData(prev => ({ ...prev, start_time: '' })); // Reset time when date/employee/service changes
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await adminAppointmentsAPI.create(formData);
      onClose(); // Utiliser onClose pour fermer le modal
      onAppointmentAdded();
      // Réinitialiser le formulaire après succès
      setFormData({
        client_id: '',
        employee_id: '',
        service_id: '',
        appointment_date: initialDate ? format(initialDate, 'yyyy-MM-dd') : '',
        start_time: '',
        notes: '',
        status: 'confirmed',
      });
      setError(''); // Effacer toute erreur précédente
    } catch (err) {
      console.error('Erreur lors de la création du rendez-vous:', err);
      setError(err.response?.data?.error || 'Une erreur est survenue lors de la création du rendez-vous.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ajouter un rendez-vous</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          {error && <p className="text-red-500 text-sm text-center mb-2">{error}</p>}
          
          <div className="grid grid-cols-5 items-center gap-4">
            <Label htmlFor="client_id" className="col-span-2 text-right">
              Client
            </Label>
            <Select onValueChange={(value) => handleInputChange('client_id', value)} value={formData.client_id} required>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Sélectionner un client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map(client => (
                  <SelectItem key={client.id} value={client.id.toString()}>
                    {client.first_name} {client.last_name} ({client.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-5 items-center gap-4">
            <Label htmlFor="employee_id" className="col-span-2 text-right">
              Employé
            </Label>
            <Select onValueChange={(value) => handleInputChange('employee_id', value)} value={formData.employee_id} required>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Sélectionner un employé" />
              </SelectTrigger>
              <SelectContent>
                {employees.map(employee => (
                  <SelectItem key={employee.id} value={employee.id.toString()}>
                    {employee.first_name} {employee.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-5 items-center gap-4">
            <Label htmlFor="service_id" className="col-span-2 text-right">
              Service
            </Label>
            <Select onValueChange={(value) => handleInputChange('service_id', value)} value={formData.service_id} required>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Sélectionner un service" />
              </SelectTrigger>
              <SelectContent>
                {services.map(service => (
                  <SelectItem key={service.id} value={service.id.toString()}>
                    {service.name} ({service.duration} min)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-5 items-center gap-4">
            <Label htmlFor="appointment_date" className="col-span-2 text-right">
              Date
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "col-span-3 justify-start text-left font-normal",
                    !formData.appointment_date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.appointment_date ? format(parseISO(formData.appointment_date), "dd/MM/yyyy", { locale: fr }) : <span>Choisir une date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.appointment_date ? parseISO(formData.appointment_date) : undefined}
                  onSelect={(date) => handleInputChange('appointment_date', date ? format(date, 'yyyy-MM-dd') : '')}
                  initialFocus
                  locale={fr}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-5 items-center gap-4">
            <Label htmlFor="start_time" className="col-span-2 text-right">
              Heure
            </Label>
            <Select onValueChange={(value) => handleInputChange('start_time', value)} value={formData.start_time} required disabled={loadingSlots || availableSlots.length === 0}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder={loadingSlots ? "Chargement..." : (availableSlots.length > 0 ? "Sélectionner une heure" : "Aucun créneau disponible")} />
              </SelectTrigger>
              <SelectContent>
                {availableSlots.map(slot => (
                  <SelectItem key={slot} value={slot}>
                    {slot}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-5 items-center gap-4">
            <Label htmlFor="notes" className="col-span-2 text-right">
              Notes
            </Label>
            <Input id="notes" value={formData.notes} onChange={(e) => handleInputChange('notes', e.target.value)} className="col-span-3" />
          </div>

          <DialogFooter>
            <Button type="submit">Ajouter le rendez-vous</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}