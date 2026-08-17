import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { PlayerProvider } from './context/PlayerContext'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { BottomNav } from './components/layout/BottomNav'
import { MiniPlayer } from './components/audio/MiniPlayer'

import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Home from './pages/user/Home'
import Search from './pages/user/Search'
import LibraryPage from './pages/user/Library'
import Notifications from './pages/user/Notifications'
import Profile from './pages/user/Profile'
import AudioDetail from './pages/user/AudioDetail'
import Admin from './pages/admin/Admin'
import SeeAll from './pages/user/SeeAll'

const Shell = ({ children }) => (
  <div className="min-h-screen bg-bg-primary text-txt-primary pb-24 relative">
    {children}
    <MiniPlayer />
    <BottomNav />
  </div>
)

const Guard = ({ children, adminOnly = false }) => (
  <ProtectedRoute adminOnly={adminOnly}>
    <Shell>{children}</Shell>
  </ProtectedRoute>
)

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PlayerProvider>
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: '#111D11',
                color: '#E8F0C8',
                border: '1px solid #2A4A2A',
                borderRadius: '12px',
                fontSize: '13px',
              },
              success: {
                iconTheme: { primary: '#D4E84C', secondary: '#111D11' },
              },
              error: {
                iconTheme: { primary: '#f87171', secondary: '#111D11' },
              },
            }}
          />
          <Routes>
            {/* Routes publiques */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Routes protégées Utilisateur */}
            <Route path="/" element={<Guard><Home /></Guard>} />
            <Route path="/search" element={<Guard><Search /></Guard>} />
            <Route path="/library" element={<Guard><LibraryPage /></Guard>} />
            <Route path="/library/:id" element={<Guard><LibraryPage /></Guard>} />
            <Route path="/albums/:id" element={<Guard><LibraryPage /></Guard>} /> {/* 🟢 Redirige vers LibraryPage */}
            <Route path="/audio/:id" element={<Guard><AudioDetail /></Guard>} />
            <Route path="/notifs" element={<Guard><Notifications /></Guard>} />
            <Route path="/profile" element={<Guard><Profile /></Guard>} />
            <Route path="/see-all/:section" element={<Guard><SeeAll /></Guard>} />

            {/* Route protégée Administration */}
            <Route path="/admin" element={<Guard adminOnly><Admin /></Guard>} />

            {/* Redirection Fallback - DOIT TOUJOURS ÊTRE EN DERNIER */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </PlayerProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}