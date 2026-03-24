import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import API from '../api'
import { Bar, Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend)

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await API.get('/dashboard/stats')
        setStats(res.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (loading) return <div className="loading-spinner"><div className="spinner"></div><p>Loading dashboard... 📊</p></div>

  const barData = {
    labels: stats?.monthlyUploads?.map(m => m.month) || [],
    datasets: [{
      label: 'Uploads',
      data: stats?.monthlyUploads?.map(m => parseInt(m.count)) || [],
      backgroundColor: 'rgba(255, 107, 53, 0.7)',
      borderColor: '#ff6b35',
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
      legend: {
        labels: { color: '#a0a0b8', font: { family: 'Outfit' } }
      }
    },
    scales: {
      x: { ticks: { color: '#a0a0b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
      y: { ticks: { color: '#a0a0b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
    }
  }

  return (
    <div className="dashboard-page fade-in">
      <div className="dashboard-header">
        <h1><span className="sticker sticker-bounce">📊</span> Dashboard</h1>
        <p>Welcome back, {user?.name}! Here's your recipe analytics 🍳</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
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
        <div className="stat-card">
          <div className="sticker">📈</div>
          <h3>{stats?.totalRecipes ? Math.round(stats.totalViews / stats.totalRecipes) : 0}</h3>
          <p>Avg Views/Recipe</p>
        </div>
      </div>

      {/* Charts */}
      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3><span className="sticker">📊</span> Monthly Uploads</h3>
          <div className="chart-container">
            {stats?.monthlyUploads?.length > 0 ? (
              <Bar data={barData} options={chartOptions} />
            ) : (
              <div className="empty-state" style={{ padding: '2rem' }}>
                <p>No upload data yet. Start uploading! 🚀</p>
              </div>
            )}
          </div>
        </div>

        <div className="dashboard-card">
          <h3><span className="sticker">🏷️</span> Category Distribution</h3>
          <div className="chart-container">
            {stats?.categoryDistribution?.length > 0 ? (
              <Doughnut data={doughnutData} options={{ ...chartOptions, scales: undefined }} />
            ) : (
              <div className="empty-state" style={{ padding: '2rem' }}>
                <p>No categories yet. Add categories to your recipes! 🏷️</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Recipes */}
        <div className="dashboard-card full-width">
          <h3><span className="sticker">🕐</span> Recent Recipes</h3>
          {stats?.recentRecipes?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {stats.recentRecipes.map(recipe => (
                <div key={recipe.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px', borderRadius: '8px', border: '1px solid var(--border)',
                  background: 'rgba(255,255,255,0.02)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img
                      src={recipe.thumbnail ? `http://localhost:5000${recipe.thumbnail}` : `https://picsum.photos/seed/${recipe.id}/50/40`}
                      alt={recipe.title}
                      style={{ width: 50, height: 40, borderRadius: 6, objectFit: 'cover' }}
                    />
                    <div>
                      <h4 style={{ fontSize: '0.9rem' }}>{recipe.title}</h4>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {recipe.category || 'Uncategorized'} • {new Date(recipe.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    <span>👁️ {recipe.views}</span>
                    <span>❤️ {recipe.likes}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <p>No recipes to show yet. Upload your first recipe! 📤</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
