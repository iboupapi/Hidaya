import { Music, FolderPlus, ArrowUpRight, Upload, Key, Link as LinkIcon } from 'lucide-react'

export default function OverviewTab({ stats, allAudios, allPlaylists, onOpenModal, onViewAllAudios }) {
  const recentAudios = allAudios.slice(0, 5)
  const recentPlaylists = allPlaylists.slice(0, 5)

  return (
    <div className="space-y-10 animate-in fade-in duration-200">
      {/* Section Actions rapides */}
      <div className="bg-[#131d15] border border-[#1b2b1e] rounded-2xl p-6 shadow-sm">
        <h2 className="text-xs font-medium text-amber-300/75 uppercase tracking-wider mb-4 font-mono">
          Actions rapides
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            onClick={() => onOpenModal('upload_audio')}
            className="flex items-center justify-between p-3.5 rounded-xl bg-[#17261a]/60 hover:bg-[#1e3222] border border-[#223825] transition-all text-left group cursor-pointer shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#223825] text-amber-300">
                <Upload size={16} />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-200">Publier un audio</p>
                <p className="text-[11px] text-slate-400">Ajouter un fichier MP3</p>
              </div>
            </div>
            <ArrowUpRight size={14} className="text-slate-500 group-hover:text-amber-300 transition-colors" />
          </button>

          <button
            onClick={() => onOpenModal('create_album')}
            className="flex items-center justify-between p-3.5 rounded-xl bg-[#17261a]/60 hover:bg-[#1e3222] border border-[#223825] transition-all text-left group cursor-pointer shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#223825] text-amber-300">
                <FolderPlus size={16} />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-200">Nouvel album</p>
                <p className="text-[11px] text-slate-400">Créer une collection</p>
              </div>
            </div>
            <ArrowUpRight size={14} className="text-slate-500 group-hover:text-amber-300 transition-colors" />
          </button>

          <button
            onClick={() => onOpenModal('link_audio')}
            className="flex items-center justify-between p-3.5 rounded-xl bg-[#17261a]/60 hover:bg-[#1e3222] border border-[#223825] transition-all text-left group cursor-pointer shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#223825] text-amber-300">
                <LinkIcon size={16} />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-200">Associer audio</p>
                <p className="text-[11px] text-slate-400">Lier à un album</p>
              </div>
            </div>
            <ArrowUpRight size={14} className="text-slate-500 group-hover:text-amber-300 transition-colors" />
          </button>

          <button
            onClick={() => onOpenModal('gen_code')}
            className="flex items-center justify-between p-3.5 rounded-xl bg-[#17261a]/60 hover:bg-[#1e3222] border border-[#223825] transition-all text-left group cursor-pointer shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#223825] text-amber-300">
                <Key size={16} />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-200">Générer un code</p>
                <p className="text-[11px] text-slate-400">Accès album privé</p>
              </div>
            </div>
            <ArrowUpRight size={14} className="text-slate-500 group-hover:text-amber-300 transition-colors" />
          </button>
        </div>
      </div>

      {/* Grille des derniers contenus */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Derniers audios */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-medium text-amber-300/75 uppercase tracking-wider flex items-center gap-2 font-mono">
              <Music size={14} className="text-amber-400" /> Dernières publications
            </h3>
            <button
              onClick={onViewAllAudios}
              className="text-xs text-slate-400 hover:text-amber-300 transition-colors cursor-pointer"
            >
              Tout voir
            </button>
          </div>

          <div className="bg-[#131d15] border border-[#1b2b1e] rounded-2xl divide-y divide-[#1b2b1e] overflow-hidden shadow-sm">
            {recentAudios.length === 0 ? (
              <p className="p-6 text-xs text-slate-400 text-center">Aucun audio publié pour le moment.</p>
            ) : (
              recentAudios.map((audio) => (
                <div key={audio.id} className="p-4 flex items-center justify-between hover:bg-[#17261a]/50 transition-colors">
                  <div className="min-w-0 pr-4">
                    <p className="text-xs font-medium text-slate-200 truncate">{audio.title}</p>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {audio.category} {audio.subCategory ? `• ${audio.subCategory}` : ''}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-amber-300/80 bg-[#1e3222] border border-[#28422c] px-2 py-1 rounded-md shrink-0">
                    {audio.duration ? `${Math.floor(audio.duration / 60)}m` : 'MP3'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Derniers albums */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-medium text-amber-300/75 uppercase tracking-wider flex items-center gap-2 font-mono">
              <FolderPlus size={14} className="text-amber-400" /> Albums récents
            </h3>
          </div>

          <div className="bg-[#131d15] border border-[#1b2b1e] rounded-2xl divide-y divide-[#1b2b1e] overflow-hidden shadow-sm">
            {recentPlaylists.length === 0 ? (
              <p className="p-6 text-xs text-slate-400 text-center">Aucun album créé pour le moment.</p>
            ) : (
              recentPlaylists.map((playlist) => (
                <div key={playlist.id} className="p-4 flex items-center justify-between hover:bg-[#17261a]/50 transition-colors">
                  <div className="min-w-0 pr-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#1e3222] border border-[#28422c] flex items-center justify-center text-amber-300 shrink-0">
                      <FolderPlus size={14} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-200 truncate">{playlist.name}</p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {playlist._count?.audios || playlist.audios?.length || 0} piste(s) {playlist.isPrivate ? '• Privé' : ''}
                      </p>
                    </div>
                  </div>
                  {playlist.isPrivate && (
                    <span className="text-[10px] font-mono text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md shrink-0">
                      Protégé
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}