import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { BASE_URL } from '../api'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (path) => location.pathname === path ? 'active' : ''

  const handleLogout = () => {
    logout()
    setDropdownOpen(false)
    navigate('/')
  }

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">
          <span className="logo-icon">🍳</span>
          <span className="logo-text">RecipeHub</span>
          <span className="logo-sub">Kitchen</span>
        </Link>

        <button className="nav-mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? '✕' : '☰'}
        </button>

        <div className={`navbar-links ${mobileOpen ? 'open' : ''}`}>
          <Link to="/" className={`nav-link ${isActive('/')}`} onClick={() => setMobileOpen(false)}>
            <span className="sticker">🏠</span> Home
          </Link>

          {user ? (
            <>
              <Link to="/upload" className={`nav-link ${isActive('/upload')}`} onClick={() => setMobileOpen(false)}>
                <span className="sticker">📤</span> Upload
              </Link>
              <Link to="/my-recipes" className={`nav-link ${isActive('/my-recipes')}`} onClick={() => setMobileOpen(false)}>
                <span className="sticker">📋</span> My Recipes
              </Link>
              <Link to="/dashboard" className={`nav-link ${isActive('/dashboard')}`} onClick={() => setMobileOpen(false)}>
                <span className="sticker">📊</span> Dashboard
              </Link>
              {user.role === 'admin' && (
                <Link to="/admin" className={`nav-link ${isActive('/admin')}`} onClick={() => setMobileOpen(false)}>
                  <span className="sticker">👑</span> Admin
                </Link>
              )}
              <div className="nav-user-menu">
                <img
                  src={user.profile_photo ? `${BASE_URL}${user.profile_photo}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=ff6b35&color=fff&size=40`}
                  alt={user.name}
                  className="nav-avatar"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                />
                {dropdownOpen && (
                  <div className="nav-dropdown">
                    <div className="nav-dropdown-header">
                    <h4>{typeof user?.name === 'string' ? user.name : 'Chefs'}</h4>
                      <p>{user.email}</p>
                      {user.role === 'admin' && <span className="nav-role-badge">Admin</span>}
                    </div>
                    <button className="nav-dropdown-item" onClick={() => { navigate('/profile'); setDropdownOpen(false); }}>
                      <span>👤</span> Profile
                    </button>
                    <button className="nav-dropdown-item" onClick={() => { navigate('/dashboard'); setDropdownOpen(false); }}>
                      <span>📊</span> Dashboard
                    </button>
                    <button className="nav-dropdown-item" onClick={() => { navigate('/my-recipes'); setDropdownOpen(false); }}>
                      <span>📋</span> My Recipes
                    </button>
                    <button className="nav-dropdown-item danger" onClick={handleLogout}>
                      <span>🚪</span> Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className={`nav-link ${isActive('/login')}`} onClick={() => setMobileOpen(false)}>
                <span className="sticker">🔑</span> Login
              </Link>
              <Link to="/register" onClick={() => setMobileOpen(false)}>
                <button className="nav-btn-primary">
                  <span>✨</span> Join Free
                </button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
