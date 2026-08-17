import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('hidaya_user'))
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(false)
  const [authLoading, setAuthLoading] = useState(true) // Gère le chargement initial au démarrage

  // Synchronisation initiale avec le serveur via GET /auth/me
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('hidaya_token')
      if (!token) {
        setAuthLoading(false)
        return
      }

      try {
        const { data } = await authAPI.me()
        localStorage.setItem('hidaya_user', JSON.stringify(data.user))
        setUser(data.user)
      } catch (err) {
        console.error("Session expirée ou invalide :", err)
        localStorage.removeItem('hidaya_token')
        localStorage.removeItem('hidaya_user')
        setUser(null)
      } finally {
        setAuthLoading(false)
      }
    }

    initAuth()
  }, [])

  const login = useCallback(async (email, password) => {
    setLoading(true)
    try {
      const { data } = await authAPI.login({ email, password })
      localStorage.setItem('hidaya_token', data.token)
      localStorage.setItem('hidaya_user', JSON.stringify(data.user))
      setUser(data.user)
      return data.user
    } finally {
      setLoading(false)
    }
  }, [])

  const register = useCallback(async (username, email, password) => {
    setLoading(true)
    try {
      const { data } = await authAPI.register({ username, email, password })
      localStorage.setItem('hidaya_token', data.token)
      localStorage.setItem('hidaya_user', JSON.stringify(data.user))
      setUser(data.user)
      return data.user
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await authAPI.logout()
    } catch (err) {
      console.error("Erreur déconnexion serveur :", err)
    } finally {
      localStorage.removeItem('hidaya_token')
      localStorage.removeItem('hidaya_user')
      setUser(null)
    }
  }, [])

  // Permet de mettre à jour l'état utilisateur localement (ex: changement de profil)
  const updateUser = useCallback((updatedUserData) => {
    const newUser = { ...user, ...updatedUserData }
    localStorage.setItem('hidaya_user', JSON.stringify(newUser))
    setUser(newUser)
  }, [user])

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      authLoading,
      login,
      register,
      logout,
      updateUser,
      isAdmin: user?.role === 'admin' || user?.role === 'superadmin',
      isSuperAdmin: user?.role === 'superadmin',
    }}>
      {!authLoading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth doit être utilisé au sein d'un AuthProvider")
  }
  return context
}