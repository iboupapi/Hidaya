import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Library,
  ChevronRight,
  ArrowLeft,
  Disc,
  Play,
  Search,
  Lock,
  Unlock,
  Music,
  X,
  Sparkles
} from 'lucide-react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { playlistAPI } from '../../services/api'
import { AudioCard } from '../../components/audio/AudioCard'
import { UnlockModal } from '../../components/audio/UnlockModal'
import { usePlayer } from '../../context/PlayerContext'

// Configuration de l'URL du Backend (Port 3000)
const BACKEND_URL = 'http://localhost:3000'

const getImageUrl = (path) => {
  if (!path) return null
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${BACKEND_URL}${cleanPath}`
}

export default function LibraryPage() {
  const { play } = usePlayer()
  const { id: urlPlaylistId } = useParams()
  const navigate = useNavigate()

  const [playlists, setPlaylists] = useState([])
  const [selectedPlaylist, setSelected] = useState(null)
  const [playlistAudios, setAudios] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [lockedAudio, setLockedAudio] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Modale de déverrouillage pour un album privé
  const [playlistToUnlock, setPlaylistToUnlock] = useState(null)

  const loadPlaylists = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await playlistAPI.getAll()
      const fetchedPlaylists = data.playlists || []
      setPlaylists(fetchedPlaylists)

      // Si un ID est présent dans l'URL au chargement initial, on sélectionne l'album correspondant
      if (urlPlaylistId) {
        const found = fetchedPlaylists.find(p => String(p.id) === String(urlPlaylistId))
        if (found) {
          openPlaylist(found, false)
        }
      }
    } catch {
      toast.error('Impossible de charger la liste des albums')
    } finally {
      setLoading(false)
    }
  }, [urlPlaylistId])

  useEffect(() => {
    loadPlaylists()
  }, [loadPlaylists])

  // Synchronisation si l'URL change alors que la liste est déjà chargée
  useEffect(() => {
    if (playlists.length > 0) {
      if (urlPlaylistId) {
        const found = playlists.find(p => String(p.id) === String(urlPlaylistId))
        if (found && (!selectedPlaylist || String(selectedPlaylist.id) !== String(urlPlaylistId))) {
          openPlaylist(found, false)
        }
      } else {
        setSelected(null)
        setAudios([])
      }
    }
  }, [urlPlaylistId, playlists])

  // 🔍 Tente d'ouvrir un album auprès du backend
  const openPlaylist = async (pl, updateRoute = true) => {
    if (updateRoute) {
      navigate(`/library/${pl.id}`, { replace: true })
    }
    setSelected(null);
    setLoadingDetails(true);
    try {
      const { data } = await playlistAPI.getById(pl.id);
      setAudios(data.playlist?.audios || data.audios || []);
      setSelected(pl);
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.isLocked) {
        setSelected(null)
        
        const serverContact = err.response?.data?.contactNumber;
        
        setPlaylistToUnlock({
          ...pl,
          contactNumber: serverContact || pl.contactNumber || "+221 77 290 49 98"
        })
      } else {
        setSelected(null)
        toast.error(err.response?.data?.error || 'Erreur lors du chargement des pistes')
      }
    } finally {
      setLoadingDetails(false);
    }
  };

  // Clic sur une playlist
  const handlePlaylistClick = (pl) => {
    openPlaylist(pl, true)
  }

  // Appelé une fois que le code saisi dans la modale a été validé par le backend
  const handlePlaylistUnlocked = () => {
    if (playlistToUnlock) {
      const target = playlistToUnlock
      setPlaylistToUnlock(null)
      openPlaylist(target, true)
    }
  }

  const closePlaylist = () => {
    setSelected(null)
    setAudios([])
    if (searchQuery) setSearchQuery('')
    navigate('/library', { replace: true })
  }

  const handlePlayAll = () => {
    const unlocked = playlistAudios.filter((a) => !a.is_locked)
    if (unlocked.length > 0) {
      play(unlocked[0], unlocked)
      toast.success("Lecture de l'album lancée")
    } else {
      toast.error('Aucune piste accessible dans cet album')
    }
  }

  const filteredPlaylists = useMemo(() => {
    if (!searchQuery.trim()) return playlists
    const q = searchQuery.toLowerCase()
    return playlists.filter((pl) => pl.name?.toLowerCase().includes(q))
  }, [playlists, searchQuery])

  const filteredAudios = useMemo(() => {
    if (!searchQuery.trim()) return playlistAudios
    const q = searchQuery.toLowerCase()
    return playlistAudios.filter(
      (a) => a.title?.toLowerCase().includes(q) || a.description?.toLowerCase().includes(q)
    )
  }, [playlistAudios, searchQuery])

  return (
    <div className="min-h-screen bg-[#0B0F0B] text-slate-100">
      {/* Header Topbar */}
      <div className="sticky top-0 z-20 bg-[#111711]/90 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 md:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            {selectedPlaylist ? (
              <button
                onClick={closePlaylist}
                className="p-2.5 rounded-xl text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer flex-shrink-0"
                title="Retour aux albums"
              >
                <ArrowLeft size={20} />
              </button>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                <Library size={20} className="text-amber-400" />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-white truncate">
                {selectedPlaylist ? selectedPlaylist.name : "Bibliothèque d'Albums"}
              </h1>
              <p className="text-xs text-slate-400 truncate">
                {selectedPlaylist
                  ? `${playlistAudios.length} ${playlistAudios.length > 1 ? 'pistes audio' : 'piste audio'}`
                  : `${playlists.length} ${playlists.length > 1 ? 'albums disponibles' : 'album disponible'}`}
              </p>
            </div>
          </div>

          {selectedPlaylist && playlistAudios.length > 0 && !loadingDetails && (
            <button
              onClick={handlePlayAll}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs sm:text-sm font-bold shadow-lg shadow-amber-950/30 active:scale-95 transition-all cursor-pointer flex-shrink-0"
            >
              <Play size={15} fill="currentColor" />
              <span>Lire tout</span>
            </button>
          )}
        </div>
      </div>

      {/* Conteneur principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-6">
        {/* Barre de recherche */}
        <div className="relative mb-6 max-w-xl">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={selectedPlaylist ? "Rechercher une piste dans cet album..." : "Rechercher un album..."}
            className="w-full bg-[#141C14] border border-white/10 rounded-xl pl-11 pr-10 py-3 text-xs sm:text-sm text-white placeholder:text-slate-500 outline-none focus:border-emerald-500/50 transition-colors shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {selectedPlaylist ? (
          /* ================= VUE ALBUM SÉLECTIONNÉ ================= */
          <div>
            <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#1A261A] to-[#141C14] border border-emerald-500/20 mb-8 shadow-2xl">
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 sm:gap-8">
                <div className="w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 rounded-2xl bg-[#0B0F0B] border border-emerald-500/30 flex items-center justify-center flex-shrink-0 shadow-2xl relative overflow-hidden group">
                  {getImageUrl(selectedPlaylist.coverImage || selectedPlaylist.imageUrl) ? (
                    <img
                      src={getImageUrl(selectedPlaylist.coverImage || selectedPlaylist.imageUrl)}
                      alt={selectedPlaylist.name}
                      className="w-full h-full object-cover rounded-2xl group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <Disc size={64} className="text-amber-400 animate-spin-slow" />
                  )}
                </div>

                <div className="flex-1 min-w-0 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-semibold border ${
                        selectedPlaylist.isPrivate
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}
                    >
                      {selectedPlaylist.isPrivate ? <Lock size={12} /> : <Unlock size={12} />}
                      {selectedPlaylist.isPrivate ? 'Album Privé' : 'Accès Public'}
                    </span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white truncate mb-2">
                    {selectedPlaylist.name}
                  </h2>
                  
                  <p className="text-xs sm:text-sm text-slate-400 flex items-center justify-center sm:justify-start gap-1.5">
                    <Music size={14} className="text-slate-500" />
                    {playlistAudios.length} {playlistAudios.length > 1 ? 'pistes audio' : 'piste audio'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Sparkles size={15} className="text-amber-400" /> Pistes de l'album
              </h3>
            </div>

            {loadingDetails ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-20 bg-[#141C14] rounded-2xl border border-white/5 animate-pulse" />
                ))}
              </div>
            ) : filteredAudios.length === 0 ? (
              <div className="text-center py-16 bg-[#141C14]/50 border border-white/5 rounded-2xl p-6">
                <p className="text-slate-400 text-sm font-medium">
                  {searchQuery ? 'Aucune piste ne correspond à votre recherche' : 'Aucun audio présent dans cet album'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                {filteredAudios.map((audio) => (
                  <AudioCard
                    key={audio.id}
                    audio={audio}
                    variant="compact"
                    onLocked={setLockedAudio}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* ================= VUE LISTE DES ALBUMS ================= */
          <div>
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-64 bg-[#141C14] rounded-2xl border border-white/5 animate-pulse" />
                ))}
              </div>
            ) : filteredPlaylists.length === 0 ? (
              <div className="text-center py-20 border border-white/5 bg-[#141C14]/40 rounded-2xl p-6">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4 text-slate-500">
                  <Library size={28} />
                </div>
                <p className="text-slate-300 font-semibold text-sm">
                  {searchQuery ? 'Aucun album ne correspond à votre recherche' : 'Aucun album disponible'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                {filteredPlaylists.map((pl) => {
                  const imageUrl = getImageUrl(pl.coverImage || pl.imageUrl)

                  return (
                    <div
                      key={pl.id}
                      onClick={() => handlePlaylistClick(pl)}
                      className="group flex flex-col p-3.5 bg-[#141C14] border border-white/5 rounded-2xl cursor-pointer hover:border-emerald-500/30 hover:bg-white/[0.04] active:scale-[0.98] transition-all duration-200 shadow-md"
                    >
                      <div className="w-full aspect-square rounded-xl overflow-hidden bg-[#0B0F0B] border border-white/10 flex items-center justify-center relative mb-3">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={pl.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div
                            className={`w-full h-full flex items-center justify-center ${
                              pl.isPrivate
                                ? 'bg-amber-500/10 text-amber-400'
                                : 'bg-emerald-500/10 text-emerald-400'
                            }`}
                          >
                            <Disc size={36} />
                          </div>
                        )}

                        {pl.isPrivate && (
                          <span className="absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-md font-semibold border flex items-center gap-1 bg-amber-950/80 text-amber-400 border-amber-400/30 backdrop-blur-md shadow-md">
                            <Lock size={10} /> Privé
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <p className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-emerald-400 transition-colors">
                            {pl.name}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-1 truncate">
                            Consulter l'album
                          </p>
                        </div>
                        
                        <div className="mt-2.5 flex items-center justify-between text-slate-500 group-hover:text-slate-300 text-[11px] font-medium transition-colors border-t border-white/5 pt-2">
                          <span>Explorer</span>
                          <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modale de déverrouillage d'une piste audio individuelle */}
      {lockedAudio && (
        <UnlockModal
          audio={lockedAudio}
          onClose={() => setLockedAudio(null)}
          onUnlocked={() => {
            setLockedAudio(null)
            if (selectedPlaylist) openPlaylist(selectedPlaylist, false)
          }}
        />
      )}

      {/* Modale de déverrouillage d'un album privé */}
      {playlistToUnlock && (
        <UnlockModal
          playlist={playlistToUnlock} 
          onClose={() => setPlaylistToUnlock(null)} 
          onUnlocked={handlePlaylistUnlocked}
        />
      )}
    </div>
  )
}