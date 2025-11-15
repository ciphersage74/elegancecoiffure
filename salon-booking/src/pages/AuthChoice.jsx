import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button.jsx'
import { Scissors, User, UserPlus, ArrowLeft } from 'lucide-react'

export default function AuthChoice() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <Scissors className="h-16 w-16 text-amber-600 mx-auto mb-6 animate-pulse" />
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Bienvenue chez Élégance Coiffure
          </h1>
          <p className="text-xl text-gray-600">
            Pour prendre rendez-vous, veuillez vous connecter ou créer un compte
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Carte Connexion */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-gray-100 hover:border-amber-300 hover:shadow-2xl transition-all duration-300">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="h-10 w-10 text-amber-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                J'ai déjà un compte
              </h2>
              <p className="text-gray-600">
                Connectez-vous pour accéder à vos rendez-vous
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center text-sm text-gray-600">
                <div className="w-2 h-2 bg-amber-600 rounded-full mr-3"></div>
                Accès rapide à vos rendez-vous
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <div className="w-2 h-2 bg-amber-600 rounded-full mr-3"></div>
                Historique de vos visites
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <div className="w-2 h-2 bg-amber-600 rounded-full mr-3"></div>
                Réservation en quelques clics
              </div>
            </div>

            <Button
              onClick={() => navigate('/login')}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-6 text-lg"
            >
              <User className="mr-2 h-5 w-5" />
              Se connecter
            </Button>
          </div>

          {/* Carte Inscription */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-amber-200 hover:border-amber-400 hover:shadow-2xl transition-all duration-300">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-amber-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserPlus className="h-10 w-10 text-amber-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Nouveau client
              </h2>
              <p className="text-gray-600">
                Créez votre compte en moins de 2 minutes
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-600 rounded-full mr-3"></div>
                Inscription gratuite et rapide
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-600 rounded-full mr-3"></div>
                Gérez vos rendez-vous en ligne
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-600 rounded-full mr-3"></div>
                Recevez des notifications
              </div>
            </div>

            <Button
              onClick={() => navigate('/register')}
              className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-semibold py-6 text-lg shadow-lg"
            >
              <UserPlus className="mr-2 h-5 w-5" />
              Créer un compte
            </Button>

            <p className="text-xs text-center text-gray-500 mt-4">
              ⚡ Inscription en 2 minutes seulement
            </p>
          </div>
        </div>

        {/* Bouton retour */}
        <div className="text-center">
          <Button
            onClick={() => navigate('/')}
            variant="ghost"
            className="text-gray-600 hover:text-amber-600"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à l'accueil
          </Button>
        </div>

        {/* Comptes de démo */}
        <div className="mt-8 p-6 bg-blue-50 rounded-xl border border-blue-200">
          <p className="text-sm text-blue-800 font-semibold mb-3 text-center">
            🎯 Comptes de démonstration (pour tester)
          </p>
          <div className="grid md:grid-cols-2 gap-4 text-xs">
            <div className="bg-white p-3 rounded-lg">
              <p className="font-semibold text-blue-900 mb-1">👤 Compte Client</p>
              <p className="text-blue-700">Email: client@test.fr</p>
              <p className="text-blue-700">Mot de passe: client123</p>
            </div>
            <div className="bg-white p-3 rounded-lg">
              <p className="font-semibold text-blue-900 mb-1">👨‍💼 Compte Admin</p>
              <p className="text-blue-700">Email: admin@elegance-coiffure.fr</p>
              <p className="text-blue-700">Mot de passe: admin123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

