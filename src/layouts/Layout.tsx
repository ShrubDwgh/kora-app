import { Navigate, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { Logo } from '../components/Logo'
import { useAuth } from '../hooks/useAuth'

const NAV: [string, string, string][] = [
  ['/', 'Home', 'home'],
  ['/communities', 'Komunitas', 'users'],
  ['/chats', 'Obrolan', 'chat'],
  ['/family', 'Keluarga', 'heart'],
  ['/notifications', 'Notifikasi', 'bell'],
  ['/profile', 'Profil', 'user'],
]

export default function Layout() {
  const { session, loading } = useAuth()
  const { pathname } = useLocation()
  if (loading) return <div className="center"><div className="skeleton" style={{ width: 180 }} /></div>
  if (!session) return <Navigate to="/login" replace />

  const inRoom = /^\/chats\/.+/.test(pathname)
  const toggleTheme = () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    localStorage.setItem('kora-theme', next)
  }

  return (
    <div className={`shell${inRoom ? ' in-room' : ''}`}>
      <header className="brand">
        <span><Logo /> Kora</span>
        <button className="btn sm" onClick={toggleTheme} aria-label="Ganti tema terang atau gelap">◐</button>
      </header>
      <nav className="nav" aria-label="Navigasi utama">
        {NAV.map(([to, label, icon]) => (
          <NavLink key={to} to={to} end={to === '/'}>
            <Icon name={icon} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="content"><Outlet /></div>
    </div>
  )
}
