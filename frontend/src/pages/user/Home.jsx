import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Sparkles, Moon, Flame, ChevronRight, Search as SearchIcon, Play, Pause, Radio, Music, BookOpen, Lock, ListMusic } from 'lucide-react'
import toast from 'react-hot-toast'
import { homeAPI, audioAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { usePlayer } from '../../context/PlayerContext'
import { AudioCard } from '../../components/audio/AudioCard'
import { PlaylistCard } from '../../components/audio/PlaylistCard'
import { UnlockModal } from '../../components/audio/UnlockModal'
import defaultCover from '../../assets/hero.png'

const DEFAULT_COVER = defaultCover

function Section({ title, icon: Icon, audios, sectionKey, isPlaylist = false, setLocked }) {
  const navigate = useNavigate()
  
  const limitedAudios = audios?.slice(0, 10)
  if (!limitedAudios || limitedAudios.length === 0) return null

  // Redirige vers /library si c'est la section playlists, sinon vers /see-all/...
  const handleSeeAllClick = () => {
    if (isPlaylist) {
      navigate('/library')
    } else {
      navigate(`/see-all/${sectionKey}`)
    }
  }

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg md:text-xl font-bold text-txt-primary flex items-center gap-2">
          {Icon && <Icon size={20} className="text-yellow-accent" />}
          {title}
        </h2>
        <button 
          onClick={handleSeeAllClick}
          className="text-xs md:text-sm font-semibold text-txt-muted hover:text-yellow-accent flex items-center gap-0.5 transition-colors cursor-pointer"
        >
          Voir tout <ChevronRight size={16} />
        </button>
      </div>

      <div className="flex gap-4 md:gap-5 overflow-x-auto pb-4 pt-1 scrollbar-none -mx-4 px-4 md:-mx-8 md:px-8 snap-x snap-mandatory">
        {limitedAudios.map((item) => (
          <div key={item.id} className="snap-start shrink-0 w-40 sm:w-48 md:w-52">
            {isPlaylist ? (
              <PlaylistCard playlist={item} />
            ) : (
              <AudioCard
                audio={item}
                variant="card"
                isFavorite={item.isFavorite}
                onLocked={setLocked}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Home() {
  const { user } = useAuth()
  const { currentTrack, isPlaying, play, togglePlay } = usePlayer()
  const [feed, setFeed] = useState(null)
  const [loading, setLoading] = useState(true)
  const [locked, setLocked] = useState(null)

  const loadFeed = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await homeAPI.getFeed()
      setFeed(data.data)
    } catch (err) {
      toast.error(err.response?.data?.error || "Impossible de charger la page d'accueil")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadFeed()
  }, [loadFeed])

  const featuredAudio = useMemo(() => {
    const enseignementsList = feed?.enseignements?.all || feed?.enseignements

    if (!Array.isArray(enseignementsList) || enseignementsList.length === 0) {
      return feed?.mostPlayed?.[0] || null
    }

    const STORAGE_KEY_ID = 'hero_daily_audio_id'
    const STORAGE_KEY_TIME = 'hero_daily_audio_timestamp'
    const ONE_DAY_MS = 24 * 60 * 60 * 1000

    const savedId = localStorage.getItem(STORAGE_KEY_ID)
    const savedTimestamp = localStorage.getItem(STORAGE_KEY_TIME)
    const now = Date.now()

    if (savedId && savedTimestamp && now - Number(savedTimestamp) < ONE_DAY_MS) {
      const existingAudio = enseignementsList.find((a) => String(a.id) === String(savedId))
      if (existingAudio) {
        return existingAudio
      }
    }

    const randomIndex = Math.floor(Math.random() * enseignementsList.length)
    const selectedAudio = enseignementsList[randomIndex]

    localStorage.setItem(STORAGE_KEY_ID, selectedAudio.id)
    localStorage.setItem(STORAGE_KEY_TIME, now.toString())

    return selectedAudio
  }, [feed])

  const heroCover = DEFAULT_COVER
  const isHeroPlaying = featuredAudio && currentTrack?.id === featuredAudio.id && isPlaying

  const handleHeroPlay = () => {
    if (!featuredAudio) return

    const isLocked = featuredAudio.isLocked || featuredAudio.is_locked
    if (isLocked) {
      setLocked(featuredAudio)
      return
    }

    if (currentTrack?.id === featuredAudio.id) {
      togglePlay()
    } else {
      play(featuredAudio)
      audioAPI.incrementPlay(featuredAudio.id).catch(() => {})
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-bg-main via-bg-main to-bg-card/20 w-full">
      
      {/* Topbar */}
      <div className="sticky top-0 z-20 backdrop-blur-xl bg-bg-main/80 px-4 md:px-8 py-4 w-full flex items-center justify-between border-b border-border-subtle/40">
        <div>
          <span className="text-xs md:text-sm font-semibold text-yellow-accent flex items-center gap-1.5">
            <Moon size={16} /> Salam Alaykoum{user?.username ? `, ${user.username}` : ''}
          </span>
          <h1 className="text-xl md:text-2xl font-bold text-txt-primary">Découvrir</h1>
        </div>

        <Link
          to="/search"
          className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-bg-card border border-border-subtle flex items-center justify-center text-txt-muted hover:text-yellow-accent hover:border-yellow-accent/40 transition-all shadow-sm"
          title="Rechercher"
        >
          <SearchIcon size={20} />
        </Link>
      </div>

      <div className="w-full px-4 md:px-8 pt-6">
        {loading ? (
          <div className="space-y-8">
            <div className="h-64 md:h-80 w-full bg-bg-card/60 rounded-3xl animate-pulse" />
            <div className="h-6 w-48 bg-bg-card/60 rounded animate-pulse" />
            <div className="flex gap-4 overflow-hidden">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-44 h-60 bg-bg-card/60 rounded-2xl animate-pulse shrink-0" />
              ))}
            </div>
          </div>
        ) : !feed ? (
          <div className="text-center py-24 border border-border-subtle bg-bg-card/30 rounded-3xl">
            <p className="text-txt-muted font-medium text-sm">
              Impossible de charger le contenu pour le moment
            </p>
          </div>
        ) : (
          <>
            {/* HERO BANNER */}
            <div className="relative mb-10 overflow-hidden rounded-3xl h-[240px] sm:h-[300px] md:h-[360px] flex items-end p-6 md:p-10 border border-border-subtle shadow-2xl group bg-bg-card">
              <img 
                src={heroCover} 
                alt={featuredAudio?.title || "Hidaya"} 
                className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-bg-main via-bg-main/70 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-bg-main via-bg-main/50 to-transparent w-full sm:w-3/4" />

              <div className="relative z-10 max-w-2xl">
                <span className="inline-flex items-center gap-1.5 text-xs md:text-sm font-semibold text-yellow-accent bg-black/40 backdrop-blur-md px-3 py-1 rounded-full mb-3 border border-yellow-accent/30 shadow-sm">
                  <Sparkles size={14} /> {featuredAudio ? "Enseignement du jour" : "Bienvenue sur Hidaya"}
                </span>

                <h3 className="text-2xl md:text-4xl font-extrabold text-white line-clamp-2 tracking-tight drop-shadow-md">
                  {featuredAudio ? featuredAudio.title : "Votre espace d'écoute spirituelle"}
                </h3>

                <p className="text-sm md:text-base text-gray-200 line-clamp-2 mt-2 mb-6 drop-shadow">
                  {featuredAudio 
                    ? (featuredAudio.description || featuredAudio.speaker || 'Écoute spirituelle recommandée') 
                    : "Découvrez bientôt nos nouveaux enseignements, rappels et émissions."}
                </p>

                {featuredAudio && (
                  <button 
                    onClick={handleHeroPlay}
                    className="flex items-center gap-2.5 bg-yellow-accent text-bg-main font-bold text-sm py-3 px-7 rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg cursor-pointer"
                  >
                    {featuredAudio.isLocked || featuredAudio.is_locked ? (
                      <>
                        <Lock size={16} /> Déverrouiller le rappel
                      </>
                    ) : isHeroPlaying ? (
                      <>
                        <Pause size={16} fill="currentColor" /> Mettre en pause
                      </>
                    ) : (
                      <>
                        <Play size={16} fill="currentColor" /> Écouter maintenant
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* SECTIONS */}
            <Section
              title="Playlists & Albums"
              icon={ListMusic}
              audios={feed?.playlists}
              sectionKey="playlists"
              isPlaylist={true}
              setLocked={setLocked}
            />

            <Section
              title="Les plus écoutés"
              icon={Flame}
              audios={feed?.mostPlayed}
              sectionKey="most-played"
              setLocked={setLocked}
            />

            <Section
              title="Enseignements"
              icon={BookOpen}
              audios={feed?.enseignements?.all || feed?.enseignements}
              sectionKey="enseignements"
              setLocked={setLocked}
            />

            <Section
              title="Émissions"
              icon={Radio}
              audios={feed?.emissions}
              sectionKey="emissions"
              setLocked={setLocked}
            />

            <Section
              title="Musique spirituelle"
              icon={Music}
              audios={feed?.musiques}
              sectionKey="musiques"
              setLocked={setLocked}
            />
          </>
        )}
      </div>

      {locked && (
        <UnlockModal
          audio={locked}
          onClose={() => setLocked(null)}
          onUnlocked={() => {
            setLocked(null)
            loadFeed()
          }}
        />
      )}
    </div>
  )
}