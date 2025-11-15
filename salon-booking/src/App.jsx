import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { Button } from '@/components/ui/button.jsx'
import { Calendar, Clock, MapPin, Phone, Mail, Menu, X, Star, Scissors, User, LogOut, ChevronDown } from 'lucide-react'
import salonInterior1 from './assets/salon-interior-1.jpg'
import salonInterior2 from './assets/salon-interior-2.jpg'
import salonInterior3 from './assets/salon-interior-3.jpg'
import hairdresser1 from './assets/hairdresser-1.jpg'
import './App.css'

// Import des pages admin
import Dashboard from './pages/admin/Dashboard'
import Services from './pages/admin/Services'
import Appointments from './pages/admin/Appointments'
import CalendarView from './pages/admin/CalendarView'
import Employees from './pages/admin/Employees'
import Clients from './pages/admin/Clients'
import Hours from './pages/admin/Hours'
import Gallery from './pages/admin/Gallery'
import Settings from './pages/admin/Settings'

// Import des pages client
import Booking from './pages/Booking'
import Register from './pages/Register'
import MyAppointments from './pages/MyAppointments'
import AuthChoice from './pages/AuthChoice'
import { employeesAPI, salonAPI } from './services/api'
import { getMediaUrl } from '@/utils/media'

// Composant de protection des routes admin
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    )
  }
  
  if (!user || user.role !== 'admin') {
    return <Navigate to="/login" replace />
  }
  
  return children
}

