import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button } from '@/components/ui/button.jsx'
import { Calendar, Clock, User, Scissors, ArrowLeft, X, CheckCircle, LogOut } from 'lucide-react'
import { appointmentsAPI } from '../services/api'

export default function MyAppointments() {
  const navigate = useNavigate()
  const { user, loading: authLoading, logout } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, upcoming, past

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login')
    } else if (user) {
      loadAppointments()
    }
  }, [user, authLoading])

  const loadAppointments = async () => {
    try {
      const response = await appointmentsAPI.getMy()
      setAppointments(response.data)
    } catch (error) {
      console.error('Erreur lors du chargement des rendez-vous:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (appointmentId) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler ce rendez-vous ?')) {
      return
    }

    try {
      await appointmentsAPI.cancel(appointmentId)
      loadAppointments()
    } catch (error) {
      alert('Erreur lors de l\'annulation du rendez-vous')
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'En attente' },
      confirmed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Confirmé' },
      completed: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Terminé' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'Annulé' },
    }
    
    const badge = badges[status] || badges.pending
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    )
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const filterAppointments = () => {
    const now = new Date()
    
    if (filter === 'upcoming') {
      return appointments.filter(apt => {
        const aptDate = new Date(apt.appointment_date)
        return aptDate >= now && apt.status !== 'cancelled' && apt.status !== 'completed'
      })
    } else if (filter === 'past') {
      return appointments.filter(apt => {
        const aptDate = new Date(apt.appointment_date)
        return aptDate < now || apt.status === 'completed' || apt.status === 'cancelled'
      })
    }
    
    return appointments
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    )
  }

  const filteredAppointments = filterAppointments()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mes Rendez-vous</h1>
              <p className="text-gray-600 mt-1">
                Bonjour {user?.first_name} ! Voici vos rendez-vous
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => navigate('/')} 
                variant="outline"
                className="border-amber-600 text-amber-600 hover:bg-amber-50"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour à l'accueil
              </Button>
              <Button 
                onClick={() => { logout(); navigate('/'); }} 
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Filtrer :</span>
            <div className="flex gap-2">
              <Button
                onClick={() => setFilter('all')}
                variant={filter === 'all' ? 'default' : 'outline'}
                className={filter === 'all' ? 'bg-amber-600 hover:bg-amber-700' : ''}
                size="sm"
              >
                Tous ({appointments.length})
              </Button>
              <Button
                onClick={() => setFilter('upcoming')}
                variant={filter === 'upcoming' ? 'default' : 'outline'}
                className={filter === 'upcoming' ? 'bg-amber-600 hover:bg-amber-700' : ''}
                size="sm"
              >
                À venir
              </Button>
              <Button
                onClick={() => setFilter('past')}
                variant={filter === 'past' ? 'default' : 'outline'}
                className={filter === 'past' ? 'bg-amber-600 hover:bg-amber-700' : ''}
                size="sm"
              >
                Passés
              </Button>
            </div>
          </div>
        </div>

        {/* New Appointment Button */}
        <div className="mb-6">
          <Button 
            onClick={() => navigate('/booking')}
            className="bg-amber-600 hover:bg-amber-700"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Prendre un nouveau rendez-vous
          </Button>
        </div>

        {/* Appointments List */}
        {filteredAppointments.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter === 'all' ? 'Aucun rendez-vous' : filter === 'upcoming' ? 'Aucun rendez-vous à venir' : 'Aucun rendez-vous passé'}
            </h3>
            <p className="text-gray-600 mb-6">
              Prenez rendez-vous dès maintenant pour profiter de nos services
            </p>
            <Button 
              onClick={() => navigate('/booking')}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Prendre rendez-vous
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAppointments.map((appointment) => (
              <div 
                key={appointment.id} 
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {appointment.service_name}
                      </h3>
                      {getStatusBadge(appointment.status)}
                    </div>
                    <span className="text-2xl font-bold text-amber-600">
                      {appointment.service_price}€
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center text-gray-700">
                      <Calendar className="h-4 w-4 mr-2 text-amber-600" />
                      <span className="text-sm">{formatDate(appointment.appointment_date)}</span>
                    </div>

                    <div className="flex items-center text-gray-700">
                      <Clock className="h-4 w-4 mr-2 text-amber-600" />
                      <span className="text-sm">
                        {appointment.start_time} - {appointment.end_time}
                        <span className="text-gray-500 ml-2">({appointment.service_duration} min)</span>
                      </span>
                    </div>

                    <div className="flex items-center text-gray-700">
                      <User className="h-4 w-4 mr-2 text-amber-600" />
                      <span className="text-sm">{appointment.employee_name}</span>
                    </div>

                    {appointment.notes && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-md">
                        <p className="text-xs text-gray-600">
                          <strong>Note :</strong> {appointment.notes}
                        </p>
                      </div>
                    )}
                  </div>

                  {appointment.status === 'pending' || appointment.status === 'confirmed' ? (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <Button
                        onClick={() => handleCancel(appointment.id)}
                        variant="outline"
                        className="w-full border-red-300 text-red-600 hover:bg-red-50"
                        size="sm"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Annuler le rendez-vous
                      </Button>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

