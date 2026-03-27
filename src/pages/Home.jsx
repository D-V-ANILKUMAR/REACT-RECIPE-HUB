import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import API, { BASE_URL } from "../api";

const categories = [
  { name: "All", icon: "🍽️" },
  { name: "Breakfast", icon: "🥞" },
  { name: "Lunch", icon: "🥗" },
  { name: "Dinner", icon: "🍝" },
  { name: "Dessert", icon: "🍰" },
  { name: "Snacks", icon: "🍿" },
  { name: "Beverages", icon: "🧃" },
  { name: "Indian", icon: "🍛" },
  { name: "Italian", icon: "🍕" },
  { name: "Chinese", icon: "🥡" },
  { name: "Mexican", icon: "🌮" },
];

export default function Home() {
  const [recipes, setRecipes] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [youtubeVideos, setYoutubeVideos] = useState([]);
  const [ytLoading, setYtLoading] = useState(false);
  const [selectedYtVideo, setSelectedYtVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();

  const fetchRecipes = useCallback(async () => {
    setLoading(true);
    if (search || category) {
      setYtLoading(true);
    } else {
      setYoutubeVideos([]);
    }

    try {
      const params = { page, limit: 12 };
      if (search) params.search = search;
      if (category) params.category = category;

      const reqs = [API.get("/recipes", { params })];

      // Also fetch YouTube videos if there's a search or category
      if (search || category) {
        reqs.push(
          API.get("/youtube/search", {
            params: { q: search || category },
          }).catch(() => ({ data: { items: [] } })),
        );
      }

      const results = await Promise.all(reqs);

      setRecipes(results[0].data.recipes);
      setTotal(results[0].data.total);

      if (results[1]) {
        setYoutubeVideos(results[1].data.items || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setYtLoading(false);
    }
  }, [search, category, page]);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  const handleSearchInput = async (e) => {
    const val = e.target.value;
    setSearch(val);
    if (val.length >= 2) {
      try {
        const res = await API.get("/recipes/suggestions", {
          params: { q: val },
        });
        setSuggestions(res.data);
      } catch {
        setSuggestions([]);
      }
    } else {
      setSuggestions([]);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSuggestions([]);
    setPage(1);
    fetchRecipes();
  };

  const selectSuggestion = (title) => {
    setSearch(title);
    setSuggestions([]);
    setPage(1);
  };

  const totalPages = Math.ceil(total / 12);

  return (
    <div className="fade-in">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-badge">
          <span>🔥</span> The #1 Recipe Sharing Platform
        </div>
        <h1>
          Discover & Share
          <br />
          <span className="gradient-text">Delicious</span>{" "}
          <span className="script-text">Recipes</span>
        </h1>
        <p>
          Join thousands of food lovers sharing their best recipes. Upload,
          explore, and cook amazing dishes from around the world! 🌍
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
          <button type="submit" className="hero-search-btn">
            🔍
          </button>

          {suggestions?.length > 0 && (
            <div className="search-suggestions">
              {suggestions?.map((s, i) => (
                <button
                  key={i}
                  className="search-suggestion-item"
                  onClick={() => selectSuggestion(s.title)}
                  type="button"
                >
                  <span className="sticker">🍴</span>
                  <div>
                    <strong>{s.title}</strong>
                    {s.category && (
                      <span
                        style={{
                          marginLeft: 8,
                          color: "var(--text-muted)",
                          fontSize: "0.78rem",
                        }}
                      >
                        in {s.category}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </form>

        <div className="hero-stats">
          <div className="hero-stat">
            <div className="hero-stat-value">{total || "0"}+</div>
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
          {categories.map((cat) => (
            <button
              key={cat.name}
              className={`category-chip ${category === (cat.name === "All" ? "" : cat.name) ? "active" : ""}`}
              onClick={() => {
                setCategory(cat.name === "All" ? "" : cat.name);
                setPage(1);
              }}
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
        ) : recipes?.length === 0 ? (
          <div className="empty-state">
            <div className="sticker" style={{ fontSize: "4rem" }}>
              🍽️
            </div>
            <h3>No recipes found</h3>
            <p>Try a different search or be the first to upload!</p>
            <Link to="/upload">
              <button
                className="btn-primary"
                style={{ width: "auto", padding: "12px 30px" }}
              >
                📤 Upload Recipe
              </button>
            </Link>
          </div>
        ) : (
          <>
            <div className="recipes-grid">
              {recipes?.map((recipe) => (
                <div
                  key={recipe.id}
                  className="recipe-card glow-on-hover"
                  onClick={() => navigate(`/recipe/${recipe.id}`)}
                >
                  <div className="recipe-card-img-wrapper">
                    <img
                      src={
                        recipe.thumbnail ||
                        `https://picsum.photos/seed/${recipe.id}/400/300`
                      }
                      alt={recipe.title}
                      className="recipe-card-img"
                    />
                    {recipe.category && (
                      <span className="recipe-card-badge">
                        🏷️ {recipe.category}
                      </span>
                    )}
                    {recipe.cook_time && (
                      <span className="recipe-card-time">
                        ⏱️ {recipe.cook_time}
                      </span>
                    )}
                    {recipe.video_file && (
                      <span
                        className="recipe-card-time"
                        style={{
                          left: 12,
                          right: "auto",
                          bottom: 12,
                          background: "rgba(255,107,53,0.8)",
                        }}
                      >
                        🎥 Video
                      </span>
                    )}
                  </div>
                  <div className="recipe-card-body">
                    <h3 className="recipe-card-title">{recipe.title}</h3>
                    <p className="recipe-card-desc">{recipe.description}</p>
                    <div className="recipe-card-meta">
                      <div className="recipe-card-author">
                        <img
                          src={
                            recipe.author_photo
                              ? recipe.author_photo
                              : `https://ui-avatars.com/api/?name=${encodeURIComponent(recipe.author_name)}&background=6c5ce7&color=fff&size=28`
                          }
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
                <button
                  className="page-btn"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  ← Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (p) => (
                    <button
                      key={p}
                      className={`page-btn ${page === p ? "active" : ""}`}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </button>
                  ),
                )}
                <button
                  className="page-btn"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* YouTube Videos Section */}
      {(search || category) && (
        <section className="section fade-in" style={{ paddingTop: 0 }}>
          <div className="section-header">
            <h2 className="section-title">
              <span className="sticker">📺</span> Top {search || category}{" "}
              YouTube Videos
            </h2>
          </div>

          {/* Video Player */}
          {selectedYtVideo && (
            <div
              id="yt-player-container-home"
              className="recipe-section"
              style={{ marginBottom: "2rem" }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <h2>
                  <span className="sticker">▶️</span> Now Playing
                </h2>
                <button
                  className="btn-icon"
                  onClick={() => setSelectedYtVideo(null)}
                >
                  ✕
                </button>
              </div>
              <iframe
                className="recipe-video-embed"
                src={`https://www.youtube.com/embed/${typeof selectedYtVideo.id === "string" ? selectedYtVideo.id : selectedYtVideo.id?.videoId}?rel=0&origin=${window.location.origin}`}
                title={selectedYtVideo.snippet?.title}
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
              <h3 style={{ marginTop: "1rem", fontSize: "1.1rem" }}>
                {selectedYtVideo.snippet?.title}
              </h3>
              <p
                style={{
                  color: "var(--text-muted)",
                  fontSize: "0.85rem",
                  marginTop: "4px",
                }}
              >
                {selectedYtVideo.snippet?.channelTitle} •{" "}
                {selectedYtVideo.snippet?.description?.slice(0, 150)}...
              </p>
            </div>
          )}

          {ytLoading ? (
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Finding YouTube videos... 📺</p>
            </div>
          ) : youtubeVideos?.length > 0 ? (
            <div className="youtube-grid">
              {youtubeVideos.map((video, index) => (
                <div
                  key={index}
                  className="youtube-card glow-on-hover"
                  onClick={() => {
                    setSelectedYtVideo(video);
                    setTimeout(() => {
                      document
                        .getElementById("yt-player-container-home")
                        ?.scrollIntoView({
                          behavior: "smooth",
                          block: "center",
                        });
                    }, 100);
                  }}
                >
                  <img
                    src={
                      video.snippet?.thumbnails?.high?.url ||
                      video.snippet?.thumbnails?.default?.url ||
                      `https://picsum.photos/seed/${video.id.videoId}/320/180`
                    }
                    alt={video.snippet?.title}
                    style={{ display: "block" }}
                  />
                  <div className="youtube-card-body">
                    <h3 style={{ fontSize: "1rem", marginBottom: "8px" }}>
                      {video.snippet?.title}
                    </h3>
                    <p style={{ fontSize: "0.85rem" }}>
                      📺 {video.snippet?.channelTitle}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No YouTube videos found for this search.</p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
