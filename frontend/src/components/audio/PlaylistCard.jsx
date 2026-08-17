import { Globe, Lock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import defaultCover from '../../assets/hero.png'

export function PlaylistCard({ playlist }) {
  const navigate = useNavigate()
  // Utilisation de l'image de la playlist ou image par défaut
  const cover = playlist.image || defaultCover

  const handleClick = () => {
    // Navigation vers la page des albums avec l'ID en paramètre
    navigate(`/albums/${playlist.id}`)
  }

  return (
    <div 
      onClick={handleClick}
      className="group bg-bg-card border border-border-subtle rounded-2xl p-3 hover:border-yellow-accent/40 transition-all duration-300 shadow-sm cursor-pointer flex flex-col h-full"
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-xl mb-3 bg-bg-main">
        <img 
          src={cover} 
          alt={playlist.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {/* Affichage conditionnel basé sur isPublic envoyé par le backend */}
        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-full text-[10px] font-medium text-white flex items-center gap-1 border border-white/10 shadow-sm">
          {playlist.isPublic ? (
            <Globe size={12} className="text-yellow-accent" />
          ) : (
            <Lock size={12} className="text-gray-400" />
          )}
        </div>
      </div>
      <h4 className="font-bold text-txt-primary text-sm truncate group-hover:text-yellow-accent transition-colors">
        {playlist.title}
      </h4>
      <p className="text-xs text-txt-muted mt-1">
        {playlist.tracksCount || 0} audios
      </p>
    </div>
  )
}