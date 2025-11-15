import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { adminAppointmentsAPI, adminEmployeesAPI, employeesAPI } from '../../services/api';
import { format, startOfWeek, endOfWeek, addDays, subDays, isSameDay, parseISO, addMinutes, setHours, setMinutes } from 'date-fns';
import { fr } from 'date-fns/locale';
import AddAppointmentModal from '../../components/AddAppointmentModal';

export default function CalendarView() {
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { locale: fr, weekStartsOn: 1 }));
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [employeeWorkingHours, setEmployeeWorkingHours] = useState([]);
  const [employeeAvailability, setEmployeeAvailability] = useState([]);
  const daysOfWeek = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    if (selectedEmployeeId) {
      loadAppointments();
      loadEmployeeData(selectedEmployeeId);
    } else {
      setAppointments([]);
      setEmployeeWorkingHours([]);
      setEmployeeAvailability([]);
      setLoading(false);
    }
  }, [currentWeekStart, selectedEmployeeId]);

  const loadEmployees = async () => {
    try {
      const response = await employeesAPI.getAll();
      setEmployees(response.data);
      if (response.data.length > 0) {
        setSelectedEmployeeId(response.data[0].id.toString());
      }
    } catch (error) {
      console.error('Erreur lors du chargement des employés:', error);
    }
  };

  const loadEmployeeData = async (employeeId) => {
    try {
      const [hoursResponse, availabilityResponse] = await Promise.all([
        adminEmployeesAPI.getEmployeeHours(employeeId),
        adminEmployeesAPI.getEmployeeAvailability(employeeId)
      ]);
      setEmployeeWorkingHours(hoursResponse.data);
      setEmployeeAvailability(availabilityResponse.data);
    } catch (error) {
      console.error('Erreur lors du chargement des données de l\'employé:', error);
      setEmployeeWorkingHours([]);
      setEmployeeAvailability([]);
    }
  };

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const startDate = format(currentWeekStart, 'yyyy-MM-dd');
      const endDate = format(endOfWeek(currentWeekStart, { locale: fr, weekStartsOn: 1 }), 'yyyy-MM-dd');
      const response = await adminAppointmentsAPI.getEmployeeAppointments(selectedEmployeeId, startDate, endDate);
      setAppointments(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des rendez-vous:', error);
    } finally {
      setLoading(false);
    }
  };

  const goToPreviousWeek = () => {
    setCurrentWeekStart(subDays(currentWeekStart, 7));
  };

  const goToNextWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, 7));
  };

  const getAppointmentsForDay = (day) => {
    return appointments.filter(apt => isSameDay(parseISO(apt.appointment_date), day))
                       .sort((a, b) => a.start_time.localeCompare(b.start_time));
 };

 const isEmployeeUnavailable = (day) => {
   return employeeAvailability.some(avail =>
     isSameDay(parseISO(avail.date), day) && !avail.is_available
   );
 };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Agenda des Employés</h2>
            <Button onClick={() => setIsModalOpen(true)}>Ajouter un rendez-vous</Button>
          </div>
          
          <div className="flex items-center gap-4 mb-6">
            <Select onValueChange={setSelectedEmployeeId} value={selectedEmployeeId}>
              <SelectTrigger className="w-[200px]">
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

            <div className="flex items-center space-x-2">
              <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-medium text-gray-700">
                {format(currentWeekStart, 'dd MMM yyyy', { locale: fr })} - {format(endOfWeek(currentWeekStart, { locale: fr, weekStartsOn: 1 }), 'dd MMM yyyy', { locale: fr })}
              </span>
              <Button variant="outline" size="icon" onClick={goToNextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-[60px_repeat(7,1fr)] gap-1"> {/* Adjusted grid for hours column */}
              {/* Time Column Header */}
              <div className="sticky top-0 bg-white z-10 border-b border-r p-2 text-center text-xs font-medium text-gray-500 uppercase">Heure</div>
              {/* Day Headers */}
              {daysOfWeek.map(day => (
                <div key={day.toISOString()} className="sticky top-0 bg-white z-10 border-b p-2 text-center font-semibold text-gray-800">
                  {format(day, 'EEE dd/MM', { locale: fr })}
                </div>
              ))}

              {/* Time Slots and Appointments */}
              {(() => {
                const timeSlots = [];
                const intervalMinutes = 30;
                let minHour = 24;
                let maxHour = 0;

                // Déterminer la plage horaire globale pour la semaine
                employeeWorkingHours.forEach(h => {
                  if (h.start_time) minHour = Math.min(minHour, parseInt(h.start_time.split(':')[0]));
                  if (h.end_time) maxHour = Math.max(maxHour, parseInt(h.end_time.split(':')[0]));
                });

                if (minHour === 24) minHour = 8; // Default if no hours set
                if (maxHour === 0) maxHour = 20; // Default if no hours set

                for (let h = minHour; h < maxHour; h++) {
                  for (let m = 0; m < 60; m += intervalMinutes) {
                    timeSlots.push(format(new Date(2000, 0, 1, h, m), 'HH:mm'));
                  }
                }

                return timeSlots.map((timeSlot, index) => (
                  <>
                    {/* Time Column */}
                    <div key={`time-${timeSlot}`} className="border-r border-b p-1 text-right text-xs text-gray-500 bg-gray-50">
                      {timeSlot}
                    </div>
                    {/* Day Columns for Appointments */}
                    {daysOfWeek.map(day => {
                      const dayAppointments = getAppointmentsForDay(day);
                      const appointmentsInSlot = dayAppointments.filter(apt => {
                        const aptStart = parseISO(`2000-01-01T${apt.start_time}`);
                        const slotStart = parseISO(`2000-01-01T${timeSlot}`);
                        
                        // Only render if the appointment starts exactly at this time slot
                        return aptStart.getHours() === slotStart.getHours() && aptStart.getMinutes() === slotStart.getMinutes();
                      });

                      const dayOfWeekIndex = (day.getDay() + 6) % 7; // 0=Lundi, 6=Dimanche
                      const workingHours = employeeWorkingHours.find(h => h.day_of_week === dayOfWeekIndex);
                      const isWorking = workingHours && workingHours.start_time && workingHours.end_time;
                      const isUnavailable = isEmployeeUnavailable(day);

                      let isSlotActive = false;
                      if (isWorking && !isUnavailable) {
                        const slotDate = parseISO(`2000-01-01T${timeSlot}`);
                        const startDate = parseISO(`2000-01-01T${workingHours.start_time}`);
                        const endDate = parseISO(`2000-01-01T${workingHours.end_time}`);
                        if (slotDate >= startDate && slotDate < endDate) {
                          isSlotActive = true;
                        }
                      }

                      return (
                        <div key={`${day.toISOString()}-${timeSlot}`} className={`relative border-b p-1 min-h-[30px] ${isSlotActive ? 'bg-white' : 'bg-gray-100'}`}>
                          {isUnavailable && timeSlot === timeSlots[0] && (
                             <div className="absolute inset-0 bg-red-100 flex items-center justify-center z-20">
                               <span className="text-red-600 text-xs font-semibold">Indisponible</span>
                             </div>
                          )}
                          {appointmentsInSlot.map(apt => (
                            <div
                              key={apt.id}
                              className="absolute inset-x-0 bg-amber-100 text-amber-800 p-1 rounded-sm text-xs overflow-hidden shadow-sm"
                              style={{
                                top: `1px`,
                                height: `calc(${(apt.service_duration / intervalMinutes) * 100}% - 2px)`,
                                zIndex: 10,
                              }}
                            >
                              <p className="font-medium">{apt.start_time} - {apt.end_time}</p>
                              <p>{apt.service_name}</p>
                              <p className="text-xs text-amber-700">Client: {apt.client_name}</p>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </>
                ));
              })()}
            </div>
          )}
        </div>
      </div>
      <AddAppointmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAppointmentAdded={loadAppointments}
      />
    </AdminLayout>
  );
}