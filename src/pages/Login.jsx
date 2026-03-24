import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card fade-in">
        <h1><span className="sticker sticker-bounce">🔐</span> Welcome Back</h1>
        <p className="auth-subtitle">Sign in to your RecipeHub account</p>

        {error && <div className="auth-error">⚠️ {typeof error === 'string' ? error : (error?.message || JSON.stringify(error))}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label><span className="sticker">📧</span> Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="chef@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label><span className="sticker">🔒</span> Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-primary btn-auth-submit" disabled={loading}>
            {loading ? '⏳ Signing In...' : '🚀 Sign In'}
          </button>
        </form>

        <p className="auth-switch">
          Don't have an account? <Link to="/register">Create one ✨</Link>
        </p>

        {/* <div style={{ marginTop: '1.5rem', padding: '12px', background: 'rgba(255,107,53,0.08)', borderRadius: '8px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          <strong>👑 Admin Login:</strong> admin@recipehub.com / admin123
        </div> */}
      </div>
    </div>
  )
}
