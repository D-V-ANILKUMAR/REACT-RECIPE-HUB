import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import API from '../api'

export default function RecipeDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [recipe, setRecipe] = useState(null)
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState(false)

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const res = await API.get(`/recipes/${id}`)
        setRecipe(res.data)
        
        // Record unique view if user is logged in
        if (localStorage.getItem('token')) {
          await API.post(`/recipes/${id}/view`).catch(() => {});
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchRecipe()
  }, [id])

  const handleLike = async () => {
    if (!user) return navigate('/login')
    try {
      const res = await API.post(`/recipes/${id}/like`)
      setLiked(res.data.liked)
      setRecipe(prev => ({
        ...prev,
        likes: prev.likes + (res.data.liked ? 1 : -1)
      }))
    } catch (err) {
      console.error(err)
    }
  }

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    alert('Recipe link copied to clipboard! 📋');
  }

  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
    return match ? `https://www.youtube.com/embed/${match[1]}?rel=0&origin=${window.location.origin}` : null
  }

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>
  if (!recipe) return <div className="empty-state"><div className="sticker">😕</div><h3>Recipe not found</h3></div>

  const embedUrl = getYouTubeEmbedUrl(recipe.video_url)

  return (
    <div className="recipe-detail fade-in">
      {/* Hero Image */}
      <div className="recipe-detail-hero">
        <img
          src={recipe.thumbnail ? `http://localhost:5000${recipe.thumbnail}` : `https://picsum.photos/seed/${recipe.id}/900/400`}
          alt={recipe.title}
        />
        <div className="recipe-detail-overlay">
          <h1>{recipe.title}</h1>
          <div className="recipe-detail-tags">
            {recipe.category && <span className="recipe-tag">🏷️ {recipe.category}</span>}
            {recipe.cuisine && <span className="recipe-tag">🌍 {recipe.cuisine}</span>}
            {recipe.difficulty && <span className="recipe-tag">📊 {recipe.difficulty}</span>}
          </div>
        </div>
      </div>

      {/* Quick Info */}
      <div className="recipe-detail-info">
        <div className="recipe-info-card">
          <div className="sticker">⏱️</div>
          <h4>{recipe.cook_time || 'N/A'}</h4>
          <p>Cook Time</p>
        </div>
        <div className="recipe-info-card">
          <div className="sticker">🍽️</div>
          <h4>{recipe.servings || 'N/A'}</h4>
          <p>Servings</p>
        </div>
        <div className="recipe-info-card">
          <div className="sticker">👁️</div>
          <h4>{recipe.views || 0}</h4>
          <p>Views</p>
        </div>
        <div className="recipe-info-card" onClick={handleLike} style={{ cursor: 'pointer' }}>
          <div className="sticker">{liked ? '❤️' : '🤍'}</div>
          <h4>{recipe.likes || 0}</h4>
          <p>Likes</p>
        </div>
        <div className="recipe-info-card" onClick={handleShare} style={{ cursor: 'pointer' }}>
          <div className="sticker">🔗</div>
          <h4>Share</h4>
          <p>Invite friends</p>
        </div>
      </div>

      {/* Author */}
      <div className="recipe-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img
            src={recipe.author_photo ? `http://localhost:5000${recipe.author_photo}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(recipe.author_name)}&background=6c5ce7&color=fff&size=45`}
            alt={recipe.author_name}
            style={{ width: 45, height: 45, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent-primary)' }}
          />
          <div>
            <h4 style={{ fontSize: '1rem' }}>👨‍🍳 {recipe.author_name}</h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Published on {new Date(recipe.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      {/* Description */}
      {recipe.description && (
        <div className="recipe-section">
          <h2><span className="sticker">📖</span> About This Recipe</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>{recipe.description}</p>
        </div>
      )}

      {/* Ingredients */}
      {recipe.ingredients && (
        <div className="recipe-section">
          <h2><span className="sticker">🥕</span> Ingredients</h2>
          <ul>
            {recipe.ingredients.split('\n').filter(i => i.trim()).map((item, idx) => (
              <li key={idx}>{item.trim()}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Instructions */}
      {recipe.instructions && (
        <div className="recipe-section">
          <h2><span className="sticker">👨‍🍳</span> Instructions</h2>
          <ol>
            {recipe.instructions.split('\n').filter(i => i.trim()).map((step, idx) => (
              <li key={idx}>{step.replace(/^step\s*\d+[:.]\s*/i, '').trim()}</li>
            ))}
          </ol>
        </div>
      )}

      {/* Uploaded Video File */}
      {recipe.video_file && (
        <div className="recipe-section">
          <h2><span className="sticker">🎥</span> Recipe Video</h2>
          <video
            controls
            style={{ width: '100%', borderRadius: 'var(--radius-lg)', maxHeight: '500px', background: '#000' }}
            poster={recipe.thumbnail ? `http://localhost:5000${recipe.thumbnail}` : undefined}
          >
            <source src={`http://localhost:5000${recipe.video_file}`} />
            Your browser does not support the video tag.
          </video>
        </div>
      )}

      {/* YouTube Video */}
      {embedUrl && !recipe.video_file && (
        <div className="recipe-section">
          <h2><span className="sticker">📺</span> Video Tutorial</h2>
          <iframe
            className="recipe-video-embed"
            src={embedUrl}
            title="Recipe Video"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        </div>
      )}

      {/* Actions */}
      {user && (user.id === recipe.user_id || user.role === 'admin') && (
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <button className="btn-primary" style={{ flex: 1 }} onClick={() => navigate(`/edit-recipe/${recipe.id}`)}>
            ✏️ Edit Recipe
          </button>
          <button className="btn-danger" style={{ flex: 1 }} onClick={async () => {
            if (confirm('Are you sure you want to delete this recipe?')) {
              await API.delete(`/recipes/${recipe.id}`)
              navigate('/my-recipes')
            }
          }}>
            🗑️ Delete
          </button>
        </div>
      )}
    </div>
  )
}
