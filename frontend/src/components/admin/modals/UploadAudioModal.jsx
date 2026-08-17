import { Upload, Music, ImageIcon, X } from 'lucide-react'

const CATS = ['Enseignement', 'Emission', 'Musique spirituelle']
const SUBCATS = ['Conférence', 'Bayane', 'Rappel']

export default function UploadAudioModal({
  form,
  setForm,
  audioFile,
  setAudioFile,
  imageFile,
  imagePreview,
  handleImageChange,
  clearImageField,
  uploading,
  onSubmit,
  audioRef,
  imageRef
}) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
        <Upload size={16} className="text-emerald-400" /> Publier un Audio
      </h3>

      <input
        type="text"
        value={form.title}
        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        placeholder="Titre de l'audio"
        className="w-full bg-[#0B0F0B] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-emerald-500"
        required
      />

      <textarea
        value={form.description}
        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        placeholder="Description (optionnel)"
        rows={2}
        className="w-full bg-[#0B0F0B] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500 outline-none focus:border-emerald-500 resize-none"
      />

      <div className="grid grid-cols-2 gap-2">
        <select
          value={form.category}
          onChange={(e) => setForm((f) => ({ ...f, category: e.target.value, subCategory: 'Bayane' }))}
          className="bg-[#0B0F0B] border border-white/10 rounded-xl p-2 text-xs text-white outline-none cursor-pointer"
        >
          {CATS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        {form.category === 'Enseignement' && (
          <select
            value={form.subCategory}
            onChange={(e) => setForm((f) => ({ ...f, subCategory: e.target.value }))}
            className="bg-[#0B0F0B] border border-white/10 rounded-xl p-2 text-xs text-white outline-none cursor-pointer"
          >
            {SUBCATS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
      </div>

      <div
        onClick={() => audioRef.current?.click()}
        className="p-3 border border-dashed border-white/15 rounded-xl cursor-pointer hover:border-emerald-500/50 flex items-center gap-3 transition-colors"
      >
        <Music size={18} className="text-slate-400" />
        <span className="text-xs text-slate-300 truncate flex-1">
          {audioFile ? audioFile.name : 'Sélectionner le fichier .mp3'}
        </span>
      </div>
      <input ref={audioRef} type="file" accept=".mp3,audio/*" className="hidden" onChange={(e) => setAudioFile(e.target.files?.[0] || null)} />

      <div
        onClick={() => imageRef.current?.click()}
        className="p-3 border border-dashed border-white/15 rounded-xl cursor-pointer hover:border-emerald-500/50 flex items-center gap-3 transition-colors"
      >
        {imagePreview ? (
          <img src={imagePreview} alt="Aperçu" className="w-6 h-6 rounded object-cover" />
        ) : (
          <ImageIcon size={18} className="text-slate-400" />
        )}
        <span className="text-xs text-slate-300 truncate flex-1">
          {imageFile ? imageFile.name : 'Couverture (Optionnel)'}
        </span>
        {imageFile && (
          <button type="button" onClick={clearImageField}>
            <X size={14} className="text-slate-400" />
          </button>
        )}
      </div>
      <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />

      <button
        type="submit"
        disabled={uploading}
        className="w-full bg-emerald-600 hover:bg-emerald-500 font-bold text-white text-xs py-2.5 rounded-xl transition-all cursor-pointer mt-2"
      >
        {uploading ? 'Publication...' : 'Publier maintenant'}
      </button>
    </form>
  )
}