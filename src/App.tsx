import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import Layout from './layouts/Layout'
import { isConfigured } from './lib/supabase'
import AuthPage from './pages/AuthPage'
import ChatRoom from './pages/ChatRoom'
import Chats from './pages/Chats'
import CommunityPage from './pages/CommunityPage'
import Communities from './pages/Communities'
import Family from './pages/Family'
import Home from './pages/Home'
import Notifications from './pages/Notifications'
import Profile from './pages/Profile'
import ResetPassword from './pages/ResetPassword'

export default function App() {
  if (!isConfigured) {
    return (
      <main className="center">
        <div>
          <h1>Kora belum terhubung ke backend</h1>
          <p className="muted">Isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di file .env (lihat README).</p>
        </div>
      </main>
    )
  }
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<AuthPage />} />
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="communities" element={<Communities />} />
            <Route path="communities/:id" element={<CommunityPage />} />
            <Route path="chats" element={<Chats />} />
            <Route path="chats/:id" element={<ChatRoom />} />
            <Route path="family" element={<Family />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="profile" element={<Profile />} />
            <Route path="reset-password" element={<ResetPassword />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
