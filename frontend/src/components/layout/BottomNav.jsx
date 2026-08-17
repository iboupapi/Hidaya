import { NavLink } from 'react-router-dom'
import { Home, Search, Library, Bell, User, ShieldCheck } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useNotifCount } from '../../hooks/useNotifCount'

const BASE = [
  { to: '/',        icon: Home,        label: 'Accueil' },
  { to: '/search',  icon: Search,      label: 'Recherche' },
  { to: '/library', icon: Library,     label: 'Albums' },
  { to: '/notifs',  icon: Bell,        label: 'Alertes', badge: true },
  { to: '/profile', icon: User,        label: 'Profil' },
]

export function BottomNav() {
  const { isAdmin } = useAuth()
  const unread = useNotifCount()

  const items = isAdmin
    ? [...BASE, { to: '/admin', icon: ShieldCheck, label: 'Admin' }]
    : BASE

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-bg-primary/95 backdrop-blur-md border-t border-border-subtle transition-all">
      <div className="max-w-lg mx-auto flex items-center justify-around px-1 py-1.5">
        {items.map(({ to, icon: Icon, label, badge }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-xl transition-all relative active:scale-95 ${
                isActive
                  ? 'text-yellow-accent font-medium'
                  : 'text-txt-disabled hover:text-txt-muted'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative">
                  <Icon size={20} strokeWidth={isActive ? 2.2 : 1.6} />
                  {badge && unread > 0 && (
                    <span className="absolute -top-1 -right-2.5 min-w-[16px] h-[16px] bg-yellow-accent text-bg-primary text-[9px] font-bold rounded-full flex items-center justify-center px-1 border border-bg-primary shadow-sm animate-in zoom-in-50">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </div>
                <span className="text-[10px] tracking-tight">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}