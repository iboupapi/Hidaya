import { useState } from 'react'
import { Play, Pause, Lock, Heart } from 'lucide-react'
import { usePlayer } from '../../context/PlayerContext'
import { favoriteAPI } from '../../services/api'
import defaultCover from '../../assets/default.jpg'
import { useNavigate } from 'react-router-dom'

const CAT_STYLE = {
  'Enseignement': 'text-green-200 bg-green-900/60',
  'Emission': 'text-yellow-accent bg-green-800/60',
  'Musique spirituelle': 'text-green-300 bg-green-900/60',
}

const DEFAULT_COVER = defaultCover

export function AudioCard({ 
  audio, 
  onLocked, 
  isFavorite: initialIsFav = false, 
  onFavoriteToggle,
  variant = 'card' 
}) {
  const navigate = useNavigate()
  const { currentTrack, isPlaying, play } = usePlayer()
  const [isFav, setIsFav] = useState(initialIsFav)
  const [favLoading, setFavLoading] = useState(false)

  const isActive = currentTrack?.id === audio.id
  const isPlayingNow = isActive && isPlaying
  
  // Utilisation directe de audio.image renvoyé par mapAudio()
  const coverUrl = audio.image || DEFAULT_COVER

  const handleClick = () => {
    if (audio.is_locked) {
      // Récupère l'ID de l'album associé à l'audio
      const playlistId = audio.playlistId || audio.playlist?.id || audio.playlists?.[0]?.id
      
      if (playlistId) {
        navigate(`/albums/${playlistId}`)
      } else {
        // Fallback si aucun album n'est trouvé
        onLocked?.(audio)
      }
      return
    }
    play(audio)
  }

  const handleToggleFavorite = async (e) => {
    e.stopPropagation()
    if (favLoading) return

    setFavLoading(true)
    try {
      if (isFav) {
        await favoriteAPI.remove(audio.id)
        setIsFav(false)
        onFavoriteToggle?.(audio.id, false)
      } else {
        await favoriteAPI.add(audio.id)
        setIsFav(true)
        onFavoriteToggle?.(audio.id, true)
      }
    } catch (err) {
      console.error("Erreur favoris :", err)
    } finally {
      setFavLoading(false)
    }
  }

  // --- VARIANT 1 : CARTE VERTICALE AVEC IMAGE (Style Spotify) ---
  if (variant === 'card') {
    return (
      <div 
        onClick={handleClick}
        className={`group relative p-3 rounded-2xl border cursor-pointer transition-all duration-300 flex flex-col h-full ${
          isActive
            ? 'bg-[#1A4A1A]/80 border-green-dahira shadow-lg'
            : 'bg-bg-card/70 border-border-subtle hover:border-border-default hover:bg-[#122A12]/80'
        }`}
      >
        {/* Pochettes d'album */}
        <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-3 bg-bg-main shadow-md">
          <img 
            src={coverUrl} 
            alt={audio.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />

          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center" />

          {/* Cadenas ou Favori */}
          <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
            {audio.is_locked ? (
              <div className="bg-black/70 backdrop-blur-md p-1.5 rounded-full text-yellow-accent border border-yellow-accent/30 shadow-sm">
                <Lock size={13} />
              </div>
            ) : (
              <button
                onClick={handleToggleFavorite}
                disabled={favLoading}
                className="bg-black/50 backdrop-blur-md p-1.5 rounded-full text-txt-muted hover:text-red-400 hover:scale-110 transition-all shadow-sm"
              >
                <Heart
                  size={14}
                  className={isFav ? "text-red-500 fill-red-500" : "text-white"}
                />
              </button>
            )}
          </div>

          {/* Bouton Play Floating */}
          <div className={`absolute bottom-3 right-3 w-10 h-10 rounded-full bg-yellow-accent text-bg-main flex items-center justify-center shadow-xl transform transition-all duration-300 ${
            isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100'
          }`}>
            {isPlayingNow ? (
              <Pause size={18} fill="currentColor" />
            ) : (
              <Play size={18} fill="currentColor" className="ml-0.5" />
            )}
          </div>
        </div>

        {/* Détails de l'audio */}
        <div className="flex flex-col flex-grow justify-between">
          <div>
            <h3 className={`text-sm font-bold line-clamp-1 transition-colors ${
              isActive ? 'text-yellow-accent' : 'text-txt-primary group-hover:text-yellow-accent'
            }`}>
              {audio.title}
            </h3>
            <p className="text-xs text-txt-muted line-clamp-1 mt-0.5">
              {audio.description || audio.speaker || 'Rappel spirituel'}
            </p>
          </div>

          <div className="mt-2.5 flex items-center gap-2">
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                CAT_STYLE[audio.category] || 'text-txt-muted bg-bg-secondary'
              }`}
            >
              {audio.subCategory || audio.category}
            </span>
          </div>
        </div>
      </div>
    )
  }

  // --- VARIANT 2 : BARRETTE HORIZONTALE COMPACTE ---
  return (
    <div
      onClick={handleClick}
      className={`group flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
        isActive
          ? 'bg-[#1A4A1A] border-green-dahira shadow-md'
          : 'bg-bg-card border-border-subtle hover:border-border-default hover:bg-[#122A12]'
      }`}
    >
      <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-bg-main">
        <img 
          src={coverUrl} 
          alt={audio.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className={`absolute inset-0 flex items-center justify-center transition-colors ${
          isActive ? 'bg-black/40' : 'bg-black/20 group-hover:bg-black/40'
        }`}>
          {audio.is_locked ? (
            <Lock size={14} className="text-yellow-accent" />
          ) : isPlayingNow ? (
            <Pause size={14} className="text-yellow-accent fill-current" />
          ) : (
            <Play
              size={14}
              className={isActive ? 'text-yellow-accent fill-current' : 'text-white/90 fill-current ml-0.5'}
            />
          )}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <p
          className={`text-xs md:text-sm font-medium truncate transition-colors ${
            isActive ? 'text-yellow-accent font-semibold' : 'text-txt-primary'
          }`}
        >
          {audio.title}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
              CAT_STYLE[audio.category] || 'text-txt-muted bg-bg-secondary'
            }`}
          >
            {audio.subCategory || audio.category}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        {audio.is_locked ? (
          <div className="w-7 h-7 rounded-full bg-bg-secondary border border-border-subtle flex items-center justify-center">
            <Lock size={12} className="text-txt-disabled" />
          </div>
        ) : (
          <button
            onClick={handleToggleFavorite}
            disabled={favLoading}
            className="p-1.5 rounded-full hover:bg-white/5 transition-colors text-txt-muted hover:text-red-400"
            title={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
          >
            <Heart
              size={16}
              className={isFav ? "text-red-500 fill-red-500" : "text-txt-muted"}
            />
          </button>
        )}
      </div>
    </div>
  )
}