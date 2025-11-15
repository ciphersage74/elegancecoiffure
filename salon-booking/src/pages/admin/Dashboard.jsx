import { useState, useEffect } from 'react';
import { Calendar, Users, DollarSign, TrendingUp } from 'lucide-react';
import { adminStatsAPI, adminAppointmentsAPI } from '../../services/api';
import AdminLayout from '../../components/AdminLayout';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, appointmentsRes] = await Promise.all([
        adminStatsAPI.getStats(),
        adminAppointmentsAPI.getAll({ date: new Date().toISOString().split('T')[0] })
      ]);
      
      setStats(statsRes.data);
      setTodayAppointments(appointmentsRes.data);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
        </div>
      </AdminLayout>
    );
  }

  const statCards = [
    {
      title: 'Rendez-vous aujourd\'hui',
      value: todayAppointments?.length || stats?.today_appointments || 0,
      icon: Calendar,
      color: 'bg-blue-500',
    },
    {
      title: 'Rendez-vous ce mois',
      value: stats?.month_appointments || 0,
      icon: TrendingUp,
      color: 'bg-green-500',
    },
    {
      title: 'Revenus du mois',
      value: `${stats?.month_revenue?.toFixed(2) || 0}€`,
      icon: DollarSign,
      color: 'bg-amber-500',
    },
    {
      title: 'Total clients',
      value: stats?.total_clients || 0,
      icon: Users,
      color: 'bg-purple-500',
    },
  ];

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    
    const labels = {
      pending: 'En attente',
      confirmed: 'Confirmé',
      completed: 'Terminé',
      cancelled: 'Annulé',
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badges[status]}`}>
        {labels[status]}
      </span>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Today's Appointments */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Rendez-vous d'aujourd'hui</h2>
          </div>
          <div className="p-6">
            {todayAppointments.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Aucun rendez-vous aujourd'hui</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-gray-500 border-b">
                      <th className="pb-3 font-medium">Heure</th>
                      <th className="pb-3 font-medium">Client</th>
                      <th className="pb-3 font-medium">Service</th>
                      <th className="pb-3 font-medium">Employé</th>
                      <th className="pb-3 font-medium">Statut</th>
                      <th className="pb-3 font-medium">Prix</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {todayAppointments.map((appointment) => (
                      <tr key={appointment.id} className="border-b last:border-0">
                        <td className="py-4 font-medium">{appointment.start_time}</td>
                        <td className="py-4">{appointment.client_name}</td>
                        <td className="py-4">{appointment.service_name}</td>
                        <td className="py-4">{appointment.employee_name}</td>
                        <td className="py-4">{getStatusBadge(appointment.status)}</td>
                        <td className="py-4 font-medium">{appointment.service_price}€</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Taux d'occupation</h3>
            <div className="flex items-center justify-center">
              <div className="relative w-32 h-32">
                <svg className="transform -rotate-90 w-32 h-32">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-gray-200"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${(stats?.occupation_rate || 0) * 3.52} 352`}
                    className="text-amber-600"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-900">
                    {stats?.occupation_rate || 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Activité récente</h3>
            <div className="space-y-3">
              {todayAppointments.slice(0, 5).map((apt) => (
                <div key={apt.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium text-gray-900">{apt.client_name}</p>
                    <p className="text-gray-500">{apt.service_name}</p>
                  </div>
                  <span className="text-gray-600">{apt.start_time}</span>
                </div>
              ))}
              {todayAppointments.length === 0 && (
                <p className="text-gray-500 text-center py-4">Aucune activité récente</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

