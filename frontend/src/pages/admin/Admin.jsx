import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  Upload,
  Plus,
  LayoutDashboard,
  FolderPlus,
  Music,
  Users,
  ShieldCheck,
  X
} from 'lucide-react'
import toast from 'react-hot-toast'
import { adminAPI, accessAPI, playlistAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import logo from '../../assets/logo_Dahiratoul_Imane-removebg-preview.png' 

// Import des onglets
import OverviewTab from '../../components/admin/tabs/OverviewTab'
import AudiosTab from '../../components/admin/tabs/AudiosTab'
import PlaylistsTab from '../../components/admin/tabs/PlaylistsTab'
import UsersTab from '../../components/admin/tabs/UsersTab'

// Import des modales
import UploadAudioModal from '../../components/admin/modals/UploadAudioModal'
import CreateAlbumModal from '../../components/admin/modals/CreateAlbumModal'
import LinkAudioModal from '../../components/admin/modals/LinkAudioModal'
import GenCodeModal from '../../components/admin/modals/GenCodeModal'
import EditAlbumModal from '../../components/admin/modals/EditAlbumModal'

export default function Admin() {
  const { user } = useAuth()

  const [activeTab, setActiveTab] = useState('overview')
  const [modalType, setModalType] = useState(null)

  const audioRef = useRef(null)
  const imageRef = useRef(null)
  const plAudiosRef = useRef(null)
  const plCoverRef = useRef(null)

  const [allPlaylists, setAllPlaylists] = useState([])
  const [allAudios, setAllAudios] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [stats, setStats] = useState(null)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [audiosPage, setAudiosPage] = useState(1)
  const [audiosTotalPages, setAudiosTotalPages] = useState(1)
  const [loadingMoreAudios, setLoadingMoreAudios] = useState(false)

  const [audioSearch, setAudioSearch] = useState('')
  const [playlistSearch, setPlaylistSearch] = useState('')
  const [userSearch, setUserSearch] = useState('')

  const [form, setForm] = useState({ title: '', description: '', category: 'Enseignement', subCategory: 'Bayane' })
  const [audioFile, setAudioFile] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [uploading, setUploading] = useState(false)

  const [plName, setPlName] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [playlistAudios, setPlaylistAudios] = useState([])
  const [plCoverFile, setPlCoverFile] = useState(null)
  const [plCoverPreview, setPlCoverPreview] = useState(null)
  const [creatingPl, setCreatingPl] = useState(false)
  const [deletingPlaylistId, setDeletingPlaylistId] = useState(null)
  const [deletingAudioId, setDeletingAudioId] = useState(null)

  const [editingPlaylist, setEditingPlaylist] = useState(null)

  const [selectedPlId, setSelectedPlId] = useState('')
  const [selectedAudioId, setSelectedAudioId] = useState('')
  const [addingTrack, setAddingTrack] = useState(false)

  const [codePlId, setCodePlId] = useState('')
  const [genCode, setGenCode] = useState('')
  const [genLoading, setGenLoading] = useState(false)

  const [accessCode, setAccessCode] = useState('')
  const [contactNumber, setContactNumber] = useState('')

  const fetchData = useCallback(async () => {
    try {
      const [plRes, audRes, dashRes] = await Promise.all([
        playlistAPI.getAll(),
        adminAPI.listAudios(1, 20),
        adminAPI.dashboard().catch(() => null)
      ])
      setAllPlaylists(plRes.data.playlists || [])
      if (audRes.data?.audios) setAllAudios(audRes.data.audios)
      setAudiosPage(audRes.data?.pagination?.page || 1)
      setAudiosTotalPages(audRes.data?.pagination?.totalPages || 1)
      if (dashRes?.data?.stats) setStats(dashRes.data.stats)
    } catch {
      toast.error('Erreur de synchronisation des données')
    }
  }, [])

  const loadMoreAudios = useCallback(async () => {
    if (audiosPage >= audiosTotalPages) return
    setLoadingMoreAudios(true)
    try {
      const nextPage = audiosPage + 1
      const { data } = await adminAPI.listAudios(nextPage, 20)
      setAllAudios((prev) => [...prev, ...(data.audios || [])])
      setAudiosPage(data.pagination?.page || nextPage)
      setAudiosTotalPages(data.pagination?.totalPages || audiosTotalPages)
    } catch {
      toast.error('Erreur lors du chargement des audios suivants')
    } finally {
      setLoadingMoreAudios(false)
    }
  }, [audiosPage, audiosTotalPages])

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true)
    try {
      const { data } = await adminAPI.listUsers()
      setAllUsers(data.users || [])
    } catch {
      toast.error('Erreur lors du chargement des utilisateurs')
    } finally {
      setLoadingUsers(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (activeTab === 'users' && allUsers.length === 0) {
      loadUsers()
    }
  }, [activeTab, allUsers.length, loadUsers])

  const handleImageChange = (e) => {
    const file = e.target.files?.[0] || null
    setImageFile(file)
    setImagePreview(file ? URL.createObjectURL(file) : null)
  }

  const clearImageField = (e) => {
    if (e) e.stopPropagation()
    setImageFile(null)
    setImagePreview(null)
    if (imageRef.current) imageRef.current.value = ''
  }

  const handleAlbumCoverChange = (e) => {
    const file = e.target.files?.[0] || null
    setPlCoverFile(file)
    setPlCoverPreview(file ? URL.createObjectURL(file) : null)
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!audioFile) return toast.error('Veuillez sélectionner un fichier MP3')

    const fd = new FormData()
    fd.append('title', form.title)
    fd.append('description', form.description)
    fd.append('category', form.category)
    if (form.category === 'Enseignement') fd.append('subCategory', form.subCategory)
    fd.append('audio', audioFile)
    if (imageFile) fd.append('image', imageFile)

    setUploading(true)
    try {
      const { data } = await adminAPI.uploadAudio(fd)
      toast.success(`"${data.audio.title}" publié avec succès !`)
      setForm({ title: '', description: '', category: 'Enseignement', subCategory: 'Bayane' })
      setAudioFile(null)
      clearImageField()
      setModalType(null)
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la publication')
    } finally {
      setUploading(false)
    }
  }

  const handleCreateAlbum = async (e) => {
    e.preventDefault()
    if (!plName.trim()) return toast.error("Le nom de l'album est obligatoire")

    setCreatingPl(true)
    try {
      const formData = new FormData()
      formData.append('name', plName.trim())
      formData.append('isPrivate', isPrivate ? 'true' : 'false')
      formData.append('accessCode', accessCode)
      formData.append('contactNumber', contactNumber)
      
      if (plCoverFile) formData.append('image', plCoverFile)

      if (playlistAudios.length > 0) {
        playlistAudios.forEach((file) => {
          if (file instanceof File) formData.append('audios', file)
        })
      }

      await playlistAPI.create(formData)
      toast.success('Album ajouté avec succès !')

      setPlName('')
      setIsPrivate(false)
      setPlaylistAudios([])
      setPlCoverFile(null)
      setPlCoverPreview(null)
      setModalType(null)
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.error || "Erreur lors de la création de l'album")
    } finally {
      setCreatingPl(false)
    }
  }

  const handleLinkAudio = async (e) => {
    e.preventDefault()
    if (!selectedPlId || !selectedAudioId) return toast.error('Veuillez sélectionner un album et un audio')

    setAddingTrack(true)
    try {
      await playlistAPI.addAudio(parseInt(selectedPlId, 10), parseInt(selectedAudioId, 10))
      toast.success("Audio lié à l'album !")
      setSelectedPlId('')
      setSelectedAudioId('')
      setModalType(null)
    } catch (err) {
      toast.error(err.response?.data?.error || "Erreur lors de l'association")
    } finally {
      setAddingTrack(false)
    }
  }

  const handleGenCode = async (e) => {
    e.preventDefault()
    if (!codePlId) return toast.error('Veuillez choisir un album')

    setGenLoading(true)
    try {
      const { data } = await accessAPI.generateCode(parseInt(codePlId, 10))
      setGenCode(data.code)
      toast.success("Code généré avec succès !")
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur de génération')
    } finally {
      setGenLoading(false)
    }
  }

  const handleDeleteAudio = async (id, title) => {
    if (!window.confirm(`Supprimer définitivement "${title}" ?`)) return
    setDeletingAudioId(id)
    try {
      await adminAPI.deleteAudio(id)
      setAllAudios((prev) => prev.filter((a) => a.id !== id))
      toast.success('Audio supprimé')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la suppression')
    } finally {
      setDeletingAudioId(null)
    }
  }

  const handleDeletePlaylist = async (id, name) => {
    if (!window.confirm(`Supprimer définitivement l'album "${name}" ?`)) return
    setDeletingPlaylistId(id)
    try {
      await playlistAPI.delete(id)
      setAllPlaylists((prev) => prev.filter((p) => p.id !== id))
      toast.success('Album supprimé')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la suppression')
    } finally {
      setDeletingPlaylistId(null)
    }
  }

  const handleRoleChange = async (targetUser, newRole) => {
    if (targetUser.id === user?.id) return toast.error('Impossible de modifier votre propre rôle')
    try {
      await adminAPI.updateRole(targetUser.id, newRole)
      setAllUsers((prev) => prev.map((u) => (u.id === targetUser.id ? { ...u, role: newRole } : u)))
      toast.success(`Rôle de ${targetUser.username} mis à jour`)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors du changement de rôle')
    }
  }

  const filteredAudios = useMemo(() => {
    if (!audioSearch.trim()) return allAudios
    const q = audioSearch.toLowerCase()
    return allAudios.filter((a) => a.title?.toLowerCase().includes(q) || a.description?.toLowerCase().includes(q))
  }, [allAudios, audioSearch])

  const filteredPlaylists = useMemo(() => {
    if (!playlistSearch.trim()) return allPlaylists
    const q = playlistSearch.toLowerCase()
    return allPlaylists.filter((p) => p.name?.toLowerCase().includes(q))
  }, [allPlaylists, playlistSearch])

  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return allUsers
    const q = userSearch.toLowerCase()
    return allUsers.filter((u) => u.username?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q))
  }, [allUsers, userSearch])

  return (
    <div className="min-h-screen bg-[#0d130f] text-slate-200">
      {/* En-tête avec logo Dahiratoul Imane */}
      <div className="border-b border-[#203422] bg-[#111a13]/80 backdrop-blur-md px-6 py-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full overflow-hidden border border-amber-400/30 bg-[#17261a] shrink-0 shadow-inner flex items-center justify-center">
              <img src={logo} alt="Dahiratoul Imane Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-amber-300/80 text-xs tracking-widest uppercase mb-0.5 font-mono">
                <ShieldCheck size={14} className="text-amber-400" />
                <span>Dahiratoul Imane</span>
                <span>•</span>
                <span className="text-slate-300 font-medium">{user?.role || 'Admin'}</span>
              </div>
              <h1 className="text-2xl font-normal text-slate-100 tracking-tight font-serif">
                Espace de gestion spirituelle
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setModalType('upload_audio')}
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <Upload size={14} /> <span>Publier un audio</span>
            </button>
            <button
              onClick={() => setModalType('create_album')}
              className="bg-[#17261a] hover:bg-[#1e3222] text-slate-200 font-medium text-xs px-4 py-2.5 rounded-xl border border-[#28422c] transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus size={14} /> <span>Nouvel album</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 mt-8">
        {/* Blocs statistiques aux teintes forestières et dorées */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10 pb-8 border-b border-[#203422]">
          {[
            { label: 'Audios', value: stats?.audios ?? allAudios.length },
            { label: 'Albums', value: stats?.playlists ?? allPlaylists.length },
            { label: 'Membres', value: stats?.users ?? allUsers.length },
            { label: 'Privés', value: allPlaylists.filter((p) => p.isPrivate).length }
          ].map((stat, idx) => (
            <div key={idx} className="bg-[#131d15] border border-[#1b2b1e] rounded-2xl p-5 flex flex-col justify-between shadow-sm">
              <span className="text-xs text-amber-300/70 font-medium tracking-wide mb-2 uppercase">{stat.label}</span>
              <span className="text-3xl font-light text-slate-100 font-mono tracking-tight">{stat.value}</span>
            </div>
          ))}
        </div>

        {/* Navigation par onglets élégante */}
        <div className="flex items-center gap-6 mb-8 border-b border-[#203422] pb-3 overflow-x-auto">
          {[
            { id: 'overview', label: 'Vue globale', icon: LayoutDashboard },
            { id: 'audios', label: `Audios (${stats?.audios ?? allAudios.length})`, icon: Music },
            { id: 'playlists', label: `Albums (${allPlaylists.length})`, icon: FolderPlus },
            { id: 'users', label: 'Utilisateurs', icon: Users }
          ].map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 text-xs font-medium transition-colors cursor-pointer pb-2 relative ${
                  isActive
                    ? 'text-amber-300 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-amber-400' : 'text-slate-500'} />
                {tab.label}
                {isActive && (
                  <div className="absolute -bottom-3 left-0 right-0 h-0.5 bg-amber-400" />
                )}
              </button>
            )
          })}
        </div>

        {activeTab === 'overview' && (
          <OverviewTab
            stats={stats}
            allAudios={allAudios}
            allPlaylists={allPlaylists}
            onOpenModal={setModalType}
            onViewAllAudios={() => setActiveTab('audios')}
          />
        )}

        {activeTab === 'audios' && (
          <AudiosTab
            audios={filteredAudios}
            searchQuery={audioSearch}
            onSearchChange={setAudioSearch}
            onAddClick={() => setModalType('upload_audio')}
            onDeleteAudio={handleDeleteAudio}
            deletingAudioId={deletingAudioId}
            onLoadMore={loadMoreAudios}
            hasMoreAudios={audiosPage < audiosTotalPages}
            loadingMoreAudios={loadingMoreAudios}
          />
        )}

        {activeTab === 'playlists' && (
          <PlaylistsTab
            playlists={filteredPlaylists}
            searchQuery={playlistSearch}
            onSearchChange={setPlaylistSearch}
            onCreateClick={() => setModalType('create_album')}
            onEditClick={setEditingPlaylist}
            onDeleteClick={handleDeletePlaylist}
            deletingPlaylistId={deletingPlaylistId}
          />
        )}

        {activeTab === 'users' && (
          <UsersTab
            users={filteredUsers}
            searchQuery={userSearch}
            onSearchChange={setUserSearch}
            loadingUsers={loadingUsers}
            onRoleChange={handleRoleChange}
            currentUserId={user?.id}
          />
        )}
      </div>

      {modalType && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121c14] border border-[#223825] rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setModalType(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 p-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>

            {modalType === 'upload_audio' && (
              <UploadAudioModal
                form={form}
                setForm={setForm}
                audioFile={audioFile}
                setAudioFile={setAudioFile}
                imageFile={imageFile}
                imagePreview={imagePreview}
                handleImageChange={handleImageChange}
                clearImageField={clearImageField}
                uploading={uploading}
                onSubmit={handleUpload}
                audioRef={audioRef}
                imageRef={imageRef}
              />
            )}

            {modalType === 'create_album' && (
              <CreateAlbumModal
                plName={plName}
                setPlName={setPlName}
                isPrivate={isPrivate}
                setIsPrivate={setIsPrivate}
                contactNumber={contactNumber}
                setContactNumber={setContactNumber}
                plCoverFile={plCoverFile}
                plCoverPreview={plCoverPreview}
                handleAlbumCoverChange={handleAlbumCoverChange}
                playlistAudios={playlistAudios}
                setPlaylistAudios={setPlaylistAudios}
                creatingPl={creatingPl}
                onSubmit={handleCreateAlbum}
                plCoverRef={plCoverRef}
                plAudiosRef={plAudiosRef}
              />
            )}

            {modalType === 'link_audio' && (
              <LinkAudioModal
                allPlaylists={allPlaylists}
                allAudios={allAudios}
                selectedPlId={selectedPlId}
                setSelectedPlId={setSelectedPlId}
                selectedAudioId={selectedAudioId}
                setSelectedAudioId={setSelectedAudioId}
                addingTrack={addingTrack}
                onSubmit={handleLinkAudio}
              />
            )}

            {modalType === 'gen_code' && (
              <GenCodeModal
                allPlaylists={allPlaylists}
                codePlId={codePlId}
                setCodePlId={setCodePlId}
                genCode={genCode}
                genLoading={genLoading}
                onSubmit={handleGenCode}
              />
            )}
          </div>
        </div>
      )}

      {editingPlaylist && (
        <EditAlbumModal
          playlist={editingPlaylist}
          onClose={() => setEditingPlaylist(null)}
          onUpdated={(updatedPl) => {
            setAllPlaylists((prev) =>
              prev.map((p) => (p.id === updatedPl.id ? updatedPl : p))
            )
            fetchData()
          }}
        />
      )}
    </div>
  )
}