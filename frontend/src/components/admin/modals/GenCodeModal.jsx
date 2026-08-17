import { Key } from 'lucide-react'
import toast from 'react-hot-toast'

export default function GenCodeModal({
  allPlaylists,
  codePlId,
  setCodePlId,
  genCode,
  genLoading,
  onSubmit
}) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
        <Key size={16} className="text-purple-400" /> Générer un Code VIP
      </h3>

      <select
        value={codePlId}
        onChange={(e) => setCodePlId(e.target.value)}
        className="w-full bg-[#0B0F0B] border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none cursor-pointer"
        required
      >
        <option value="">-- Sélectionner l'album privé --</option>
        {allPlaylists.filter((p) => p.isPrivate).map((pl) => (
          <option key={pl.id} value={pl.id}>{pl.name}</option>
        ))}
      </select>

      <button
        type="submit"
        disabled={genLoading}
        className="w-full bg-purple-600 hover:bg-purple-500 font-bold text-white text-xs py-2.5 rounded-xl transition-all cursor-pointer mt-2"
      >
        {genLoading ? 'Génération...' : 'Générer le code'}
      </button>

      {genCode && (
        <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl text-center mt-2">
          <p className="text-[10px] text-slate-400">Code généré :</p>
          <p className="text-xl font-mono font-bold text-purple-300 mt-1">{genCode}</p>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(genCode)
              toast.success('Code copié !')
            }}
            className="text-xs text-purple-400 underline mt-2 cursor-pointer inline-block"
          >
            Copier dans le presse-papier
          </button>
        </div>
      )}
    </form>
  )
}