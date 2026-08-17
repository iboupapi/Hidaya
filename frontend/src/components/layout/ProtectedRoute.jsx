import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export function ProtectedRoute({ children, adminOnly = false }) {
  const { user, authLoading, isAdmin } = useAuth()

  // 1. Attendre la vérification du token via /auth/me
  if (authLoading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <span className="spinner" />
      </div>
    )
  }

  // 2. Rediriger si non connecté
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // 3. Vérifier les droits d'administration (admin ou superadmin)
  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />
  }

  return children
}