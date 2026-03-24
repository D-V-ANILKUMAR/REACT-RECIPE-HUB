import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import API from '../api'

const categories = ['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snacks', 'Beverages', 'Appetizer']
const cuisines = ['Indian', 'Italian', 'Chinese', 'Mexican', 'Japanese', 'Thai', 'American', 'French', 'Mediterranean', 'Korean']
const difficulties = ['Easy', 'Medium', 'Hard', 'Expert']

export default function EditRecipe() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '', description: '', ingredients: '', instructions: '',
    category: '', cuisine: '', cook_time: '', servings: '',
    difficulty: '', video_url: ''
  })
  const [thumbnail, setThumbnail] = useState(null)
  const [thumbPreview, setThumbPreview] = useState(null)
  const [existingThumb, setExistingThumb] = useState(null)
  const [videoFile, setVideoFile] = useState(null)
  const [videoPreview, setVideoPreview] = useState(null)
  const [existingVideoFile, setExistingVideoFile] = useState(null)
  const [videoSource, setVideoSource] = useState('none')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const res = await API.get(`/recipes/${id}`)
        const r = res.data
        setForm({
          title: r.title || '', description: r.description || '',
          ingredients: r.ingredients || '', instructions: r.instructions || '',
          category: r.category || '', cuisine: r.cuisine || '',
          cook_time: r.cook_time || '', servings: r.servings || '',
          difficulty: r.difficulty || '', video_url: r.video_url || ''
        })
        setExistingThumb(r.thumbnail)
        setExistingVideoFile(r.video_file)
        // Determine video source
        if (r.video_file) setVideoSource('file')
        else if (r.video_url) setVideoSource('youtube')
        else setVideoSource('none')
      } catch (err) {
        setError('Failed to load recipe')
      } finally {
        setLoading(false)
      }
    }
    fetchRecipe()
  }, [id])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleThumbnail = (e) => {
    const file = e.target.files[0]
    if (file) {
      setThumbnail(file)
      setThumbPreview(URL.createObjectURL(file))
    }
  }

  const handleVideoFile = (e) => {
    const file = e.target.files[0]
    if (file) {
      setVideoFile(file)
      setVideoPreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const formData = new FormData()
      Object.keys(form).forEach(key => {
        if (key === 'video_url' && videoSource !== 'youtube') {
          formData.append(key, '')
        } else {
          formData.append(key, form[key])
        }
      })
      if (thumbnail) formData.append('thumbnail', thumbnail)
      if (videoFile && videoSource === 'file') formData.append('video_file', videoFile)

      await API.put(`/recipes/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      navigate('/my-recipes')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update recipe')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="loading-spinner"><div className="spinner"></div><p>Loading recipe... 🍳</p></div>

  return (
    <div className="upload-page fade-in">
      <div className="upload-card">
        <h1><span className="sticker sticker-bounce">✏️</span> Edit Recipe</h1>
        <p className="subtitle">Update your recipe details below</p>

        {error && <div className="auth-error">⚠️ {typeof error === 'string' ? error : (error?.message || JSON.stringify(error))}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label><span className="sticker">🖼️</span> Recipe Thumbnail</label>
            <div className="file-upload-zone">
              <div className="sticker" style={{ fontSize: '3rem' }}>📷</div>
              <p>Click to change thumbnail</p>
              <input type="file" accept="image/*" onChange={handleThumbnail} />
            </div>
            {(thumbPreview || existingThumb) && (
              <img src={thumbPreview || `http://localhost:5000${existingThumb}`} alt="Preview" className="file-preview" />
            )}
          </div>

          <div className="form-group">
            <label><span className="sticker">📝</span> Recipe Title</label>
            <input type="text" name="title" className="form-input" value={form.title} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label><span className="sticker">📖</span> Description</label>
            <textarea name="description" className="form-textarea" value={form.description} onChange={handleChange} rows="3" />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label><span className="sticker">🏷️</span> Category</label>
              <select name="category" className="form-select" value={form.category} onChange={handleChange}>
                <option value="">Select Category</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label><span className="sticker">🌍</span> Cuisine</label>
              <select name="cuisine" className="form-select" value={form.cuisine} onChange={handleChange}>
                <option value="">Select Cuisine</option>
                {cuisines.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
            <div className="form-group">
              <label><span className="sticker">⏱️</span> Cook Time</label>
              <input type="text" name="cook_time" className="form-input" value={form.cook_time} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label><span className="sticker">🍽️</span> Servings</label>
              <input type="text" name="servings" className="form-input" value={form.servings} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label><span className="sticker">📊</span> Difficulty</label>
              <select name="difficulty" className="form-select" value={form.difficulty} onChange={handleChange}>
                <option value="">Select</option>
                {difficulties.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label><span className="sticker">🥕</span> Ingredients (one per line)</label>
            <textarea name="ingredients" className="form-textarea" value={form.ingredients} onChange={handleChange} rows="5" />
          </div>

          <div className="form-group">
            <label><span className="sticker">👨‍🍳</span> Instructions (one step per line)</label>
            <textarea name="instructions" className="form-textarea" value={form.instructions} onChange={handleChange} rows="6" />
          </div>

          {/* ========= VIDEO SECTION ========= */}
          <div className="form-group">
            <label><span className="sticker">🎬</span> Recipe Video (choose one option)</label>
            <div className="video-source-tabs">
              <button type="button" className={`video-tab ${videoSource === 'none' ? 'active' : ''}`}
                onClick={() => { setVideoSource('none'); setVideoFile(null); setVideoPreview(null); setForm({...form, video_url: ''}) }}>
                🚫 No Video
              </button>
              <button type="button" className={`video-tab ${videoSource === 'file' ? 'active' : ''}`}
                onClick={() => { setVideoSource('file'); setForm({...form, video_url: ''}) }}>
                📁 Upload from Device
              </button>
            </div>
          </div>

          {/* Video File Upload */}
          {videoSource === 'file' && (
            <div className="form-group">
              {existingVideoFile && !videoPreview && (
                <div style={{ marginBottom: '1rem', padding: '12px', background: 'rgba(0,184,148,0.08)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(0,184,148,0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-green)', fontSize: '0.85rem', marginBottom: '8px' }}>
                    <span>✅</span> Existing video uploaded
                  </div>
                  <video src={`http://localhost:5000${existingVideoFile}`} controls style={{ width: '100%', maxHeight: '250px', borderRadius: 'var(--radius-sm)' }} />
                </div>
              )}
              <div className="file-upload-zone video-upload-zone">
                <div className="sticker" style={{ fontSize: '3rem' }}>🎥</div>
                <p>{existingVideoFile ? 'Click to replace video file' : 'Click to upload a video file (MP4, WebM, MOV)'}</p>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>Max size: 200MB</p>
                <input type="file" accept="video/mp4,video/webm,video/quicktime,video/*" onChange={handleVideoFile} />
              </div>
              {videoPreview && (
                <div style={{ marginTop: '1rem' }}>
                  <video src={videoPreview} controls style={{ width: '100%', maxHeight: '300px', borderRadius: 'var(--radius-md)' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', color: 'var(--accent-green)', fontSize: '0.85rem' }}>
                    <span>✅</span> {videoFile?.name} ({(videoFile?.size / (1024 * 1024)).toFixed(1)} MB)
                  </div>
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button type="submit" className="btn-primary" disabled={saving} style={{ flex: 1 }}>
              {saving ? '⏳ Saving...' : '💾 Update Recipe'}
            </button>
            <button type="button" className="btn-secondary" onClick={() => navigate('/my-recipes')} style={{ flex: 1 }}>
              ❌ Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
