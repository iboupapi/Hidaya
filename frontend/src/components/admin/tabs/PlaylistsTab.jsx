import { Search, Plus, Lock, Unlock, Pencil, Trash2 } from 'lucide-react'

export default function PlaylistsTab({ playlists, searchQuery, onSearchChange, onCreateClick, onEditClick, onDeleteClick, deletingPlaylistId }) {
  return (
    <div className="bg-[#141C14] border border-white/5 rounded-2xl p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher un album..."
            className="w-full bg-[#0B0F0B] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none focus:border-amber-500/50"
          />
        </div>
        <button
          onClick={onCreateClick}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-3 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Plus size={14} /> Créer un album
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {playlists.map((pl) => (
          <div key={pl.id} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${pl.isPrivate ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                {pl.isPrivate ? <Lock size={18} /> : <Unlock size={18} />}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">{pl.name}</p>
                <span className={`inline-block text-[9px] px-2 py-0.5 rounded-full mt-1 font-medium ${pl.isPrivate ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20' : 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20'}`}>
                  {pl.isPrivate ? 'Album Privé' : 'Album Public'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => onEditClick(pl)}
                className="p-2 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors cursor-pointer"
                title="Modifier l'album"
              >
                <Pencil size={15} />
              </button>
              <button
                onClick={() => onDeleteClick(pl.id, pl.name)}
                disabled={deletingPlaylistId === pl.id}
                className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                title="Supprimer l'album"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}