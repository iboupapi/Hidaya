import { useState } from 'react'
import { X, Lock, Unlock, ImageIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import { playlistAPI } from '../../../services/api'

export default function EditAlbumModal({ playlist, onClose, onUpdated }) {
  const [name, setName] = useState(playlist.name || '')
  const [isPrivate, setIsPrivate] = useState(playlist.isPrivate || false)
  const [contactNumber, setContactNumber] = useState(playlist.contactNumber || '')
  const [coverFile, setCoverFile] = useState(null)
  const [coverPreview, setCoverPreview] = useState(playlist.coverImage || null)
  const [loading, setLoading] = useState(false)

  const handleImageChange = (e) => {
    const file = e.target.files?.[0] || null
    setCoverFile(file)
    setCoverPreview(file ? URL.createObjectURL(file) : playlist.coverImage)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return toast.error("Le nom de l'album est obligatoire")

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('name', name.trim())
      formData.append('isPrivate', isPrivate ? 'true' : 'false')
      if (isPrivate && contactNumber) {
        formData.append('contactNumber', contactNumber.trim())
      }
      if (coverFile) {
        formData.append('image', coverFile)
      }

      // Appel de l'API de mise à jour (adaptez selon votre service api)
      const { data } = await playlistAPI.update(playlist.id, formData)
      
      toast.success('Album mis à jour avec succès !')
      onUpdated(data.playlist)
      onClose()
    } catch (err) {
      console.error('❌ ERREUR MODIFICATION ALBUM :', err)
      toast.error(err.response?.data?.error || "Erreur lors de la mise à jour de l'album")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#141C14] border border-white/10 rounded-2xl w-full max-w-md p-5 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
            <Lock size={16} className="text-amber-400" /> Modifier l'album
          </h3>

          {/* Nom de l'album */}
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nom de l'album"
            className="w-full bg-[#0B0F0B] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-amber-500"
            required
          />

          {/* Statut Privé/Public */}
          <div
            onClick={() => setIsPrivate(!isPrivate)}
            className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-colors ${
              isPrivate ? 'bg-amber-500/15 border-amber-500/40 text-amber-300' : 'bg-[#0B0F0B] border-white/10 text-slate-400'
            }`}
          >
            <div className="flex items-center gap-2">
              {isPrivate ? <Lock size={16} /> : <Unlock size={16} />}
              <span className="text-xs font-semibold">Album Privé</span>
            </div>
            <input type="checkbox" checked={isPrivate} onChange={() => {}} className="accent-amber-400" />
          </div>

          {/* Numéro de contact si privé */}
          {isPrivate && (
            <input
              type="text"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              placeholder="Numéro à contacter (WhatsApp / Tel)"
              className="w-full bg-[#0B0F0B] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500 outline-none focus:border-amber-500"
            />
          )}

          {/* Image de couverture */}
          <label className="p-3 border border-dashed border-white/15 rounded-xl cursor-pointer hover:border-amber-500/50 flex items-center gap-3 transition-colors">
            {coverPreview ? (
              <img src={coverPreview} alt="Aperçu" className="w-7 h-7 rounded-lg object-cover" />
            ) : (
              <ImageIcon size={18} className="text-slate-400" />
            )}
            <span className="text-xs text-slate-300 truncate flex-1">
              {coverFile ? coverFile.name : "Changer l'image de couverture"}
            </span>
            <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 font-bold text-slate-950 text-xs py-2.5 rounded-xl transition-all cursor-pointer mt-2"
          >
            {loading ? "Enregistrement..." : "Enregistrer les modifications"}
          </button>
        </form>
      </div>
    </div>
  )
}