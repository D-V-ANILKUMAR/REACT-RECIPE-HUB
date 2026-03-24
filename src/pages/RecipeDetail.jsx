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
      {/* Hero Section */}
      <div className="recipe-detail-hero">
        <img
          src={recipe.thumbnail ? `http://localhost:5000${recipe.thumbnail}` : `https://picsum.photos/seed/${recipe.id}/900/400`}
          alt={recipe.title}
        />
        <div className="recipe-detail-overlay">
          <div className="recipe-detail-tags">
            {recipe.category && <span className="recipe-tag">🏷️ {recipe.category}</span>}
            {recipe.cuisine && <span className="recipe-tag">🌍 {recipe.cuisine}</span>}
            {recipe.difficulty && <span className="recipe-tag">📊 {recipe.difficulty}</span>}
          </div>
          <h1>{recipe.title}</h1>
          <div className="recipe-author-compact">
            <img
              src={recipe.author_photo ? `http://localhost:5000${recipe.author_photo}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(recipe.author_name)}&background=6c5ce7&color=fff&size=30`}
              alt={recipe.author_name}
            />
            <span>{recipe.author_name} • {new Date(recipe.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="recipe-layout-grid">
        {/* Left Column: Video & Instructions */}
        <div className="recipe-main-content">
          {/* Quick Info Bar */}
          <div className="recipe-quick-info">
            <div className="info-stat">
              <span className="sticker">⏱️</span>
              <div>
                <p>Time</p>
                <h5>{recipe.cook_time || 'N/A'}</h5>
              </div>
            </div>
            <div className="info-stat">
              <span className="sticker">🍽️</span>
              <div>
                <p>Servings</p>
                <h5>{recipe.servings || 'N/A'}</h5>
              </div>
            </div>
            <div className="info-stat">
              <span className="sticker">👁️</span>
              <div>
                <p>Views</p>
                <h5>{recipe.views || 0}</h5>
              </div>
            </div>
            <div className="info-stat" onClick={handleLike} style={{ cursor: 'pointer' }}>
              <span className="sticker">{liked ? '❤️' : '🤍'}</span>
              <div>
                <p>Likes</p>
                <h5>{recipe.likes || 0}</h5>
              </div>
            </div>
          </div>

          {/* Video Block (Primary focus) */}
          {(recipe.video_file || embedUrl) && (
            <div className="recipe-section video-section-highlight">
              <h2><span className="sticker">🎥</span> Video Tutorial</h2>
              {recipe.video_file ? (
                <video
                  controls
                  className="recipe-main-video"
                  poster={recipe.thumbnail ? `http://localhost:5000${recipe.thumbnail}` : undefined}
                >
                  <source src={`http://localhost:5000${recipe.video_file}`} />
                  Your browser does not support the video tag.
                </video>
              ) : (
                <iframe
                  className="recipe-video-embed"
                  src={embedUrl}
                  title="Recipe Video"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              )}
            </div>
          )}

          {/* About */}
          {recipe.description && (
            <div className="recipe-section">
              <h2><span className="sticker">📖</span> About This Recipe</h2>
              <p className="description-text">{recipe.description}</p>
            </div>
          )}

          {/* Instructions */}
          {recipe.instructions && (
            <div className="recipe-section">
              <h2><span className="sticker">👨‍🍳</span> Preparation Steps</h2>
              <ol className="instructions-list">
                {recipe.instructions.split('\n').filter(i => i.trim()).map((step, idx) => (
                  <li key={idx}>{step.replace(/^step\s*\d+[:.]\s*/i, '').trim()}</li>
                ))}
              </ol>
            </div>
          )}
        </div>

        {/* Right Column: Sidebar (Ingredients & Actions) */}
        <aside className="recipe-sidebar">
          {/* Ingredients */}
          {recipe.ingredients && (
            <div className="recipe-section sidebar-section">
              <h3><span className="sticker">🥕</span> Ingredients</h3>
              <ul className="ingredients-list">
                {recipe.ingredients.split('\n').filter(i => i.trim()).map((item, idx) => (
                  <li key={idx}>{item.trim()}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="recipe-actions-sticky">
            <button className="btn-secondary share-btn" onClick={handleShare}>
              <span>🔗</span> Share Recipe
            </button>
            
            {user && (user.id === recipe.user_id || user.role === 'admin') && (
              <div className="owner-actions">
                <button className="btn-primary" onClick={() => navigate(`/edit-recipe/${recipe.id}`)}>
                  ✏️ Edit
                </button>
                <button className="btn-danger" onClick={async () => {
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
        </aside>
      </div>
    </div>
  )
}
