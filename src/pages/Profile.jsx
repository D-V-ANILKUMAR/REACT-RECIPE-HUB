import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import API, { BASE_URL } from '../api'

export default function Profile() {
  const { user, updateUser } = useAuth()
  const [form, setForm] = useState({
    name: '', mobile: '', gender: '', age: '', password: ''
  })
  const [profilePhoto, setProfilePhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await API.get('/profile')
      setProfile(res.data)
      setForm({
        name: res.data.name || '',
        mobile: res.data.mobile || '',
        gender: res.data.gender || '',
        age: res.data.age || '',
        password: ''
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setProfilePhoto(file)
      setPhotoPreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      const formData = new FormData()
      formData.append('name', form.name)
      formData.append('mobile', form.mobile)
      formData.append('gender', form.gender)
      formData.append('age', form.age)
      if (form.password) formData.append('password', form.password)
      if (profilePhoto) formData.append('profile_photo', profilePhoto)

      // 2. We MUST send data to backend (Permanent saving)
      const res = await API.put('/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      // 3. Reload updated data after saving (Very Important)
      await fetchProfile()
      
      // Update global context for navbar/sync
      updateUser({ ...user, name: res.data.name, profile_photo: res.data.profile_photo })
      
      setMessage('✅ Profile updated successfully!')
      setForm(prev => ({ ...prev, password: '' }))
    } catch (err) {
      setMessage('❌ ' + (err.response?.data?.error || 'Failed to update profile'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>

  return (
    <div className="profile-page fade-in">
      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-avatar-wrapper">
          {photoPreview || profile?.profile_photo ? (
            <img
              src={photoPreview || `${BASE_URL}${profile.profile_photo}`}
              alt="Profile"
              className="profile-avatar"
            />
          ) : (
            <div className="profile-avatar-placeholder">🧑‍🍳</div>
          )}
        </div>
        <h2 className="profile-name">{profile?.name}</h2>
        <p className="profile-email">{profile?.email}</p>
        {profile?.role === 'admin' && <span className="nav-role-badge" style={{ marginTop: '8px', display: 'inline-block' }}>👑 Admin</span>}
        <div style={{ marginTop: '12px', display: 'flex', gap: '1.5rem', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          {profile?.mobile && <span>📱 {profile.mobile}</span>}
          {profile?.gender && <span>⚧️ {profile.gender}</span>}
          {profile?.age && <span>🎂 {profile.age} yrs</span>}
        </div>
      </div>

      {/* Edit Form */}
      <div className="profile-form">
        <h2><span className="sticker">✏️</span> Edit Profile</h2>

        {message && (
          <div className={`auth-error`} style={{ background: message.startsWith('✅') ? 'rgba(0,184,148,0.1)' : undefined, borderColor: message.startsWith('✅') ? 'rgba(0,184,148,0.3)' : undefined, color: message.startsWith('✅') ? '#00b894' : undefined }}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label><span className="sticker">📸</span> Profile Photo</label>
            <div className="file-upload-zone" style={{ padding: '1.5rem' }}>
              <div className="sticker" style={{ fontSize: '2rem' }}>📷</div>
              <p>Click to upload profile photo</p>
              <input type="file" accept="image/*" onChange={handlePhotoChange} />
            </div>
            {photoPreview && <img src={photoPreview} alt="Preview" className="file-preview" style={{ marginTop: '1rem', maxHeight: '150px', borderRadius: '50%', width: '150px', objectFit: 'cover', margin: '1rem auto 0' }} />}
          </div>

          <div className="form-group">
            <label><span className="sticker">👤</span> Full Name</label>
            <input type="text" className="form-input" value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label><span className="sticker">📱</span> Mobile Number</label>
              <input type="tel" className="form-input" value={form.mobile}
                onChange={e => setForm({ ...form, mobile: e.target.value })} />
            </div>
            <div className="form-group">
              <label><span className="sticker">🎂</span> Age</label>
              <input type="number" className="form-input" value={form.age}
                onChange={e => setForm({ ...form, age: e.target.value })} min="13" max="120" />
            </div>
          </div>

          <div className="form-group">
            <label><span className="sticker">⚧️</span> Gender</label>
            <select className="form-select" value={form.gender}
              onChange={e => setForm({ ...form, gender: e.target.value })}>
              <option value="">Select Gender</option>
              <option value="Male">🙋‍♂️ Male</option>
              <option value="Female">🙋‍♀️ Female</option>
              <option value="Other">🌈 Other</option>
            </select>
          </div>

          <div className="form-group">
            <label><span className="sticker">📧</span> Email (cannot change)</label>
            <input type="email" className="form-input" value={profile?.email || ''} disabled
              style={{ opacity: 0.5 }} />
          </div>

          <div className="form-group">
            <label><span className="sticker">🔒</span> New Password (leave blank to keep current)</label>
            <input type="password" className="form-input" placeholder="Enter new password"
              value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          </div>

          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? '⏳ Saving...' : '💾 Save Profile'}
          </button>
        </form>
      </div>
    </div>
  )
}
