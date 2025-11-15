import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AdminLayout from '../../components/AdminLayout';
import { adminEmployeesAPI, adminServicesAPI } from '../../services/api';

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [newAvailability, setNewAvailability] = useState({
    date: '',
    start_time: '',
    end_time: '',
    reason: '',
    is_available: false
  });
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    position: '',
    bio: '',
    photo_url: '',
    specialties: '',
    years_experience: 0,
    is_active: true,
    services: [],
    working_hours: []
  });
  const daysOfWeek = [
    { id: 0, name: 'Lundi' },
    { id: 1, name: 'Mardi' },
    { id: 2, name: 'Mercredi' },
    { id: 3, name: 'Jeudi' },
    { id: 4, name: 'Vendredi' },
    { id: 5, name: 'Samedi' },
    { id: 6, name: 'Dimanche' },
  ];
  useEffect(() => {
    fetchEmployees();
    fetchServices();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await adminEmployeesAPI.getAll();
      const employeesData = response.data;

      const employeesWithDetails = await Promise.all(employeesData.map(async (employee) => {
        const hoursResponse = await adminEmployeesAPI.getEmployeeHours(employee.id);
        const availabilityResponse = await adminEmployeesAPI.getEmployeeAvailability(employee.id);
        return { 
          ...employee, 
          working_hours: hoursResponse.data,
          availability: availabilityResponse.data
        };
      }));

      setEmployees(employeesWithDetails);
    } catch (error) {
      console.error('Erreur lors du chargement des employés:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      const response = await adminServicesAPI.getAll();
      setServices(response.data);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const apiData = { ...formData, service_ids: formData.services };
      delete apiData.services;

      if (editingEmployee) {
        await adminEmployeesAPI.update(editingEmployee.id, apiData);
        await adminEmployeesAPI.updateEmployeeHours(editingEmployee.id, formData.working_hours);
      } else {
        const response = await adminEmployeesAPI.create(apiData);
        if (response.data && response.data.employee && response.data.employee.id) {
          const newEmployeeId = response.data.employee.id;
          await adminEmployeesAPI.updateEmployeeHours(newEmployeeId, formData.working_hours);
        }
      }

      fetchEmployees();
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleWorkingHoursChange = (dayId, field, value) => {
    setFormData(prev => {
      const updatedHours = prev.working_hours.map(hour =>
        hour.day_of_week === dayId ? { ...hour, [field]: value } : hour
      );
      // Si le jour n'existe pas, l'ajouter
      if (!updatedHours.some(h => h.day_of_week === dayId)) {
        updatedHours.push({ day_of_week: dayId, [field]: value });
      }
      return { ...prev, working_hours: updatedHours };
    });
  };

  const handleDelete = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet employé ?')) return;
    
    try {
      await adminEmployeesAPI.delete(id);
      fetchEmployees();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleEdit = async (employee) => {
    setEditingEmployee(employee);
    
    const completeWorkingHours = daysOfWeek.map(day => {
      const existingHour = employee.working_hours.find(h => h.day_of_week === day.id);
      return existingHour || { day_of_week: day.id, start_time: '', end_time: '' };
    });

    setFormData({
      first_name: employee.first_name,
      last_name: employee.last_name,
      email: employee.email,
      phone: employee.phone || '',
      position: employee.position || '',
      bio: employee.bio || '',
      photo_url: employee.photo_url || '',
      specialties: employee.specialties || '',
      years_experience: employee.years_experience || 0,
      is_active: employee.is_active,
      services: employee.services || [],
      working_hours: completeWorkingHours
    });

    try {
      const response = await adminEmployeesAPI.getEmployeeAvailability(employee.id);
      setAvailability(response.data);
    } catch (error) {
      console.error("Erreur lors de la récupération des disponibilités:", error);
      setAvailability([]);
    }

    setShowModal(true);
  };

  const resetForm = () => {
    setEditingEmployee(null);
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      position: '',
      bio: '',
      photo_url: '',
      specialties: '',
      years_experience: 0,
      is_active: true,
      services: [],
      working_hours: daysOfWeek.map(day => ({
        day_of_week: day.id,
        start_time: '',
        end_time: ''
      }))
    });
    setAvailability([]);
    setNewAvailability({ date: '', start_time: '', end_time: '', reason: '', is_available: false });
  };

  const toggleService = (serviceId) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(serviceId)
        ? prev.services.filter(id => id !== serviceId)
        : [...prev.services, serviceId]
    }));
  };

  const handleAddAvailability = async () => {
    if (!editingEmployee || !newAvailability.date) return;
    try {
      await adminEmployeesAPI.addEmployeeAvailability(editingEmployee.id, newAvailability);
      const response = await adminEmployeesAPI.getEmployeeAvailability(editingEmployee.id);
      setAvailability(response.data);
      setNewAvailability({ date: '', start_time: '', end_time: '', reason: '', is_available: false });
    } catch (error) {
      console.error("Erreur lors de l'ajout de l'indisponibilité:", error);
    }
  };

  const handleDeleteAvailability = async (availabilityId) => {
    if (!editingEmployee) return;
    try {
      await adminEmployeesAPI.deleteEmployeeAvailability(availabilityId);
      const response = await adminEmployeesAPI.getEmployeeAvailability(editingEmployee.id);
      setAvailability(response.data);
    } catch (error) {
      console.error("Erreur lors de la suppression de l'indisponibilité:", error);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6">Chargement...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestion des Employés</h1>
        <Button onClick={() => { resetForm(); setShowModal(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Nouvel Employé
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {employees.map(employee => (
          <div key={employee.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              {employee.photo_url ? (
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
                <h3 className="font-semibold text-lg">
                  {employee.first_name} {employee.last_name}
                </h3>
                <p className="text-sm text-gray-600">{employee.position}</p>
              </div>
            </div>

            <div className="space-y-2 text-sm mb-4">
              <p><span className="font-medium">Email:</span> {employee.email}</p>
              {employee.phone && <p><span className="font-medium">Tél:</span> {employee.phone}</p>}
            </div>

            <div className="flex items-center justify-between">
              <span className={`px-2 py-1 rounded text-xs ${
                employee.is_active 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {employee.is_active ? 'Actif' : 'Inactif'}
              </span>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(employee)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(employee.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-4">
              {editingEmployee ? 'Modifier l\'employé' : 'Nouvel employé'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* ... autres champs du formulaire ... */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Prénom *</label>
                  <input type="text" required value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Nom *</label>
                  <input type="text" required value={formData.last_name} onChange={(e) => setFormData({...formData, last_name: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Téléphone</label>
                  <input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Poste</label>
                  <input type="text" value={formData.position} onChange={(e) => setFormData({...formData, position: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-8">
                {/* Colonne de gauche */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Heures de travail</h3>
                    {daysOfWeek.map(day => (
                      <div key={day.id} className="grid grid-cols-5 items-center gap-2 mb-2">
                        <label className="col-span-2 text-sm font-medium">{day.name}</label>
                        <input type="time" value={formData.working_hours.find(h => h.day_of_week === day.id)?.start_time || ''} onChange={(e) => handleWorkingHoursChange(day.id, 'start_time', e.target.value)} className="col-span-1 px-2 py-1 border rounded-md text-sm" />
                        <span className="text-center">-</span>
                        <input type="time" value={formData.working_hours.find(h => h.day_of_week === day.id)?.end_time || ''} onChange={(e) => handleWorkingHoursChange(day.id, 'end_time', e.target.value)} className="col-span-1 px-2 py-1 border rounded-md text-sm" />
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Services proposés</label>
                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-md p-3">
                      {services.map(service => (
                        <label key={service.id} className="flex items-center space-x-2">
                          <input type="checkbox" checked={formData.services.includes(service.id)} onChange={() => toggleService(service.id)} className="rounded" />
                          <span className="text-sm">{service.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Colonne de droite */}
                {editingEmployee && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold mb-2">Gérer les indisponibilités</h3>
                    <div className="border rounded-md p-3 space-y-2">
                      <div className="grid grid-cols-3 gap-2">
                        <input type="date" value={newAvailability.date} onChange={(e) => setNewAvailability({...newAvailability, date: e.target.value})} className="px-2 py-1 border rounded-md text-sm" />
                        <input type="time" value={newAvailability.start_time} onChange={(e) => setNewAvailability({...newAvailability, start_time: e.target.value})} className="px-2 py-1 border rounded-md text-sm" />
                        <input type="time" value={newAvailability.end_time} onChange={(e) => setNewAvailability({...newAvailability, end_time: e.target.value})} className="px-2 py-1 border rounded-md text-sm" />
                      </div>
                      <input type="text" value={newAvailability.reason} onChange={(e) => setNewAvailability({...newAvailability, reason: e.target.value})} className="w-full px-2 py-1 border rounded-md text-sm" placeholder="Raison (ex: Congés)" />
                      <Button type="button" size="sm" onClick={handleAddAvailability}>Ajouter Indisponibilité</Button>
                    </div>
                    
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {availability.length > 0 ? (
                        availability.map(av => (
                          <div key={av.id} className="flex justify-between items-center bg-gray-100 p-2 rounded-md">
                            <div>
                              <p className="font-medium text-sm">{new Date(av.date).toLocaleDateString()}</p>
                              <p className="text-xs text-gray-600">{av.start_time && av.end_time ? `${av.start_time} - ${av.end_time}` : 'Toute la journée'}</p>
                              {av.reason && <p className="text-xs text-gray-500">{av.reason}</p>}
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteAvailability(av.id)}>
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-4">Aucune indisponibilité.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center">
                <input type="checkbox" id="is_active" checked={formData.is_active} onChange={(e) => setFormData({...formData, is_active: e.target.checked})} className="rounded" />
                <label htmlFor="is_active" className="ml-2 text-sm font-medium">Employé actif</label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => { setShowModal(false); resetForm(); }}>Annuler</Button>
                <Button type="submit">{editingEmployee ? 'Mettre à jour' : 'Créer'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </AdminLayout>
  );
}
