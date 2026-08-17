import { Search, Plus, Music, Trash2 } from 'lucide-react'

export default function AudiosTab({ audios, searchQuery, onSearchChange, onAddClick, onDeleteAudio, deletingAudioId, onLoadMore, hasMoreAudios, loadingMoreAudios }) {
  return (
    <div className="bg-[#141C14] border border-white/5 rounded-2xl p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher par titre ou description..."
            className="w-full bg-[#0B0F0B] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none focus:border-emerald-500/50"
          />
        </div>
        <button
          onClick={onAddClick}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs px-3 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Plus size={14} /> Ajouter un audio
        </button>
      </div>

      <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto pr-1">
        {audios.length === 0 ? (
          <p className="text-slate-500 text-xs text-center py-8">Aucun audio trouvé</p>
        ) : (
          audios.map((audio) => (
            <div key={audio.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0">
                  <Music size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{audio.title}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {audio.subCategory ? `${audio.mainCategory || audio.category} · ${audio.subCategory}` : audio.mainCategory || audio.category}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onDeleteAudio(audio.id, audio.title)}
                  disabled={deletingAudioId === audio.id}
                  className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                  title="Supprimer"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))
        )}

        {!searchQuery && hasMoreAudios && (
          <button
            onClick={onLoadMore}
            disabled={loadingMoreAudios}
            className="mt-1 py-2.5 rounded-xl border border-white/10 text-xs font-medium text-slate-400 hover:text-white hover:bg-white/[0.04] transition-colors disabled:opacity-50"
          >
            {loadingMoreAudios ? 'Chargement...' : 'Charger plus d\'audios'}
          </button>
        )}
      </div>
    </div>
  )
}