import { FolderPlus, Lock, Unlock, ImageIcon, Radio, X } from 'lucide-react'

export default function CreateAlbumModal({
  plName,
  setPlName,
  isPrivate,
  setIsPrivate,
  contactNumber,
  setContactNumber,
  plCoverFile,
  plCoverPreview,
  handleAlbumCoverChange,
  playlistAudios,
  setPlaylistAudios,
  creatingPl,
  onSubmit,
  plCoverRef,
  plAudiosRef
}) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
        <FolderPlus size={16} className="text-amber-400" /> Nouvel Album
      </h3>

      <input
        type="text"
        value={plName}
        onChange={(e) => setPlName(e.target.value)}
        placeholder="Nom de l'album"
        className="w-full bg-[#0B0F0B] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-amber-500"
        required
      />

      <div
        onClick={() => setIsPrivate(!isPrivate)}
        className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-colors ${
          isPrivate ? 'bg-amber-500/10 border-amber-500/40 text-amber-300' : 'bg-[#0B0F0B] border-white/10 text-slate-400'
        }`}
      >
        <div className="flex items-center gap-2">
          {isPrivate ? <Lock size={16} /> : <Unlock size={16} />}
          <span className="text-xs font-semibold">Album Privé</span>
        </div>
        <input type="checkbox" checked={isPrivate} onChange={() => {}} className="accent-amber-400" />
      </div>

      {isPrivate && (
        <div className="flex flex-col gap-2 p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl">
          <input
            type="text"
            value={contactNumber}
            onChange={(e) => setContactNumber(e.target.value)}
            placeholder="Numéro à contacter (optionnel)"
            className="w-full bg-[#0B0F0B] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500 outline-none focus:border-amber-500"
          />
        </div>
      )}

      <div
        onClick={() => plCoverRef.current?.click()}
        className="p-3 border border-dashed border-white/15 rounded-xl cursor-pointer hover:border-amber-500/50 flex items-center gap-3 transition-colors"
      >
        {plCoverPreview ? (
          <img src={plCoverPreview} alt="Aperçu album" className="w-7 h-7 rounded-lg object-cover" />
        ) : (
          <ImageIcon size={18} className="text-slate-400" />
        )}
        <span className="text-xs text-slate-300 truncate flex-1">
          {plCoverFile ? plCoverFile.name : "Image de couverture (Optionnel)"}
        </span>
      </div>
      <input
        ref={plCoverRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAlbumCoverChange}
      />

      <div
        onClick={() => plAudiosRef.current?.click()}
        className="p-3 border border-dashed border-white/15 rounded-xl cursor-pointer hover:border-amber-500/50 flex items-center gap-3 transition-colors"
      >
        <Radio size={18} className="text-slate-400" />
        <span className="text-xs text-slate-300 truncate flex-1">
          {playlistAudios.length > 0 
            ? `${playlistAudios.length} fichier(s) MP3 sélectionné(s)` 
            : "Choisir des fichiers MP3 depuis votre ordinateur"}
        </span>
      </div>
      <input 
        ref={plAudiosRef} 
        type="file" 
        accept=".mp3,audio/*" 
        multiple 
        className="hidden" 
        onChange={(e) => setPlaylistAudios(Array.from(e.target.files || []))} 
      />

      {playlistAudios.length > 0 && (
        <div className="max-h-32 overflow-y-auto bg-[#0B0F0B] border border-white/10 rounded-xl p-2 flex flex-col gap-1.5">
          <p className="text-[10px] text-slate-400 px-1 font-medium">Fichiers qui seront uploadés :</p>
          {playlistAudios.map((file, index) => (
            <div 
              key={index} 
              className="flex items-center justify-between text-xs text-slate-200 bg-white/5 rounded-lg px-2.5 py-1.5 border border-white/5"
            >
              <span className="truncate pr-2">{file.name}</span>
              <button
                type="button"
                onClick={() => setPlaylistAudios(playlistAudios.filter((_, i) => i !== index))}
                className="text-slate-400 hover:text-red-400 transition-colors p-0.5"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="submit"
        disabled={creatingPl}
        className="w-full bg-amber-500 hover:bg-amber-400 font-bold text-slate-950 text-xs py-2.5 rounded-xl transition-all cursor-pointer mt-2"
      >
        {creatingPl ? "Création et upload des MP3..." : "Créer l'album"}
      </button>
    </form>
  )
}