import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    mobile: '', gender: '', age: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) {
      return setError('Passwords do not match!')
    }
    if (form.password.length < 6) {
      return setError('Password must be at least 6 characters')
    }

    setLoading(true)
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        mobile: form.mobile,
        gender: form.gender,
        age: parseInt(form.age) || null
      })
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card fade-in">
        <h1><span className="sticker sticker-bounce">🧑‍🍳</span> Join RecipeHub</h1>
        <p className="auth-subtitle">Create your free account and start cooking!</p>

        {error && <div className="auth-error">⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label><span className="sticker">👤</span> Full Name</label>
            <input type="text" name="name" className="form-input" placeholder="Your full name"
              value={form.name} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label><span className="sticker">📧</span> Gmail / Email</label>
            <input type="email" name="email" className="form-input" placeholder="you@gmail.com"
              value={form.email} onChange={handleChange} required />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label><span className="sticker">📱</span> Mobile Number</label>
              <input type="tel" name="mobile" className="form-input" placeholder="9876543210"
                value={form.mobile} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label><span className="sticker">🎂</span> Age</label>
              <input type="number" name="age" className="form-input" placeholder="25"
                value={form.age} onChange={handleChange} min="13" max="120" />
            </div>
          </div>

          <div className="form-group">
            <label><span className="sticker">⚧️</span> Gender</label>
            <select name="gender" className="form-select" value={form.gender} onChange={handleChange}>
              <option value="">Select Gender</option>
              <option value="Male">🙋‍♂️ Male</option>
              <option value="Female">🙋‍♀️ Female</option>
              <option value="Other">🌈 Other</option>
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label><span className="sticker">🔒</span> Password</label>
              <input type="password" name="password" className="form-input" placeholder="Min 6 chars"
                value={form.password} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label><span className="sticker">🔒</span> Confirm Password</label>
              <input type="password" name="confirmPassword" className="form-input" placeholder="Repeat password"
                value={form.confirmPassword} onChange={handleChange} required />
            </div>
          </div>

          <button type="submit" className="btn-primary btn-auth-submit" disabled={loading}>
            {loading ? '⏳ Creating Account...' : '🚀 Create Account'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign In 🔑</Link>
        </p>
      </div>
    </div>
  )
}
