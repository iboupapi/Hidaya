import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Flame, BookOpen, Radio, Music, ListMusic } from 'lucide-react'
import { homeAPI } from '../../services/api'
import { AudioCard } from '../../components/audio/AudioCard'
import { UnlockModal } from '../../components/audio/UnlockModal'
import { PlaylistCard } from '../../components/audio/PlaylistCard'
import toast from 'react-hot-toast'

const SECTION_CONFIG = {
  'most-played': { title: 'Les plus écoutés', icon: Flame },
  'enseignements': { title: 'Enseignements', icon: BookOpen },
  'emissions': { title: 'Émissions', icon: Radio },
  'musiques': { title: 'Musique spirituelle', icon: Music },
  'playlists': { title: 'Playlists & Albums', icon: ListMusic, type: 'playlist' },
}

const MAX_ITEMS_LIMIT = 24 // Limite raisonnable pour garder une vue fluide et rapide

export default function SeeAll() {
  const { section } = useParams()
  const navigate = useNavigate()
  const [audios, setAudios] = useState([])
  const [loading, setLoading] = useState(true)
  const [locked, setLocked] = useState(null)

  const config = SECTION_CONFIG[section] || { title: 'Explorer', icon: BookOpen }
  const Icon = config.icon

  useEffect(() => {
    const fetchSectionData = async () => {
      setLoading(true)
      try {
        const { data } = await homeAPI.getFeed()
        const feed = data.data

        let items = []
        if (section === 'most-played') {
          items = feed.mostPlayed || []
        } else if (section === 'enseignements') {
          items = feed.enseignements?.all || feed.enseignements || []
        } else if (section === 'emissions') {
          items = feed.emissions || []
        } else if (section === 'musiques') {
          items = feed.musiques || []
        } else if (section === 'playlists') {
          items = feed.playlists || []
        }
        setAudios(items)
      } catch (err) {
        toast.error("Erreur lors du chargement des audios")
      } finally {
        setLoading(false)
      }
    }

    fetchSectionData()
  }, [section])

  // Limitation à un nombre raisonnable d'éléments
  const displayedAudios = audios.slice(0, MAX_ITEMS_LIMIT)

  return (
    <div className="min-h-screen bg-gradient-to-b from-bg-main via-bg-main to-bg-card/20 w-full px-4 md:px-8 pt-6">
      {/* En-tête avec bouton retour */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-bg-card border border-border-subtle flex items-center justify-center text-txt-muted hover:text-yellow-accent transition-all shadow-sm cursor-pointer"
          title="Retour"
        >
          <ChevronLeft size={22} />
        </button>
        <h1 className="text-xl md:text-2xl font-bold text-txt-primary flex items-center gap-2">
          <Icon size={24} className="text-yellow-accent" />
          {config.title}
        </h1>
      </div>
        {config.type === 'playlist' ? (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
    {displayedAudios.map((playlist) => (
      <PlaylistCard key={playlist.id} playlist={playlist} />
    ))}
  </div>
) : (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
    {displayedAudios.map((audio) => (
      <AudioCard
        key={audio.id}
        audio={audio}
        variant="compact"
        isFavorite={audio.isFavorite}
        onLocked={setLocked}
      />
    ))}
  </div>
)}
      {/* Grille des audios avec cartes compactes */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-20 bg-bg-card/60 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : displayedAudios.length === 0 ? (
        <div className="text-center py-24 border border-border-subtle bg-bg-card/30 rounded-3xl">
          <p className="text-txt-muted font-medium text-sm">
            Aucun audio disponible dans cette section pour le moment.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {displayedAudios.map((audio) => (
            <AudioCard
              key={audio.id}
              audio={audio}
              variant="compact"
              isFavorite={audio.isFavorite}
              onLocked={setLocked}
            />
          ))}
        </div>
      )}

      {locked && (
        <UnlockModal
          audio={locked}
          onClose={() => setLocked(null)}
          onUnlocked={() => setLocked(null)}
        />
      )}
    </div>
  )
}