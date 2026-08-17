import { FolderPlus } from 'lucide-react'

export default function LinkAudioModal({
  allPlaylists,
  allAudios,
  selectedPlId,
  setSelectedPlId,
  selectedAudioId,
  setSelectedAudioId,
  addingTrack,
  onSubmit
}) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
        <FolderPlus size={16} className="text-blue-400" /> Lier un Audio à un Album
      </h3>

      <select
        value={selectedPlId}
        onChange={(e) => setSelectedPlId(e.target.value)}
        className="w-full bg-[#0B0F0B] border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none cursor-pointer"
        required
      >
        <option value="">-- Choisir l'album --</option>
        {allPlaylists.map((pl) => (
          <option key={pl.id} value={pl.id}>{pl.name}</option>
        ))}
      </select>

      <select
        value={selectedAudioId}
        onChange={(e) => setSelectedAudioId(e.target.value)}
        className="w-full bg-[#0B0F0B] border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none cursor-pointer"
        required
      >
        <option value="">-- Choisir l'audio --</option>
        {allAudios.map((a) => (
          <option key={a.id} value={a.id}>{a.title}</option>
        ))}
      </select>

      <button
        type="submit"
        disabled={addingTrack}
        className="w-full bg-blue-600 hover:bg-blue-500 font-bold text-white text-xs py-2.5 rounded-xl transition-all cursor-pointer mt-2"
      >
        {addingTrack ? 'Association...' : "Associer la piste"}
      </button>
    </form>
  )
}