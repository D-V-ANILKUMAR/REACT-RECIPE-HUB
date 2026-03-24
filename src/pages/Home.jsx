import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import API from '../api'

const categories = [
  { name: 'All', icon: '🍽️' },
  { name: 'Breakfast', icon: '🥞' },
  { name: 'Lunch', icon: '🥗' },
  { name: 'Dinner', icon: '🍝' },
  { name: 'Dessert', icon: '🍰' },
  { name: 'Snacks', icon: '🍿' },
  { name: 'Beverages', icon: '🧃' },
  { name: 'Indian', icon: '🍛' },
  { name: 'Italian', icon: '🍕' },
  { name: 'Chinese', icon: '🥡' },
  { name: 'Mexican', icon: '🌮' },
]

const ytQuickTags = ['Biryani', 'Pasta', 'Pizza', 'Cake', 'Dosa', 'Sushi', 'Burger', 'Curry', 'Ramen', 'Tacos', 'Noodles', 'Salad']

export default function Home() {
  const [recipes, setRecipes] = useState([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const navigate = useNavigate()

  // YouTube videos state
  const [ytVideos, setYtVideos] = useState([])
  const [ytSearch, setYtSearch] = useState('cooking recipe')
  const [ytLoading, setYtLoading] = useState(true)
  const [selectedYtVideo, setSelectedYtVideo] = useState(null)

  const handleYtVideoClick = (video) => {
    setSelectedYtVideo(video)
    setTimeout(() => {
      document.getElementById('yt-player-container')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 100)
  }

  const fetchRecipes = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, limit: 12 }
      if (search) params.search = search
      if (category) params.category = category
      const res = await API.get('/recipes', { params })
      setRecipes(res.data.recipes)
      setTotal(res.data.total)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [search, category, page])

  const fetchYtVideos = useCallback(async (query) => {
    setYtLoading(true)
    try {
      const res = await API.get('/youtube/search', { params: { q: query } })
      setYtVideos(res.data.items || [])
    } catch (err) {
      console.error(err)
    } finally {
      setYtLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRecipes()
  }, [fetchRecipes])

  useEffect(() => {
    fetchYtVideos(ytSearch)
  }, [])

  const handleSearchInput = async (e) => {
    const val = e.target.value
    setSearch(val)
    if (val.length >= 2) {
      try {
        const res = await API.get('/recipes/suggestions', { params: { q: val } })
        setSuggestions(res.data)
      } catch { setSuggestions([]) }
    } else {
      setSuggestions([])
    }
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setSuggestions([])
    setPage(1)
    fetchRecipes()
  }

  const selectSuggestion = (title) => {
    setSearch(title)
    setSuggestions([])
    setPage(1)
  }

  const totalPages = Math.ceil(total / 12)

  return (
    <div className="fade-in">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-badge">
          <span>🔥</span> The #1 Recipe Sharing Platform
        </div>
        <h1>
          Discover & Share<br />
          <span className="gradient-text">Delicious</span>{' '}
          <span className="script-text">Recipes</span>
        </h1>
        <p>
          Join thousands of food lovers sharing their best recipes. 
          Upload, explore, and cook amazing dishes from around the world! 🌍
        </p>

        {/* Search Bar */}
        <form className="hero-search" onSubmit={handleSearchSubmit}>
          <input
            type="text"
            className="hero-search-input"
            placeholder="🔍 Search recipes, cuisines, ingredients..."
            value={search}
            onChange={handleSearchInput}
          />
          <button type="submit" className="hero-search-btn">🔍</button>

          {suggestions.length > 0 && (
            <div className="search-suggestions">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  className="search-suggestion-item"
                  onClick={() => selectSuggestion(s.title)}
                  type="button"
                >
                  <span className="sticker">🍴</span>
                  <div>
                    <strong>{s.title}</strong>
                    {s.category && <span style={{ marginLeft: 8, color: 'var(--text-muted)', fontSize: '0.78rem' }}>in {s.category}</span>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </form>

        <div className="hero-stats">
          <div className="hero-stat">
            <div className="hero-stat-value">{total || '0'}+</div>
            <div className="hero-stat-label">Recipes</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-value">🧑‍🍳</div>
            <div className="hero-stat-label">Chefs</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-value">🌎</div>
            <div className="hero-stat-label">Cuisines</div>
          </div>
        </div>
      </section>

      {/* Categories & Recipes */}
      <section className="section">
        <div className="section-header">
          <h2 className="section-title">
            <span className="sticker sticker-bounce">🔥</span> Explore Recipes
          </h2>
        </div>

        <div className="category-filters">
          {categories.map(cat => (
            <button
              key={cat.name}
              className={`category-chip ${category === (cat.name === 'All' ? '' : cat.name) ? 'active' : ''}`}
              onClick={() => { setCategory(cat.name === 'All' ? '' : cat.name); setPage(1); }}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>

        {/* Recipe Grid */}
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading delicious recipes... 🍳</p>
          </div>
        ) : recipes.length === 0 ? (
          <div className="empty-state">
            <div className="sticker" style={{ fontSize: '4rem' }}>🍽️</div>
            <h3>No recipes found</h3>
            <p>Try a different search or be the first to upload!</p>
            <Link to="/upload">
              <button className="btn-primary" style={{ width: 'auto', padding: '12px 30px' }}>
                📤 Upload Recipe
              </button>
            </Link>
          </div>
        ) : (
          <>
            <div className="recipes-grid">
              {recipes.map(recipe => (
                <div
                  key={recipe.id}
                  className="recipe-card glow-on-hover"
                  onClick={() => navigate(`/recipe/${recipe.id}`)}
                >
                  <div className="recipe-card-img-wrapper">
                    <img
                      src={recipe.thumbnail ? `http://localhost:5000${recipe.thumbnail}` : `https://picsum.photos/seed/${recipe.id}/400/300`}
                      alt={recipe.title}
                      className="recipe-card-img"
                    />
                    {recipe.category && (
                      <span className="recipe-card-badge">🏷️ {recipe.category}</span>
                    )}
                    {recipe.cook_time && (
                      <span className="recipe-card-time">⏱️ {recipe.cook_time}</span>
                    )}
                    {recipe.video_file && (
                      <span className="recipe-card-time" style={{ left: 12, right: 'auto', bottom: 12, background: 'rgba(255,107,53,0.8)' }}>🎥 Video</span>
                    )}
                  </div>
                  <div className="recipe-card-body">
                    <h3 className="recipe-card-title">{recipe.title}</h3>
                    <p className="recipe-card-desc">{recipe.description}</p>
                    <div className="recipe-card-meta">
                      <div className="recipe-card-author">
                        <img
                          src={recipe.author_photo 
                            ? `http://localhost:5000${recipe.author_photo}` 
                            : `https://ui-avatars.com/api/?name=${encodeURIComponent(recipe.author_name)}&background=6c5ce7&color=fff&size=28`}
                          alt={recipe.author_name}
                        />
                        {recipe.author_name}
                      </div>
                      <div className="recipe-card-stats">
                        <span>👁️ {recipe.views || 0}</span>
                        <span>❤️ {recipe.likes || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button className="page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                  ← Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    className={`page-btn ${page === p ? 'active' : ''}`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                ))}
                <button className="page-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* ============= YOUTUBE FOOD VIDEOS SECTION ============= */}
      <section className="section" style={{ borderTop: '1px solid var(--border)', paddingTop: '3rem' }}>
        <div className="section-header">
          <h2 className="section-title">
            <span className="sticker sticker-bounce">📺</span> Trending Food Videos
          </h2>
          <Link to="/youtube">
            <button className="nav-btn-primary">
              See All Videos →
            </button>
          </Link>
        </div>

        {/* Quick Tags */}
        <div className="category-filters" style={{ marginBottom: '1.5rem' }}>
          {ytQuickTags.map(tag => (
            <button
              key={tag}
              className={`category-chip ${ytSearch === tag ? 'active' : ''}`}
              onClick={() => { setYtSearch(tag); fetchYtVideos(tag); setSelectedYtVideo(null); }}
            >
              🍴 {tag}
            </button>
          ))}
        </div>

        {/* Selected Video Player */}
        {selectedYtVideo && (
          <div id="yt-player-container" className="recipe-section" style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>▶️</span> Now Playing
              </h3>
              <button className="btn-icon" onClick={() => setSelectedYtVideo(null)}>✕</button>
            </div>
            <iframe
              style={{ width: '100%', aspectRatio: '16/9', borderRadius: 'var(--radius-lg)', border: 'none', marginTop: '1rem' }}
              src={`https://www.youtube.com/embed/${typeof selectedYtVideo.id === 'string' ? selectedYtVideo.id : selectedYtVideo.id?.videoId}?rel=0&origin=${window.location.origin}`}
              title={selectedYtVideo.snippet?.title}
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
            <h3 style={{ marginTop: '1rem', fontSize: '1.05rem' }}>{selectedYtVideo.snippet?.title}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '4px' }}>
              📺 {selectedYtVideo.snippet?.channelTitle}
            </p>
          </div>
        )}

        {/* Video Grid */}
        {ytLoading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading food videos... 📺</p>
          </div>
        ) : (
          <div className="youtube-grid">
            {ytVideos.slice(0, 6).map((video, index) => (
              <div
                key={index}
                className="youtube-card glow-on-hover"
                onClick={() => handleYtVideoClick(video)}
              >
                <img
                  src={video.snippet?.thumbnails?.high?.url || video.snippet?.thumbnails?.default?.url}
                  alt={video.snippet?.title}
                />
                <div className="youtube-card-body">
                  <h3>{video.snippet?.title}</h3>
                  <p>📺 {video.snippet?.channelTitle}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
