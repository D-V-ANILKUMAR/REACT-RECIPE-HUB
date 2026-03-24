import { useState, useEffect } from 'react'
import API from '../api'

export default function YouTubeVideos() {
  const [videos, setVideos] = useState([])
  const [search, setSearch] = useState('cooking recipe')
  const [loading, setLoading] = useState(true)
  const [selectedVideo, setSelectedVideo] = useState(null)

  const handleVideoClick = (video) => {
    setSelectedVideo(video)
    setTimeout(() => {
      document.getElementById('yt-player-container-page')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 100)
  }

  const fetchVideos = async (query) => {
    setLoading(true)
    try {
      const res = await API.get('/youtube/search', { params: { q: query } })
      setVideos(res.data.items || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVideos(search)
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    fetchVideos(search)
  }

  return (
    <div className="section fade-in">
      <div className="dashboard-header">
        <h1><span className="sticker sticker-bounce">📺</span> Food Video Recipes</h1>
        <p>Discover amazing cooking videos from YouTube 🎬</p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} style={{ maxWidth: 500, marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search food videos..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1 }}
          />
          <button type="submit" className="nav-btn-primary">
            🔍 Search
          </button>
        </div>
      </form>

      {/* Quick Tags */}
      <div className="category-filters" style={{ marginBottom: '2rem' }}>
        {['Biryani', 'Pasta', 'Pizza', 'Cake', 'Dosa', 'Sushi', 'Burger', 'Curry', 'Ramen', 'Tacos'].map(tag => (
          <button key={tag} className="category-chip" onClick={() => { setSearch(tag); fetchVideos(tag); }}>
            🍴 {tag}
          </button>
        ))}
      </div>

      {/* Video Player */}
      {selectedVideo && (
        <div id="yt-player-container-page" className="recipe-section" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2><span className="sticker">▶️</span> Now Playing</h2>
            <button className="btn-icon" onClick={() => setSelectedVideo(null)}>✕</button>
          </div>
          <iframe
            className="recipe-video-embed"
            src={`https://www.youtube.com/embed/${typeof selectedVideo.id === 'string' ? selectedVideo.id : selectedVideo.id?.videoId}?rel=0&origin=${window.location.origin}`}
            title={selectedVideo.snippet?.title}
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
          <h3 style={{ marginTop: '1rem', fontSize: '1.1rem' }}>{selectedVideo.snippet?.title}</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
            {selectedVideo.snippet?.channelTitle} • {selectedVideo.snippet?.description?.slice(0, 150)}...
          </p>
        </div>
      )}

      {/* Video Grid */}
      {loading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Finding delicious videos... 📺</p>
        </div>
      ) : (
        <div className="youtube-grid">
          {videos.map((video, index) => (
            <div
              key={index}
              className="youtube-card glow-on-hover"
              onClick={() => handleVideoClick(video)}
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

      {videos.length === 0 && !loading && (
        <div className="empty-state">
          <div className="sticker" style={{ fontSize: '4rem' }}>📺</div>
          <h3>No videos found</h3>
          <p>Try a different search term</p>
        </div>
      )}
    </div>
  )
}