// Page d'accueil
function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const { user, logout } = useAuth()
  const [teamMembers, setTeamMembers] = useState([])
  const [galleryImages, setGalleryImages] = useState([])

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const response = await employeesAPI.getAll()
        // Filtrer pour ne garder que les employés actifs
        setTeamMembers(response.data.filter(emp => emp.is_active))
      } catch (error) {
        console.error("Erreur lors du chargement de l'équipe:", error)
      }
    }
    fetchTeam()
  }, [])

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const response = await salonAPI.getGallery()
        setGalleryImages(response.data || [])
      } catch (error) {
        console.error('Erreur lors du chargement de la galerie:', error)
      }
    }

    fetchGallery()
  }, [])

  const fallbackGallery = [
    { id: 'fallback-1', image_url: salonInterior1, title: 'Salon Élégance', isLocal: true },
    { id: 'fallback-2', image_url: salonInterior2, title: 'Espace Beauté', isLocal: true },
    { id: 'fallback-3', image_url: salonInterior3, title: 'Ambiance Lounge', isLocal: true }
  ]

  const useFallback = galleryImages.length === 0

  const galleryItems = (useFallback ? fallbackGallery : galleryImages).map((item, index) => ({
    id: item.id ?? `gallery-${index}`,
    title: item.title,
    src: item.isLocal || useFallback ? item.image_url : getMediaUrl(item.image_url)
  }))

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Scissors className="h-8 w-8 text-amber-600" />
              <span className="ml-2 text-2xl font-bold text-gray-900">Élégance Coiffure</span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#accueil" className="text-gray-700 hover:text-amber-600 transition-colors">Accueil</a>
              <a href="#services" className="text-gray-700 hover:text-amber-600 transition-colors">Services</a>
              <a href="#equipe" className="text-gray-700 hover:text-amber-600 transition-colors">Notre Équipe</a>
              <a href="#galerie" className="text-gray-700 hover:text-amber-600 transition-colors">Galerie</a>
              <a href="#contact" className="text-gray-700 hover:text-amber-600 transition-colors">Contact</a>
              <Button onClick={() => window.location.href = user ? '/booking' : '/auth-choice'} className="bg-amber-600 hover:bg-amber-700">
                Réserver en ligne
              </Button>
              {user ? (
                <div className="relative">
                  <Button 
                    onClick={() => setUserMenuOpen(!userMenuOpen)} 
                    variant="outline" 
                    className="border-amber-600 text-amber-600 hover:bg-amber-50"
                  >
                    <User className="h-4 w-4 mr-2" />
                    {user.first_name}
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                  
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                      {user.role === 'admin' ? (
                        <button
                          onClick={() => window.location.href = '/admin'}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-amber-50"
                        >
                          <User className="inline h-4 w-4 mr-2" />
                          Panneau Admin
                        </button>
                      ) : (
                        <button
                          onClick={() => window.location.href = '/my-appointments'}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-amber-50"
                        >
                          <Calendar className="inline h-4 w-4 mr-2" />
                          Mes Rendez-vous
                        </button>
                      )}
                      <hr className="my-1" />
                      <button
                        onClick={() => { logout(); window.location.href = '/'; }}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="inline h-4 w-4 mr-2" />
                        Déconnexion
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Button onClick={() => window.location.href = '/login'} variant="outline" className="border-amber-600 text-amber-600 hover:bg-amber-50">
                  <User className="h-4 w-4 mr-2" />
                  Connexion
                </Button>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-gray-700">
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <a href="#accueil" className="block px-3 py-2 text-gray-700 hover:bg-amber-50 rounded-md">Accueil</a>
              <a href="#services" className="block px-3 py-2 text-gray-700 hover:bg-amber-50 rounded-md">Services</a>
              <a href="#equipe" className="block px-3 py-2 text-gray-700 hover:bg-amber-50 rounded-md">Notre Équipe</a>
              <a href="#galerie" className="block px-3 py-2 text-gray-700 hover:bg-amber-50 rounded-md">Galerie</a>
              <a href="#contact" className="block px-3 py-2 text-gray-700 hover:bg-amber-50 rounded-md">Contact</a>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section id="accueil" className="pt-16 relative h-screen">
        <div className="absolute inset-0">
          <img src={salonInterior1} alt="Salon" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40"></div>
        </div>
        <div className="relative h-full flex items-center justify-center text-center px-4">
          <div className="max-w-4xl">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 animate-fade-in">
              Réservez en beauté
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8">
              Simple • Immédiat • 24h/24
            </p>
            <Button 
              onClick={() => window.location.href = user ? '/booking' : '/auth-choice'} 
              size="lg" 
              className="bg-amber-600 hover:bg-amber-700 text-lg px-8 py-6 animate-fade-in-up"
            >
              <Calendar className="mr-2 h-5 w-5" />
              Prendre rendez-vous
            </Button>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Nos Services</h2>
            <p className="text-xl text-gray-600">Des prestations de qualité pour sublimer votre style</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { name: 'Coupe Femme', price: '45€', duration: '45 min', desc: 'Coupe personnalisée avec brushing' },
              { name: 'Coupe Homme', price: '28€', duration: '30 min', desc: 'Coupe moderne et tendance' },
              { name: 'Coloration', price: '65€', duration: '90 min', desc: 'Coloration complète avec soin' },
              { name: 'Balayage', price: '85€', duration: '120 min', desc: 'Balayage naturel et lumineux' },
              { name: 'Brushing', price: '30€', duration: '30 min', desc: 'Mise en forme professionnelle' },
              { name: 'Soin Capillaire', price: '35€', duration: '45 min', desc: 'Soin réparateur en profondeur' },
            ].map((service, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow duration-300">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">{service.name}</h3>
                  <span className="text-2xl font-bold text-amber-600">{service.price}</span>
                </div>
                <p className="text-gray-600 mb-4">{service.desc}</p>
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="h-4 w-4 mr-2" />
                  {service.duration}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section id="equipe" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Notre Équipe</h2>
            <p className="text-xl text-gray-600">Des professionnels passionnés à votre service</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {teamMembers.map((member) => (
              <div key={member.id} className="text-center group">
                <div className="relative overflow-hidden rounded-lg mb-4">
                  <img
                    src={member.photo_url ? member.photo_url : hairdresser1}
                    alt={`${member.first_name} ${member.last_name}`}
                    className="w-full h-80 object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-1">{member.first_name} {member.last_name}</h3>
                <p className="text-amber-600 font-medium mb-2">{member.position}</p>
                {member.years_experience > 0 && (
                  <p className="text-gray-600 text-sm">{member.years_experience} ans d'expérience</p>
                )}
                <div className="flex justify-center mt-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section id="galerie" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Galerie</h2>
            <p className="text-xl text-gray-600">Découvrez notre salon et nos réalisations</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {galleryItems.map((item, index) => (
              <div key={item.id || index} className="relative overflow-hidden rounded-lg group cursor-pointer h-64">
                <img
                  src={item.src}
                  alt={item.title || `Galerie ${index + 1}`}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  onError={(e) => {
                    e.currentTarget.src = [salonInterior1, salonInterior2, salonInterior3][index % 3]
                  }}
                />
                {item.title && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-sm px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.title}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Nous Contacter</h2>
            <p className="text-xl text-gray-600">Nous sommes là pour vous</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">Informations</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <MapPin className="h-6 w-6 text-amber-600 mr-3 mt-1" />
                  <div>
                    <p className="font-medium text-gray-900">Adresse</p>
                    <p className="text-gray-600">123 Avenue des Champs-Élysées<br />75008 Paris, France</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Phone className="h-6 w-6 text-amber-600 mr-3 mt-1" />
                  <div>
                    <p className="font-medium text-gray-900">Téléphone</p>
                    <p className="text-gray-600">01 23 45 67 89</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Mail className="h-6 w-6 text-amber-600 mr-3 mt-1" />
                  <div>
                    <p className="font-medium text-gray-900">Email</p>
                    <p className="text-gray-600">contact@elegance-coiffure.fr</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Clock className="h-6 w-6 text-amber-600 mr-3 mt-1" />
                  <div>
                    <p className="font-medium text-gray-900">Horaires</p>
                    <p className="text-gray-600">
                      Lundi - Samedi: 9h00 - 19h00<br />
                      Dimanche: Fermé
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-8">
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">Envoyez-nous un message</h3>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nom complet</label>
                  <input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input type="email" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                  <textarea rows="4" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent"></textarea>
                </div>
                <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700">
                  Envoyer
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <Scissors className="h-8 w-8 text-amber-600" />
                <span className="ml-2 text-2xl font-bold">Élégance Coiffure</span>
              </div>
              <p className="text-gray-400">Votre salon de coiffure de confiance depuis 2010</p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Liens rapides</h4>
              <ul className="space-y-2">
                <li><a href="#accueil" className="text-gray-400 hover:text-amber-600 transition-colors">Accueil</a></li>
                <li><a href="#services" className="text-gray-400 hover:text-amber-600 transition-colors">Services</a></li>
                <li><a href="#equipe" className="text-gray-400 hover:text-amber-600 transition-colors">Notre Équipe</a></li>
                <li><a href="#contact" className="text-gray-400 hover:text-amber-600 transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Suivez-nous</h4>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-amber-600 transition-colors">Facebook</a>
                <a href="#" className="text-gray-400 hover:text-amber-600 transition-colors">Instagram</a>
                <a href="#" className="text-gray-400 hover:text-amber-600 transition-colors">TikTok</a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Élégance Coiffure. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Page de connexion
function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    const result = await login(email, password)
    if (result.success) {
      // Vérifier s'il y a une redirection enregistrée
      const redirectTo = localStorage.getItem('redirectAfterLogin')
      if (redirectTo) {
        localStorage.removeItem('redirectAfterLogin')
        window.location.href = redirectTo
      } else {
        window.location.href = result.user.role === 'admin' ? '/admin' : '/'
      }
    } else {
      setError(result.error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Scissors className="h-12 w-12 text-amber-600 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-900">Connexion</h2>
          <p className="text-gray-600 mt-2">Accédez à votre compte</p>
        </div>
        
        {/* Encadré Inscription en haut */}
        <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-amber-100 border-2 border-amber-300 rounded-lg">
          <p className="text-center text-gray-800 font-medium mb-2">
            🆕 Vous n'avez pas encore de compte ?
          </p>
          <Button 
            onClick={() => window.location.href = '/register'} 
            className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 font-semibold"
          >
            ✨ Créer un compte gratuitement
          </Button>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
            <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700">
              Se connecter
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <Button onClick={() => window.location.href = '/'} variant="ghost" className="text-gray-600">
              ← Retour à l'accueil
            </Button>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-800 font-medium mb-2">Comptes de démonstration :</p>
            <p className="text-xs text-blue-700">Admin: admin@elegance-coiffure.fr / admin123</p>
            <p className="text-xs text-blue-700">Client: client@test.fr / client123</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// App principal avec Router
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/auth-choice" element={<AuthChoice />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<Register />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/my-appointments" element={<MyAppointments />} />
          <Route path="/admin" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/admin/services" element={<ProtectedRoute><Services /></ProtectedRoute>} />
          <Route path="/admin/appointments" element={<ProtectedRoute><Appointments /></ProtectedRoute>} />
          <Route path="/admin/calendar" element={<ProtectedRoute><CalendarView /></ProtectedRoute>} />
          <Route path="/admin/employees" element={<ProtectedRoute><Employees /></ProtectedRoute>} />
          <Route path="/admin/clients" element={<ProtectedRoute><Clients /></ProtectedRoute>} />
          <Route path="/admin/hours" element={<ProtectedRoute><Hours /></ProtectedRoute>} />
          <Route path="/admin/gallery" element={<ProtectedRoute><Gallery /></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App

