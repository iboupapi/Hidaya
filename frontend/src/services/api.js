import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 10000,
})

// Injecte le token Bearer JWT à chaque requête
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hidaya_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Redirige vers la page de connexion si le token est expiré ou invalide
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('hidaya_token')
      localStorage.removeItem('hidaya_user')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

// Auth → { user:{id,username,email,role}, token }
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
  logout:   ()     => api.post('/auth/logout'),
  me:       ()     => api.get('/auth/me'),
}

// Accueil → { success, data:{ mostPlayed, enseignements:{all,bayane,conference,rappel}, emissions, musiques } }
export const homeAPI = {
  getFeed:          ()   => api.get('/home/feed'),
  incrementPlayCount: (id) => api.post(`/home/audios/${id}/play`),
}

// Audios → { audios:[{id,title,description,category,subCategory,image,file,createdAt}], pagination:{page,limit,total,totalPages} }
export const audioAPI = {
  getAll:     (page = 1, limit = 20) => api.get('/audios', { params: { page, limit } }),
  getById:    (id)  => api.get(`/audios/${id}`),
  search:     (q, page = 1, limit = 20) => api.get('/audios/search', { params: { q, page, limit } }),
  byCategory: (cat, page = 1, limit = 20) => api.get(`/audios/category/${encodeURIComponent(cat)}`, { params: { page, limit } }),
  bySubCat:   (sub, page = 1, limit = 20) => api.get(`/audios/sub/${encodeURIComponent(sub)}`, { params: { page, limit } }),
  getPopular: (limit = 6) => api.get(`/audios/popular?limit=${limit}`),
  incrementPlay: (id) => api.post(`/audios/${id}/play`),
}

// Admin
export const adminAPI = {
  uploadAudio: (fd)       => api.post('/admin/audios', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
  listAudios:  (page = 1, limit = 20) => api.get('/admin/audios', { params: { page, limit } }),
  updateAudio: (id, data) => api.put(`/admin/audios/${id}`, data),
  deleteAudio: (id)       => api.delete(`/admin/audios/${id}`),
  dashboard:   ()         => api.get('/admin/dashboard'),
  listUsers:   ()         => api.get('/admin/users'),
  updateRole:  (id, role) => api.put(`/admin/users/${id}/role`, { role }),
}

// Playlists
// Playlists
export const playlistAPI = {
  getAll:      ()            => api.get('/playlists'),
  create: (param1, param2) => {
    if (param1 instanceof FormData) {
      return api.post('/playlists', param1, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    }
    if (typeof param1 === 'object' && param1 !== null) {
      return api.post('/playlists', param1)
    }
    return api.post('/playlists', { name: param1, isPrivate: param2 })
  },
  
  getById:     (id)          => api.get(`/playlists/${id}`),
  addAudio:    (id, audio_id) => api.post(`/playlists/${id}/add`, { audio_id }),
  delete:      (id)          => api.delete(`/playlists/${id}`),
  removeAudio: (id, audioId)  => api.delete(`/playlists/${id}/remove/${audioId}`),
  
  // 🟢 AJOUTER CETTE LIGNE :
  unlock:      (id, code)    => api.post(`/playlists/${id}/unlock`, { code }),
  getAccessList: (id)        => api.get(`/playlists/${id}/access-list`),
}

// Accès → POST /access/unlock {code} | POST /access/admin/generate-code {playlist_id}
export const accessAPI = {
  unlock:       (code)        => api.post('/access/unlock', { code }),
  generateCode: (playlist_id) => api.post('/access/admin/generate-code', { playlist_id }),
}

// Notifications
export const notifAPI = {
  getAll:   ()   => api.get('/notifications'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
}

// Favoris
export const favoriteAPI = {
  getAll: ()        => api.get('/favorites'),
  add:    (audioId) => api.post(`/favorites/${audioId}`),
  remove: (audioId) => api.delete(`/favorites/${audioId}`),
}

export default api