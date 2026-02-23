import { Link, useLocation } from 'react-router-dom'
import Button from './Button'

export default function Header({ user, onLogout }) {
  const location = useLocation()

  const isActive = (path) => location.pathname === path ? 'text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-white'

  return (
    <header className="bg-dark-secondary border-b border-[rgba(255,255,255,0.1)] sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo and Nav */}
        <div className="flex items-center gap-8">
          <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            HabitSync
          </Link>
          
          <nav className="hidden md:flex gap-6">
            <Link to="/dashboard" className={`pb-2 transition ${isActive('/dashboard')}`}>
              Dashboard
            </Link>
            <Link to="/stats" className={`pb-2 transition ${isActive('/stats')}`}>
              Stats
            </Link>
          </nav>
        </div>

        {/* User Info and Logout */}
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm text-gray-400">Welcome</p>
            <p className="font-semibold">{user?.displayName || user?.email || 'User'}</p>
          </div>
          <Button 
            onClick={onLogout}
            variant="secondary"
            size="sm"
          >
            Logout
          </Button>
        </div>
      </div>
    </header>
  )
}
