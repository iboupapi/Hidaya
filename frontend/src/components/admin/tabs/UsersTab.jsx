import { Search } from 'lucide-react'

export default function UsersTab({ users, searchQuery, onSearchChange, loadingUsers, onRoleChange, currentUserId }) {
  return (
    <div className="bg-[#141C14] border border-white/5 rounded-2xl p-4">
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Rechercher par nom d'utilisateur ou email..."
          className="w-full bg-[#0B0F0B] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none focus:border-blue-500/50"
        />
      </div>

      {loadingUsers ? (
        <p className="text-slate-500 text-xs text-center py-8">Chargement des membres...</p>
      ) : (
        <div className="flex flex-col gap-2">
          {users.map((u) => (
            <div key={u.id} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white">{u.username}</p>
                <p className="text-[10px] text-slate-400">{u.email}</p>
              </div>

              <select
                value={u.role || 'user'}
                onChange={(e) => onRoleChange(u, e.target.value)}
                disabled={u.id === currentUserId}
                className="bg-[#0B0F0B] border border-white/10 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="user">Utilisateur</option>
                <option value="admin">Administrateur</option>
                <option value="superadmin">Super Admin</option>
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}