import { useState, useEffect } from 'react'
import { Bell, Check, CheckCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { notifAPI } from '../../services/api'

export default function Notifications() {
  const [notifs, setNotifs] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const notifyBadgeUpdate = () => {
    window.dispatchEvent(new Event('notifs-updated'))
  }

  const load = async () => {
    try {
      const { data } = await notifAPI.getAll()
      setNotifs(data.notifications || [])
    } catch {
      toast.error('Erreur de chargement des notifications')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const markRead = async (id) => {
    try {
      await notifAPI.markRead(id)
      setNotifs((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      )
      notifyBadgeUpdate()
    } catch {
      toast.error('Impossible de marquer comme lu')
    }
  }

  const markAll = async () => {
    const unreadNotifs = notifs.filter((n) => !n.isRead)
    if (unreadNotifs.length === 0) return

    setActionLoading(true)
    try {
      // Met à jour toutes les notifications non lues une par une ou via une route globale si disponible
      for (const n of unreadNotifs) {
        await notifAPI.markRead(n.id)
      }
      setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })))
      notifyBadgeUpdate()
      toast.success('Toutes les notifications ont été marquées comme lues')
    } catch {
      toast.error('Erreur lors de la mise à jour')
    } finally {
      setActionLoading(false)
    }
  }

  const unreadCount = notifs.filter((n) => !n.isRead).length

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-20 bg-bg-primary/95 backdrop-blur-md border-b border-border-subtle px-4 py-3.5">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-yellow-accent" />
            <h1 className="text-base font-semibold text-txt-primary">Notifications</h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 bg-yellow-accent text-bg-primary text-xs font-bold rounded-full">
                {unreadCount}
              </span>
            )}
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAll}
              disabled={actionLoading}
              className="text-xs text-green-300 hover:text-yellow-accent flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <CheckCheck size={14} />
              <span>Tout lire</span>
            </button>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-3">
        {loading ? (
          <div className="flex flex-col gap-2">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-20 bg-bg-card rounded-2xl border border-border-subtle animate-pulse"
              />
            ))}
          </div>
        ) : notifs.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-bg-card border border-border-subtle flex items-center justify-center mx-auto mb-3 text-txt-disabled">
              <Bell size={28} />
            </div>
            <p className="text-txt-muted font-medium">Aucune notification pour le moment</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {notifs.map((n) => (
              <div
                key={n.id}
                className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all ${
                  n.isRead
                    ? 'bg-bg-card border-border-subtle'
                    : 'bg-[#0E2A0E] border-green-dahira shadow-sm'
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                    n.isRead ? 'bg-border-subtle' : 'bg-yellow-accent'
                  }`}
                />

                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium leading-snug ${
                      n.isRead ? 'text-txt-muted' : 'text-txt-primary'
                    }`}
                  >
                    {n.title}
                  </p>
                  <p
                    className={`text-xs mt-1 leading-relaxed ${
                      n.isRead ? 'text-txt-disabled' : 'text-txt-muted'
                    }`}
                  >
                    {n.message}
                  </p>
                  <p className="text-[10px] text-txt-disabled mt-2">
                    {new Date(n.createdAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                {!n.isRead && (
                  <button
                    onClick={() => markRead(n.id)}
                    className="w-7 h-7 rounded-full bg-green-dahira hover:bg-[#256025] active:scale-90 flex items-center justify-center transition-all flex-shrink-0 cursor-pointer"
                    title="Marquer comme lu"
                  >
                    <Check size={13} className="text-yellow-accent" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}