import { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react'
import { audioAPI } from '../services/api'

const PlayerContext = createContext(null)

export function PlayerProvider({ children }) {
  const [currentTrack, setCurrentTrack] = useState(null)
  const [queue, setQueue] = useState([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)

  const audioRef = useRef(new Audio())

  // Références pour garder des valeurs à jour dans les event listeners sans ré-exécuter useEffect
  const currentTrackRef = useRef(currentTrack)
  const queueRef = useRef(queue)

  useEffect(() => {
    currentTrackRef.current = currentTrack
    queueRef.current = queue
  }, [currentTrack, queue])

  // Lancer la lecture de manière sécurisée
  const safePlay = async () => {
    try {
      await audioRef.current.play()
      setIsPlaying(true)
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Erreur de lecture audio :', err)
      }
      setIsPlaying(false)
    }
  }

  // Action pour lancer un titre
  const play = useCallback(async (track, newQueue = null) => {
    const a = audioRef.current

    if (newQueue) {
      setQueue(newQueue)
    }

    // Toggle pause/play si c'est le même titre
    if (currentTrackRef.current?.id === track.id) {
      if (a.paused) {
        safePlay()
      } else {
        a.pause()
        setIsPlaying(false)
      }
      return
    }

    // Chargement d'un nouveau titre
    a.src = track.file
    setCurrentTrack(track)
    setProgress(0)

    await safePlay()

    // Incrémente le compteur en arrière-plan
    audioAPI.incrementPlay(track.id).catch(() => {})
  }, [])

  // Avancer au titre suivant
  const playNext = useCallback(() => {
    const track = currentTrackRef.current
    const q = queueRef.current
    if (!track || q.length === 0) return

    const currentIndex = q.findIndex((t) => t.id === track.id)
    if (currentIndex !== -1 && currentIndex < q.length - 1) {
      play(q[currentIndex + 1])
    }
  }, [play])

  // Revenir au titre précédent
  const playPrevious = useCallback(() => {
    const track = currentTrackRef.current
    const q = queueRef.current
    if (!track || q.length === 0) return

    const currentIndex = q.findIndex((t) => t.id === track.id)
    if (currentIndex > 0) {
      play(q[currentIndex - 1])
    } else {
      if (audioRef.current) audioRef.current.currentTime = 0
      setProgress(0)
    }
  }, [play])

  // Écouteurs d'évènements sur le lecteur HTML5 (initialisés UNE SEULE FOIS)
  useEffect(() => {
    const a = audioRef.current

    const onTime = () => setProgress(a.currentTime)
    const onMeta = () => setDuration(a.duration || 0)
    const onEnded = () => {
      setIsPlaying(false)
      setProgress(0)
      playNext()
    }
    const onError = (e) => {
      console.error("Erreur de chargement de la source audio :", e)
      setIsPlaying(false)
    }

    a.addEventListener('timeupdate', onTime)
    a.addEventListener('loadedmetadata', onMeta)
    a.addEventListener('ended', onEnded)
    a.addEventListener('error', onError)

    return () => {
      // Retrait des écouteurs UNIQUEMENT (SANS appeler a.pause())
      a.removeEventListener('timeupdate', onTime)
      a.removeEventListener('loadedmetadata', onMeta)
      a.removeEventListener('ended', onEnded)
      a.removeEventListener('error', onError)
    }
  }, [playNext])

  const togglePlay = useCallback(() => {
    const a = audioRef.current
    if (!currentTrack) return

    if (isPlaying) {
      a.pause()
      setIsPlaying(false)
    } else {
      safePlay()
    }
  }, [currentTrack, isPlaying])

  const seek = useCallback((time) => {
    if (!audioRef.current) return
    audioRef.current.currentTime = time
    setProgress(time)
  }, [])

  const fmt = useCallback((s) => {
    if (!s || isNaN(s)) return '0:00'
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
  }, [])

  const closePlayer = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    setIsPlaying(false)
    setCurrentTrack(null)
    setProgress(0)
  }

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        queue,
        isPlaying,
        progress,
        duration,
        play,
        togglePlay,
        seek,
        playNext,
        playPrevious,
        fmt,
        closePlayer,
      }}
    >
      {children}
    </PlayerContext.Provider>
  )
}

export const usePlayer = () => {
  const context = useContext(PlayerContext)
  if (!context) {
    throw new Error("usePlayer doit être utilisé au sein d'un PlayerProvider")
  }
  return context
}