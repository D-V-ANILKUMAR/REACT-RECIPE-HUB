import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import API, { BASE_URL } from '../api'

export default function MyRecipes() {
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetchMyRecipes()
  }, [])

  const fetchMyRecipes = async () => {
    try {
      const res = await API.get('/my-recipes')
      setRecipes(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await API.delete(`/recipes/${id}`)
      setRecipes(recipes.filter(r => r.id !== id))
      setDeleteId(null)
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) return <div className="loading-spinner"><div className="spinner"></div><p>Loading your recipes... 🍳</p></div>

  return (
    <div className="my-recipes-page fade-in">
      <div className="section-header">
        <h1 className="section-title">
          <span className="sticker sticker-bounce">📋</span> My Recipes
        </h1>
        <Link to="/upload">
          <button className="nav-btn-primary">
            <span>📤</span> Upload New
          </button>
        </Link>
      </div>

      {recipes.length === 0 ? (
        <div className="empty-state">
          <div className="sticker" style={{ fontSize: '4rem' }}>🍽️</div>
          <h3>No recipes yet!</h3>
          <p>Share your first recipe with the community</p>
          <Link to="/upload">
            <button className="btn-primary" style={{ width: 'auto', padding: '12px 30px' }}>
              📤 Upload Recipe
            </button>
          </Link>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="recipes-table">
            <thead>
              <tr>
                <th>Thumbnail</th>
                <th>Title</th>
                <th>Category</th>
                <th>Views</th>
                <th>Likes</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recipes.map(recipe => (
                <tr key={recipe.id}>
                  <td>
                    <img
                      src={recipe.thumbnail ? `${BASE_URL}${recipe.thumbnail}` : `https://picsum.photos/seed/${recipe.id}/60/45`}
                      alt={recipe.title}
                      className="table-thumb"
                    />
                  </td>
                  <td>
                    <Link to={`/recipe/${recipe.id}`} style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                      {recipe.title}
                    </Link>
                  </td>
                  <td>{recipe.category || '—'}</td>
                  <td>👁️ {recipe.views || 0}</td>
                  <td>❤️ {recipe.likes || 0}</td>
                  <td>{new Date(recipe.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="table-actions">
                      <button className="btn-icon" title="View" onClick={() => navigate(`/recipe/${recipe.id}`)}>👁️</button>
                      <button className="btn-icon" title="Edit" onClick={() => navigate(`/edit-recipe/${recipe.id}`)}>✏️</button>
                      <button className="btn-icon" title="Delete" onClick={() => setDeleteId(recipe.id)} style={{ borderColor: 'rgba(255,107,107,0.3)', color: '#ff6b6b' }}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🗑️</div>
            <h2>Delete Recipe?</h2>
            <p>This action cannot be undone. The recipe will be permanently removed.</p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn-danger" onClick={() => handleDelete(deleteId)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
