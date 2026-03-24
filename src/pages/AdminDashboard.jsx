import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import API, { BASE_URL } from '../api'
import { Bar, Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend)

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteModal, setDeleteModal] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [statsRes, usersRes, recipesRes] = await Promise.all([
        API.get('/admin/stats'),
        API.get('/admin/users'),
        API.get('/admin/recipes')
      ])
      setStats(statsRes.data)
      setUsers(usersRes.data)
      setRecipes(recipesRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (id) => {
    try {
      await API.delete(`/admin/users/${id}`)
      setUsers(users.filter(u => u.id !== id))
      setDeleteModal(null)
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteRecipe = async (id) => {
    try {
      await API.delete(`/admin/recipes/${id}`)
      setRecipes(recipes.filter(r => r.id !== id))
      setDeleteModal(null)
    } catch (err) {
      console.error(err)
    }
  }

  const handleRoleChange = async (id, role) => {
    try {
      await API.put(`/admin/users/${id}/role`, { role })
      setUsers(users.map(u => u.id === id ? { ...u, role } : u))
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) return <div className="loading-spinner"><div className="spinner"></div><p>Loading admin panel... 👑</p></div>

  const barData = {
    labels: stats?.monthlyUploads?.map(m => m.month) || [],
    datasets: [{
      label: 'Uploads',
      data: stats?.monthlyUploads?.map(m => parseInt(m.count)) || [],
      backgroundColor: 'rgba(108, 92, 231, 0.7)',
      borderColor: '#6c5ce7',
      borderWidth: 2,
      borderRadius: 8,
    }]
  }

  const doughnutData = {
    labels: stats?.categoryDistribution?.map(c => c.category) || [],
    datasets: [{
      data: stats?.categoryDistribution?.map(c => parseInt(c.count)) || [],
      backgroundColor: ['#ff6b35', '#f7c948', '#e84393', '#00b894', '#0984e3', '#6c5ce7', '#fd79a8'],
      borderWidth: 0,
    }]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#a0a0b8', font: { family: 'Outfit' } } }
    },
    scales: {
      x: { ticks: { color: '#a0a0b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
      y: { ticks: { color: '#a0a0b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
    }
  }

  return (
    <div className="dashboard-page fade-in">
      <div className="dashboard-header">
        <h1><span className="sticker sticker-bounce">👑</span> Admin Panel</h1>
        <p>Manage your RecipeHub platform</p>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        <button className={`admin-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
          📊 Overview
        </button>
        <button className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
          👥 Users ({users.length})
        </button>
        <button className={`admin-tab ${activeTab === 'recipes' ? 'active' : ''}`} onClick={() => setActiveTab('recipes')}>
          🍳 Recipes ({recipes.length})
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="sticker">👥</div>
              <h3>{stats?.totalUsers || 0}</h3>
              <p>Total Users</p>
            </div>
            <div className="stat-card">
              <div className="sticker">📝</div>
              <h3>{stats?.totalRecipes || 0}</h3>
              <p>Total Recipes</p>
            </div>
            <div className="stat-card">
              <div className="sticker">👁️</div>
              <h3>{stats?.totalViews || 0}</h3>
              <p>Total Views</p>
            </div>
            <div className="stat-card">
              <div className="sticker">❤️</div>
              <h3>{stats?.totalLikes || 0}</h3>
              <p>Total Likes</p>
            </div>
          </div>

          <div className="dashboard-grid">
            <div className="dashboard-card">
              <h3><span className="sticker">📊</span> Monthly Uploads</h3>
              <div className="chart-container">
                {stats?.monthlyUploads?.length > 0 ? (
                  <Bar data={barData} options={chartOptions} />
                ) : (
                  <div className="empty-state" style={{ padding: '2rem' }}><p>No data yet</p></div>
                )}
              </div>
            </div>

            <div className="dashboard-card">
              <h3><span className="sticker">🏷️</span> Categories</h3>
              <div className="chart-container">
                {stats?.categoryDistribution?.length > 0 ? (
                  <Doughnut data={doughnutData} options={{ ...chartOptions, scales: undefined }} />
                ) : (
                  <div className="empty-state" style={{ padding: '2rem' }}><p>No categories yet</p></div>
                )}
              </div>
            </div>

            {/* Top Recipes */}
            <div className="dashboard-card">
              <h3><span className="sticker">🏆</span> Top Recipes</h3>
              {stats?.topRecipes?.slice(0, 5)?.map(recipe => (
                <div key={recipe.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 0', borderBottom: '1px solid var(--border)'
                }}>
                  <div>
                    <h4 style={{ fontSize: '0.88rem', cursor: 'pointer' }} onClick={() => navigate(`/recipe/${recipe.id}`)}>
                      {recipe.title}
                    </h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>by {recipe.author_name}</p>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>👁️ {recipe.views}</span>
                </div>
              ))}
            </div>

            {/* Recent Users */}
            <div className="dashboard-card">
              <h3><span className="sticker">🆕</span> Recent Users</h3>
              {stats?.recentUsers?.slice(0, 5)?.map(user => (
                <div key={user.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 0', borderBottom: '1px solid var(--border)'
                }}>
                  <div>
                    <h4 style={{ fontSize: '0.88rem' }}>{user.name}</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.email}</p>
                  </div>
                  <span className="nav-role-badge" style={{ fontSize: '0.65rem' }}>{user.role}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="users-list">
          {users.map(u => (
            <div key={u.id} className="admin-user-card">
              <div className="admin-user-info">
                {u.profile_photo ? (
                  <img src={`${BASE_URL}${u.profile_photo}`} alt={u.name} className="admin-user-avatar" />
                ) : (
                  <div className="admin-user-avatar-placeholder">
                    {u.name?.charAt(0)?.toUpperCase()}
                  </div>
                )}
                <div className="admin-user-details">
                  <h4>{u.name} {u.role === 'admin' && '👑'}</h4>
                  <p>{u.email} • {u.mobile || 'No phone'} • {u.gender || 'N/A'} • {u.age ? `${u.age} yrs` : 'N/A'}</p>
                  <p style={{ fontSize: '0.72rem' }}>Joined {new Date(u.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="admin-user-actions">
                <select
                  value={u.role}
                  onChange={(e) => handleRoleChange(u.id, e.target.value)}
                  className="form-select"
                  style={{ width: 'auto', padding: '6px 12px', fontSize: '0.8rem' }}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
                {u.role !== 'admin' && (
                  <button
                    className="btn-danger btn-sm"
                    onClick={() => setDeleteModal({ type: 'user', id: u.id, name: u.name })}
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recipes Tab */}
      {activeTab === 'recipes' && (
        <div style={{ overflowX: 'auto' }}>
          <table className="recipes-table">
            <thead>
              <tr>
                <th>Thumbnail</th>
                <th>Title</th>
                <th>Author</th>
                <th>Category</th>
                <th>Views</th>
                <th>Likes</th>
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
                  <td style={{ fontWeight: 600, cursor: 'pointer' }} onClick={() => navigate(`/recipe/${recipe.id}`)}>
                    {recipe.title}
                  </td>
                  <td>{recipe.author_name}</td>
                  <td>{recipe.category || '—'}</td>
                  <td>👁️ {recipe.views || 0}</td>
                  <td>❤️ {recipe.likes || 0}</td>
                  <td>
                    <div className="table-actions">
                      <button className="btn-icon" onClick={() => navigate(`/recipe/${recipe.id}`)}>👁️</button>
                      <button className="btn-icon" onClick={() => navigate(`/edit-recipe/${recipe.id}`)}>✏️</button>
                      <button
                        className="btn-icon"
                        style={{ borderColor: 'rgba(255,107,107,0.3)', color: '#ff6b6b' }}
                        onClick={() => setDeleteModal({ type: 'recipe', id: recipe.id, name: recipe.title })}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="modal-overlay" onClick={() => setDeleteModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
            <h2>Delete {deleteModal.type === 'user' ? 'User' : 'Recipe'}?</h2>
            <p>Are you sure you want to delete <strong>{deleteModal.name}</strong>? This cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setDeleteModal(null)}>Cancel</button>
              <button className="btn-danger" onClick={() => {
                if (deleteModal.type === 'user') handleDeleteUser(deleteModal.id)
                else handleDeleteRecipe(deleteModal.id)
              }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
