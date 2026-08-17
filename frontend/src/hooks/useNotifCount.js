import { useState, useEffect, useCallback } from 'react'
import { notifAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'

export function useNotifCount() {
  const [count, setCount] = useState(0)
  const { user } = useAuth()

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return
    try {
      const { data } = await notifAPI.getAll()
      // Correction ici : isRead au lieu de is_read pour correspondre au backend (Prisma)
      const unread = data.notifications ? data.notifications.filter(n => !n.isRead).length : 0
      setCount(unread)
    } catch (err) {
      // Erreur silencieuse pour ne pas perturber l'UI
    }
  }, [user])

  useEffect(() => {
    if (!user) {
      setCount(0)
      return
    }

    // Chargement initial
    fetchUnreadCount()

    // Intervalle de polling toutes les 30 secondes
    const interval = setInterval(() => {
      fetchUnreadCount()
    }, 30000)

    // Écouteur pour forcer le rafraîchissement avec un court délai 
    // pour laisser le temps au backend d'enregistrer la modification
    const handleRefresh = () => {
      setTimeout(() => {
        fetchUnreadCount()
      }, 150) // 150ms de délai pour s'assurer que la base de données est à jour
    }

    window.addEventListener('notifs-updated', handleRefresh)

    return () => {
      clearInterval(interval)
      window.removeEventListener('notifs-updated', handleRefresh)
    }
  }, [user, fetchUnreadCount])

  return count
}