import { useState, useEffect, useCallback } from 'react'
import { LogOut, User, Shield, ChevronRight, Heart } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { favoriteAPI } from '../../services/api'
import { AudioCard } from '../../components/audio/AudioCard'
import { UnlockModal } from '../../components/audio/UnlockModal'

const ROLE = {
  user: 'Disciple',
  admin: 'Administrateur',
  superadmin: 'Super Admin',
}

export default function Profile() {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [favorites, setFavorites] = useState([])
  const [loadingFavs, setLoadingFavs] = useState(true)
  const [locked, setLocked] = useState(null)

  const loadFavorites = useCallback(async () => {
    try {
      const { data } = await favoriteAPI.getAll()
      setFavorites(data.favorites || [])
    } catch {
      // Ignorer silencieusement si les favoris sont vides ou non configurés
    } finally {
      setLoadingFavs(false)
    }
  }, [])

  useEffect(() => {
    loadFavorites()
  }, [loadFavorites])

  // Gestion du retrait/ajout des favoris
  const handleFavoriteToggle = async (audioId) => {
    try {
      await favoriteAPI.toggle(audioId)
      loadFavorites()
    } catch {
      toast.error('Impossible de modifier les favoris')
    }
  }

  const handleLogout = async () => {
    await logout()
    toast.success('À bientôt !')
    navigate('/login')
  }

  const initialLetter = user?.username ? user.username[0].toUpperCase() : 'D'

  return (
    <div className="min-h-screen">
      {/* Header fixe avec effet Blur */}
      <div className="sticky top-0 z-20 bg-bg-primary/95 backdrop-blur-md border-b border-border-subtle px-4 py-3.5">
        <div className="max-w-lg mx-auto flex items-center gap-2">
          <User size={18} className="text-yellow-accent" />
          <h1 className="text-base font-semibold text-txt-primary">Profil</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-6">
        {/* Identité Utilisateur */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-20 h-20 rounded-full bg-[#1A4A1A] border-2 border-green-dahira flex items-center justify-center mb-3 shadow-lg">
            <span className="text-yellow-accent font-bold text-2xl tracking-wider">
              {initialLetter}
            </span>
          </div>
          <h2 className="text-lg font-semibold text-txt-primary">{user?.username}</h2>
          <p className="text-txt-muted text-xs mt-0.5">{user?.email}</p>
          <span className="mt-2.5 px-3 py-0.5 text-[11px] font-semibold text-yellow-accent bg-[#0E2A0E] border border-green-dahira rounded-full">
            {ROLE[user?.role] || 'Disciple'}
          </span>
        </div>

        {/* Section Favoris */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Heart size={16} className="text-yellow-accent" fill="currentColor" />
              <h3 className="text-xs font-semibold text-txt-muted uppercase tracking-wider">
                Mes Favoris
              </h3>
            </div>
            {favorites.length > 0 && (
              <span className="text-xs text-txt-disabled">{favorites.length} audio(s)</span>
            )}
          </div>

          {loadingFavs ? (
            <div className="h-16 bg-bg-card rounded-2xl border border-border-subtle animate-pulse" />
          ) : favorites.length === 0 ? (
            <div className="p-6 bg-bg-card/40 border border-border-subtle rounded-2xl text-center">
              <p className="text-xs text-txt-muted font-medium">
                Aucun audio enregistré dans vos favoris
              </p>
              <p className="text-[11px] text-txt-disabled mt-1">
                Appuyez sur le cœur sur un audio pour l'ajouter ici.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {favorites.map((audio) => (
                <AudioCard
                  key={audio.id}
                  audio={audio}
                  variant="compact"
                  isFavorite={true}
                  onFavoriteToggle={handleFavoriteToggle}
                  onLocked={setLocked}
                />
              ))}
            </div>
          )}
        </div>

        {/* Action Panel Admin & Déconnexion */}
        <div className="flex flex-col gap-2.5">
          {isAdmin && (
            <button
              onClick={() => navigate('/admin')}
              className="flex items-center gap-3 p-4 bg-[#0E2A0E] border border-green-dahira rounded-2xl hover:bg-[#1A4A1A] active:scale-[0.98] transition-all"
            >
              <Shield size={18} className="text-yellow-accent" />
              <span className="text-sm font-medium text-txt-primary flex-1 text-left">
                Panneau d'administration
              </span>
              <ChevronRight size={16} className="text-txt-muted" />
            </button>
          )}

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 p-4 bg-bg-card border border-border-subtle rounded-2xl hover:border-red-900/50 active:scale-[0.98] transition-all"
          >
            <LogOut size={18} className="text-red-400" />
            <span className="text-sm font-medium text-red-400 flex-1 text-left">
              Se déconnecter
            </span>
          </button>
        </div>

        <p className="text-center text-txt-disabled text-xs mt-8">
          Hidaya v1.0 · Dahiratoul Imane
        </p>
      </div>

      {/* Modal de déverrouillage */}
      {locked && (
        <UnlockModal
          audio={locked}
          onClose={() => setLocked(null)}
          onUnlocked={() => {
            setLocked(null)
            loadFavorites()
          }}
        />
      )}
    </div>
  )
}