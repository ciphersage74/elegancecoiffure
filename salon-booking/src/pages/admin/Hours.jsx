import { useState, useEffect } from 'react';
import { Clock, Plus, Trash2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AdminLayout from '../../components/AdminLayout';

const DAYS = [
  { id: 0, name: 'Dimanche' },
  { id: 1, name: 'Lundi' },
  { id: 2, name: 'Mardi' },
  { id: 3, name: 'Mercredi' },
  { id: 4, name: 'Jeudi' },
  { id: 5, name: 'Vendredi' },
  { id: 6, name: 'Samedi' }
];

export default function Hours() {
  const [businessHours, setBusinessHours] = useState([]);
  const [closedDates, setClosedDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showClosedDateModal, setShowClosedDateModal] = useState(false);
  const [newClosedDate, setNewClosedDate] = useState({
    date: '',
    reason: ''
  });

  useEffect(() => {
    fetchBusinessHours();
    fetchClosedDates();
  }, []);

  const fetchBusinessHours = async () => {
    try {
      const response = await fetch('/api/admin/business-hours', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setBusinessHours(data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClosedDates = async () => {
    try {
      const response = await fetch('/api/admin/closed-dates', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setClosedDates(data);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const updateBusinessHours = async (dayOfWeek, field, value) => {
    try {
      const updatedHours = businessHours.map(h => 
        h.day_of_week === dayOfWeek ? { ...h, [field]: value } : h
      );
      
      const response = await fetch('/api/admin/business-hours', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ hours: updatedHours })
      });
      
      if (response.ok) {
        setBusinessHours(updatedHours);
        // Sauvegarde réussie - pas de rechargement pour éviter les bugs d'interface
      } else {
        alert('Erreur lors de la mise à jour des horaires');
        // En cas d'erreur, recharger pour revenir à l'état correct
        await fetchBusinessHours();
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la mise à jour des horaires');
    }
  };

  const addClosedDate = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/closed-dates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newClosedDate)
      });

      if (response.ok) {
        fetchClosedDates();
        setShowClosedDateModal(false);
        setNewClosedDate({ date: '', reason: '' });
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const deleteClosedDate = async (id) => {
    if (!confirm('Supprimer cette date de fermeture ?')) return;
    
    try {
      const response = await fetch(`/api/admin/closed-dates/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        fetchClosedDates();
      }
    } catch (error) {
      console.error('Erreur:', error);
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
      <div className="p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-6">Gestion des Horaires</h1>
      </div>

      {/* Horaires d'ouverture */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center mb-4">
          <Clock className="w-6 h-6 text-amber-600 mr-2" />
          <h2 className="text-xl font-semibold">Horaires d'ouverture</h2>
        </div>

        <div className="space-y-4">
          {DAYS.map(day => {
            const hours = businessHours.find(h => h.day_of_week === day.id) || {
              day_of_week: day.id,
              is_closed: true,
              open_time: '09:00',
              close_time: '19:00'
            };

            const isOpen = !hours.is_closed;

            return (
              <div key={day.id} className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="w-32 font-medium">{day.name}</div>
                
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isOpen}
                    onChange={(e) => updateBusinessHours(day.id, 'is_closed', !e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">Ouvert</span>
                </label>

                {isOpen && (
                  <>
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600">De</label>
                      <input
                        type="time"
                        value={hours.open_time || '09:00'}
                        onChange={(e) => updateBusinessHours(day.id, 'open_time', e.target.value)}
                        className="px-3 py-2 border rounded-md"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600">À</label>
                      <input
                        type="time"
                        value={hours.close_time || '19:00'}
                        onChange={(e) => updateBusinessHours(day.id, 'close_time', e.target.value)}
                        className="px-3 py-2 border rounded-md"
                      />
                    </div>
                  </>
                )}

                {!isOpen && (
                  <span className="text-red-600 text-sm">Fermé</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Dates de fermeture exceptionnelles */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Calendar className="w-6 h-6 text-amber-600 mr-2" />
            <h2 className="text-xl font-semibold">Dates de fermeture exceptionnelles</h2>
          </div>
          <Button onClick={() => setShowClosedDateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter une date
          </Button>
        </div>

        {closedDates.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Aucune date de fermeture</p>
        ) : (
          <div className="space-y-3">
            {closedDates.map(date => (
              <div key={date.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">
                    {new Date(date.date).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                  {date.reason && (
                    <div className="text-sm text-gray-600 mt-1">{date.reason}</div>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteClosedDate(date.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal ajout date de fermeture */}
      {showClosedDateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">Ajouter une date de fermeture</h2>

            <form onSubmit={addClosedDate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Date *</label>
                <input
                  type="date"
                  required
                  value={newClosedDate.date}
                  onChange={(e) => setNewClosedDate({...newClosedDate, date: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Raison</label>
                <input
                  type="text"
                  value={newClosedDate.reason}
                  onChange={(e) => setNewClosedDate({...newClosedDate, reason: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Vacances, jour férié, etc."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowClosedDateModal(false);
                    setNewClosedDate({ date: '', reason: '' });
                  }}
                >
                  Annuler
                </Button>
                <Button type="submit">
                  Ajouter
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </AdminLayout>
  );
}

