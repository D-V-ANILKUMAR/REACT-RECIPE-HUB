import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../api'

const categories = ['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snacks', 'Beverages', 'Appetizer']
const cuisines = ['Indian', 'Italian', 'Chinese', 'Mexican', 'Japanese', 'Thai', 'American', 'French', 'Mediterranean', 'Korean']
const difficulties = ['Easy', 'Medium', 'Hard', 'Expert']

export default function UploadRecipe() {
  const [form, setForm] = useState({
    title: '', description: '', ingredients: '', instructions: '',
    category: '', cuisine: '', cook_time: '', servings: '',
    difficulty: '', video_url: ''
  })
  const [thumbnail, setThumbnail] = useState(null)
  const [thumbPreview, setThumbPreview] = useState(null)
  const [videoFile, setVideoFile] = useState(null)
  const [videoPreview, setVideoPreview] = useState(null)
  const [videoSource, setVideoSource] = useState('none') // 'none', 'file', 'youtube'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

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
    setLoading(true)
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

      await API.post('/recipes', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      navigate('/my-recipes')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload recipe')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="upload-page fade-in">
      <div className="upload-card">
        <h1><span className="sticker sticker-bounce">📤</span> Upload Recipe</h1>
        <p className="subtitle">Share your culinary masterpiece with the world! 🌍</p>

        {error && <div className="auth-error">⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Thumbnail */}
          <div className="form-group">
            <label><span className="sticker">🖼️</span> Recipe Thumbnail</label>
            <div className="file-upload-zone">
              <div className="sticker" style={{ fontSize: '3rem' }}>📷</div>
              <p>Click or drag to upload a photo of your dish</p>
              <input type="file" accept="image/*" onChange={handleThumbnail} />
            </div>
            {thumbPreview && <img src={thumbPreview} alt="Preview" className="file-preview" />}
          </div>

          {/* Title */}
          <div className="form-group">
            <label><span className="sticker">📝</span> Recipe Title</label>
            <input type="text" name="title" className="form-input" placeholder="e.g. Butter Chicken Masala"
              value={form.title} onChange={handleChange} required />
          </div>

          {/* Description */}
          <div className="form-group">
            <label><span className="sticker">📖</span> Description</label>
            <textarea name="description" className="form-textarea" placeholder="Describe your recipe..."
              value={form.description} onChange={handleChange} rows="3" />
          </div>

          {/* Category & Cuisine */}
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

          {/* Cook Time, Servings, Difficulty */}
          <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
            <div className="form-group">
              <label><span className="sticker">⏱️</span> Cook Time</label>
              <input type="text" name="cook_time" className="form-input" placeholder="30 mins"
                value={form.cook_time} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label><span className="sticker">🍽️</span> Servings</label>
              <input type="text" name="servings" className="form-input" placeholder="4 people"
                value={form.servings} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label><span className="sticker">📊</span> Difficulty</label>
              <select name="difficulty" className="form-select" value={form.difficulty} onChange={handleChange}>
                <option value="">Select</option>
                {difficulties.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          {/* Ingredients */}
          <div className="form-group">
            <label><span className="sticker">🥕</span> Ingredients (one per line)</label>
            <textarea name="ingredients" className="form-textarea" placeholder="2 cups flour&#10;1 cup sugar&#10;3 eggs&#10;..."
              value={form.ingredients} onChange={handleChange} rows="5" />
          </div>

          {/* Instructions */}
          <div className="form-group">
            <label><span className="sticker">👨‍🍳</span> Instructions (one step per line)</label>
            <textarea name="instructions" className="form-textarea" placeholder="Step 1: Preheat oven to 350°F&#10;Step 2: Mix dry ingredients&#10;..."
              value={form.instructions} onChange={handleChange} rows="6" />
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
              <div className="file-upload-zone video-upload-zone">
                <div className="sticker" style={{ fontSize: '3rem' }}>🎥</div>
                <p>Click to upload a video file (MP4, WebM, MOV)</p>
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

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? '⏳ Uploading...' : '🚀 Publish Recipe'}
          </button>
        </form>
      </div>
    </div>
  )
}
