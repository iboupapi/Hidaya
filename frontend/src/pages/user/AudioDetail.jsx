import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Play, Pause, Heart, Lock, Music, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'
import { audioAPI, favoriteAPI } from '../../services/api'
import { usePlayer } from '../../context/PlayerContext'
import { UnlockModal } from '../../components/audio/UnlockModal'

const CAT_STYLE = {
  Enseignement: 'text-green-200 bg-green-900/60',
  Emission: 'text-yellow-accent bg-green-800/60',
  'Musique spirituelle': 'text-green-300 bg-green-900/60',
}

function formatDate(iso) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function AudioDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentTrack, isPlaying, play, togglePlay } = usePlayer()

  const [audio, setAudio] = useState(null)
  const [loading, setLoading] = useState(true)
  const [locked, setLocked] = useState(false)
  const [isFav, setIsFav] = useState(false)
  const [favLoading, setFavLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setLocked(false)
    try {
      const [audioRes, favRes] = await Promise.all([
        audioAPI.getById(id),
        favoriteAPI.getAll().catch(() => ({ data: { favorites: [] } })),
      ])
      setAudio(audioRes.data.audio)
      const favs = favRes.data.favorites || []
      setIsFav(favs.some((f) => f.id === Number(id) || f.audioId === Number(id)))
    } catch (err) {
      if (err.response?.status === 403) {
        setLocked(true)
      } else {
        toast.error(err.response?.data?.error || 'Impossible de charger cet audio')
      }
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  const isActive = currentTrack?.id === audio?.id
  const isPlayingNow = isActive && isPlaying

  const handlePlayAction = () => {
    if (!audio) return
    if (isActive) {
      togglePlay()
    } else {
      play(audio)
    }
  }

  const handleToggleFavorite = async () => {
    if (favLoading || !audio) return
    setFavLoading(true)
    try {
      if (isFav) {
        await favoriteAPI.remove(audio.id)
        setIsFav(false)
        toast.success('Retiré des favoris')
      } else {
        await favoriteAPI.add(audio.id)
        setIsFav(true)
        toast.success('Ajouté aux favoris')
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la mise à jour des favoris')
    } finally {
      setFavLoading(false)
    }
  }

  return (
    <div className="min-h-screen pb-36">
      {/* Barre de navigation supérieure */}
      <div className="px-4 pt-6 pb-2 max-w-lg mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-bg-card border border-border-subtle flex items-center justify-center text-txt-muted hover:text-yellow-accent hover:border-green-dahira transition-colors"
          title="Retour"
        >
          <ArrowLeft size={18} />
        </button>
      </div>

      <div className="max-w-lg mx-auto px-4">
        {loading ? (
          <div className="flex flex-col items-center gap-4 py-16">
            <div className="w-48 h-48 rounded-2xl bg-bg-card border border-border-subtle animate-pulse" />
            <div className="h-4 w-40 bg-bg-card rounded animate-pulse" />
          </div>
        ) : locked ? (
          <div className="flex flex-col items-center text-center gap-4 py-16">
            <div className="w-20 h-20 rounded-full bg-[#1A3A1A] border border-green-dahira/40 flex items-center justify-center">
              <Lock size={28} className="text-yellow-accent" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-txt-primary mb-1">
                Contenu protégé
              </h1>
              <p className="text-txt-muted text-sm">
                Cet audio fait partie d'un album privé. Entre le code d'accès pour l'écouter.
              </p>
            </div>
            <button
              onClick={() => setLocked('modal')}
              className="btn-primary px-6 active:scale-[0.98] transition-transform"
            >
              Entrer le code d'accès
            </button>
          </div>
        ) : !audio ? (
          <div className="text-center py-24 border border-border-subtle bg-bg-card/30 rounded-2xl">
            <p className="text-txt-muted font-medium text-sm">Audio introuvable</p>
          </div>
        ) : (
          <>
            {/* Pochette de l'audio */}
            <div className="flex justify-center mb-6">
              {audio.image ? (
                <img
                  src={audio.image}
                  alt={audio.title}
                  className="w-48 h-48 rounded-2xl object-cover border border-border-subtle shadow-lg"
                />
              ) : (
                <div className="w-48 h-48 rounded-2xl bg-[#1A3A1A] border border-border-subtle flex items-center justify-center">
                  <Music size={48} className="text-txt-disabled" />
                </div>
              )}
            </div>

            {/* Titre et métadonnées */}
            <div className="text-center mb-6">
              <h1 className="text-xl font-bold text-txt-primary mb-2">
                {audio.title}
              </h1>
              <div className="flex items-center justify-center gap-2">
                <span
                  className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${
                    CAT_STYLE[audio.category] || 'text-txt-muted bg-bg-secondary'
                  }`}
                >
                  {audio.subCategory || audio.category}
                </span>
                {audio.createdAt && (
                  <span className="text-[11px] text-txt-muted flex items-center gap-1">
                    <Calendar size={11} /> {formatDate(audio.createdAt)}
                  </span>
                )}
              </div>
            </div>

            {/* Actions principales (Favoris et Lecture) */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <button
                onClick={handleToggleFavorite}
                disabled={favLoading}
                className="w-12 h-12 rounded-full bg-bg-card border border-border-subtle flex items-center justify-center hover:border-red-400/50 transition-colors disabled:opacity-50"
                title={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              >
                <Heart
                  size={20}
                  className={isFav ? 'text-red-500 fill-red-500' : 'text-txt-muted'}
                />
              </button>

              <button
                onClick={handlePlayAction}
                className="w-16 h-16 rounded-full bg-green-dahira flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                title={isPlayingNow ? 'Pause' : 'Lire'}
              >
                {isPlayingNow ? (
                  <Pause size={26} className="text-yellow-accent fill-current" />
                ) : (
                  <Play size={26} className="text-yellow-accent fill-current ml-1" />
                )}
              </button>

              <div className="w-12 h-12" /> {/* Espace de balancement visuel */}
            </div>

            {/* Description du contenu */}
            {audio.description && (
              <div className="bg-bg-card border border-border-subtle rounded-2xl p-4">
                <h2 className="text-xs font-semibold text-txt-muted uppercase tracking-wide mb-2">
                  Description
                </h2>
                <p className="text-sm text-txt-secondary leading-relaxed whitespace-pre-line">
                  {audio.description}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal d'accès sécurisé */}
      {locked === 'modal' && (
        <UnlockModal
          audio={audio || { title: 'cet audio' }}
          onClose={() => setLocked(true)}
          onUnlocked={() => {
            setLocked(false)
            load()
          }}
        />
      )}
    </div>
  )
}