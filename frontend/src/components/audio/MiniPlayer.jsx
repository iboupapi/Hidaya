import { Play, Pause, SkipBack, SkipForward, X } from 'lucide-react'
import { usePlayer } from '../../context/PlayerContext'

export function MiniPlayer() {
  const {
    currentTrack,
    isPlaying,
    progress,
    duration,
    togglePlay,
    seek,
    playNext,
    playPrevious,
    closePlayer, // <-- Récupération de la méthode de fermeture
    fmt
  } = usePlayer()

  if (!currentTrack) return null

  const pct = duration ? Math.min(Math.max((progress / duration) * 100, 0), 100) : 0

  const handleSeekClick = (e) => {
    if (!duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const newTime = (clickX / rect.width) * duration
    seek(newTime)
  }

  return (
    <div className="fixed bottom-[60px] left-0 right-0 z-30 px-3 pb-1 transition-all duration-300">
      <div className="relative max-w-lg mx-auto bg-[#1A4A1A] border border-green-dahira rounded-2xl px-4 py-3 shadow-2xl">
        
        {/* Bouton pour fermer/masquer le lecteur */}
        <button
          onClick={closePlayer}
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-bg-card border border-border-default flex items-center justify-center text-txt-muted hover:text-red-400 hover:border-red-400/40 transition-colors shadow-md"
          title="Fermer le lecteur"
        >
          <X size={12} />
        </button>

        <div className="flex items-center gap-3">
          {/* Jaquette ou fallback d'icône */}
          {currentTrack.image && (
            <img
              src={currentTrack.image}
              alt={currentTrack.title}
              className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-green-dahira/40"
            />
          )}

          {/* Titre et sous-catégorie */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-txt-primary truncate">
              {currentTrack.title}
            </p>
            <p className="text-xs text-txt-muted truncate">
              {currentTrack.subCategory || currentTrack.category}
            </p>
          </div>

          {/* Contrôles de lecture */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={playPrevious}
              className="p-1.5 text-txt-muted hover:text-txt-primary transition-colors"
              title="Précédent"
            >
              <SkipBack size={18} />
            </button>

            <button
              onClick={togglePlay}
              className="w-10 h-10 rounded-full bg-yellow-accent flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
              title={isPlaying ? "Pause" : "Lire"}
            >
              {isPlaying ? (
                <Pause size={18} className="text-bg-primary fill-current" />
              ) : (
                <Play size={18} className="text-bg-primary fill-current ml-0.5" />
              )}
            </button>

            <button
              onClick={playNext}
              className="p-1.5 text-txt-muted hover:text-txt-primary transition-colors"
              title="Suivant"
            >
              <SkipForward size={18} />
            </button>
          </div>
        </div>

        {/* Barre de progression & chronomètre */}
        <div className="mt-2.5 flex items-center gap-2">
          <span className="text-[10px] text-txt-muted w-8 text-left font-mono">
            {fmt(progress)}
          </span>
          <div
            className="flex-1 h-1.5 bg-[#0A2A0A] rounded-full cursor-pointer relative overflow-hidden group py-1"
            onClick={handleSeekClick}
          >
            <div className="h-full bg-yellow-accent rounded-full transition-all duration-150" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-[10px] text-txt-muted w-8 text-right font-mono">
            {fmt(duration)}
          </span>
        </div>
      </div>
    </div>
  )
}