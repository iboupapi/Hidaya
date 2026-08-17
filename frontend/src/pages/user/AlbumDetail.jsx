import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { playlistAPI } from '../../services/api' // Ajustez selon votre service API

export default function AlbumDetail() {
  const { id } = useParams() // Récupère l'ID depuis l'URL
  const [playlist, setPlaylist] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      loadPlaylistDetails(id)
    }
  }, [id]) // Se relance si l'ID change

  const loadPlaylistDetails = async (playlistId) => {
    setLoading(true)
    try {
      // Appel API pour récupérer les détails d'une seule playlist
      const response = await playlistAPI.getById(playlistId) 
      setPlaylist(response.data)
    } catch (error) {
      console.error("Erreur chargement playlist:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Chargement de l'album...</div>
  if (!playlist) return <div>Album introuvable</div>

  return (
    <div className="p-8">
      <h1>{playlist.title}</h1>
      {/* Affichez ici la liste des sons de l'album */}
    </div>
  )
}