import { useState, useEffect } from 'react';
import { Save, Building2, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import AdminLayout from '../../components/AdminLayout';
import { salonAPI, adminSalonAPI } from '@/services/api';

const DEFAULT_SETTINGS = {
  name: '',
  description: '',
  address: '',
  city: '',
  postal_code: '',
  country: '',
  phone: '',
  email: '',
  website: '',
  facebook_url: '',
  instagram_url: '',
  booking_advance_days: 30,
  booking_cancel_hours: 24,
  slot_duration: 30,
  logo_url: ''
};

const coerceNumber = (value, fallback) => {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeSettings = (data = {}) => ({
  ...DEFAULT_SETTINGS,
  name: data.name ?? DEFAULT_SETTINGS.name,
  description: data.description ?? DEFAULT_SETTINGS.description,
  address: data.address ?? DEFAULT_SETTINGS.address,
  city: data.city ?? DEFAULT_SETTINGS.city,
  postal_code: data.postal_code ?? DEFAULT_SETTINGS.postal_code,
  country: data.country ?? DEFAULT_SETTINGS.country,
  phone: data.phone ?? DEFAULT_SETTINGS.phone,
  email: data.email ?? DEFAULT_SETTINGS.email,
  website: data.website ?? DEFAULT_SETTINGS.website,
  facebook_url: data.facebook_url ?? DEFAULT_SETTINGS.facebook_url,
  instagram_url: data.instagram_url ?? DEFAULT_SETTINGS.instagram_url,
  booking_advance_days: coerceNumber(
    data.booking_advance_days,
    DEFAULT_SETTINGS.booking_advance_days
  ),
  booking_cancel_hours: coerceNumber(
    data.booking_cancel_hours,
    DEFAULT_SETTINGS.booking_cancel_hours
  ),
  slot_duration: coerceNumber(
    data.slot_duration,
    DEFAULT_SETTINGS.slot_duration
  ),
  logo_url: data.logo_url ?? DEFAULT_SETTINGS.logo_url
});

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(() => ({ ...DEFAULT_SETTINGS }));

  useEffect(() => {
    let isMounted = true;

    const loadSettings = async () => {
      try {
        const response = await salonAPI.getInfo();
        const data = response?.data;
        const nextSettings = data ? normalizeSettings(data) : { ...DEFAULT_SETTINGS };

        if (isMounted) {
          setSettings(nextSettings);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des paramètres:', error);
        if (isMounted) {
          setSettings({ ...DEFAULT_SETTINGS });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        ...settings,
        booking_advance_days: coerceNumber(
          settings.booking_advance_days,
          DEFAULT_SETTINGS.booking_advance_days
        ),
        booking_cancel_hours: coerceNumber(
          settings.booking_cancel_hours,
          DEFAULT_SETTINGS.booking_cancel_hours
        ),
        slot_duration: coerceNumber(
          settings.slot_duration,
          DEFAULT_SETTINGS.slot_duration
        )
      };

      const { data } = await adminSalonAPI.updateInfo(payload);

      if (data?.salon_info) {
        setSettings(normalizeSettings(data.salon_info));
      }

      alert('Paramètres enregistrés avec succès !');
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement des paramètres:', error);
      alert("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
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
      <div className="p-6 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Paramètres du Salon</h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Informations générales */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <Building2 className="w-6 h-6 text-amber-600 mr-2" />
            <h2 className="text-xl font-semibold">Informations générales</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nom du salon *</label>
              <input
                type="text"
                required
                value={settings.name}
                onChange={(e) => setSettings({...settings, name: e.target.value})}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={settings.description}
                onChange={(e) => setSettings({...settings, description: e.target.value})}
                className="w-full px-3 py-2 border rounded-md"
                rows="4"
                placeholder="Décrivez votre salon..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Logo URL</label>
              <input
                type="url"
                value={settings.logo_url}
                onChange={(e) => setSettings({...settings, logo_url: e.target.value})}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="https://exemple.com/logo.png"
              />
            </div>
          </div>
        </div>

        {/* Adresse */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <MapPin className="w-6 h-6 text-amber-600 mr-2" />
            <h2 className="text-xl font-semibold">Adresse</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Adresse *</label>
              <input
                type="text"
                required
                value={settings.address}
                onChange={(e) => setSettings({...settings, address: e.target.value})}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="123 Rue Exemple"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Ville *</label>
                <input
                  type="text"
                  required
                  value={settings.city}
                  onChange={(e) => setSettings({...settings, city: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Code postal *</label>
                <input
                  type="text"
                  required
                  value={settings.postal_code}
                  onChange={(e) => setSettings({...settings, postal_code: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Pays *</label>
              <input
                type="text"
                required
                value={settings.country}
                onChange={(e) => setSettings({...settings, country: e.target.value})}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <Phone className="w-6 h-6 text-amber-600 mr-2" />
            <h2 className="text-xl font-semibold">Contact</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Téléphone *</label>
              <input
                type="tel"
                required
                value={settings.phone}
                onChange={(e) => setSettings({...settings, phone: e.target.value})}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="01 23 45 67 89"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Email *</label>
              <input
                type="email"
                required
                value={settings.email}
                onChange={(e) => setSettings({...settings, email: e.target.value})}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="contact@salon.fr"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Site web</label>
              <input
                type="url"
                value={settings.website}
                onChange={(e) => setSettings({...settings, website: e.target.value})}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="https://www.salon.fr"
              />
            </div>
          </div>
        </div>

        {/* Réseaux sociaux */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Réseaux sociaux</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Facebook</label>
              <input
                type="url"
                value={settings.facebook_url}
                onChange={(e) => setSettings({...settings, facebook_url: e.target.value})}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="https://facebook.com/votre-page"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Instagram</label>
              <input
                type="url"
                value={settings.instagram_url}
                onChange={(e) => setSettings({...settings, instagram_url: e.target.value})}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="https://instagram.com/votre-compte"
              />
            </div>
          </div>
        </div>

        {/* Paramètres de réservation */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Paramètres de réservation</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Réservation à l'avance (jours)
              </label>
              <input
                type="number"
                min="1"
                max="90"
                value={settings.booking_advance_days}
                onChange={(e) => setSettings({...settings, booking_advance_days: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border rounded-md"
              />
              <p className="text-xs text-gray-500 mt-1">
                Nombre de jours à l'avance pour réserver
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Annulation avant (heures)
              </label>
              <input
                type="number"
                min="1"
                max="72"
                value={settings.booking_cancel_hours}
                onChange={(e) => setSettings({...settings, booking_cancel_hours: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border rounded-md"
              />
              <p className="text-xs text-gray-500 mt-1">
                Délai minimum pour annuler un rendez-vous
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Durée des créneaux (minutes)
              </label>
              <select
                value={settings.slot_duration}
                onChange={(e) => setSettings({...settings, slot_duration: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="60">60 minutes</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Intervalle entre les créneaux horaires
              </p>
            </div>
          </div>
        </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={saving} className="px-8">
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}

