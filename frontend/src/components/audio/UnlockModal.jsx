import { useState, useEffect } from 'react'
import { Lock, Unlock, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { playlistAPI } from '../../services/api' // 🟢 Corrigé pour pointer vers playlistAPI

export function UnlockModal({ playlist, onClose, onUnlocked }) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  // 🔍 LOG DE DIAGNOSTIC 1 : Vérifier ce que la modale reçoit exactement à l'ouverture
  useEffect(() => {
    console.log("==========================================")
    console.log("🔍 [UnlockModal] Ouvert avec l'objet playlist :", playlist)
    console.log("📞 [UnlockModal] contactNumber détecté :", playlist?.contactNumber)
    console.log("==========================================")
  }, [playlist])

  // Fermeture automatique lors de l'appui sur la touche Echap
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const submit = async (e) => {
    e.preventDefault()
    const cleanCode = code.trim()
    if (!cleanCode) return

    const playlistId = playlist?.id || playlist

    if (!playlistId) {
      toast.error("Erreur : Album introuvable pour ce déverrouillage")
      return
    }

    setLoading(true)
    try {
      const { data } = await playlistAPI.unlock(playlistId, cleanCode)
      toast.success(data.message || 'Contenu déverrouillé avec succès !')
      onUnlocked?.()
      onClose()
    } catch (err) {
      console.error("🔥 Erreur lors de l'appel unlockAPI :", err)
      toast.error(err.response?.data?.error || 'Code d\'accès invalide ou expiré')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0 bg-black/70 backdrop-blur-sm transition-opacity"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-sm bg-bg-secondary border border-border-default rounded-3xl p-6 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200">
        
        {/* En-tête du Modal */}
        <div className="flex items-center justify-between mb-5">
          <div className="w-12 h-12 rounded-2xl bg-[#1A4A1A] border border-green-dahira flex items-center justify-center shadow-inner">
            <Lock size={22} className="text-yellow-accent" />
          </div>
          <button
            onClick={onClose}
            type="button"
            className="w-8 h-8 rounded-full bg-bg-card flex items-center justify-center text-txt-muted hover:text-txt-primary hover:bg-white/10 transition-colors"
            title="Fermer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Détails du contenu */}
        <h2 className="text-lg font-semibold text-txt-primary mb-1">
          Contenu protégé
        </h2>
        <div className="p-4 text-center">
          {/* <p className="text-xs text-slate-400 mb-3">
            Entrez votre code d'accès pour déverrouiller cet album.
          </p> */}
          
          {/* Affichage dynamique sécurisé (avec secours visuel temporaire si vide pour tester) */}
          {playlist?.contactNumber ? (
            <p className="text-xs text-emerald-400 font-medium">
               Contactez l'administrateur pour obtenir un code : <span className="underline">{playlist.contactNumber}</span>
            </p>
          ) : (
            <p className="text-xs text-amber-400 font-medium italic">
              ⚠️ Aucun numéro de contact défini pour cet album 
            </p>
          )}
        </div>

        {/* Formulaire de déverrouillage */}
        <form onSubmit={submit} className="flex flex-col gap-3">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="DI-1-XXXXXXXX"
            className="input-field font-mono text-center tracking-widest text-yellow-accent placeholder:tracking-normal placeholder:text-txt-disabled text-base py-3"
            autoFocus
            disabled={loading}
          />

           <button
            type="submit"
            disabled={loading || !code.trim()}
            className="btn-primary flex items-center justify-center gap-2 py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <span className="spinner" />
            ) : (
              <>
                <Unlock size={16} />
                <span>Déverrouiller</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}