import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import Dashboard from './pages/Dashboard'
import UploadRecipe from './pages/UploadRecipe'
import EditRecipe from './pages/EditRecipe'
import RecipeDetail from './pages/RecipeDetail'
import MyRecipes from './pages/MyRecipes'
import AdminDashboard from './pages/AdminDashboard'
import YouTubeVideos from './pages/YouTubeVideos'
import './App.css'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>
  return user ? children : <Navigate to="/login" />
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>
  return user?.role === 'admin' ? children : <Navigate to="/" />
}

function App() {
  return (
    <div className="app">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/recipe/:id" element={<RecipeDetail />} />
          <Route path="/videos" element={<YouTubeVideos />} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/upload" element={<PrivateRoute><UploadRecipe /></PrivateRoute>} />
          <Route path="/edit-recipe/:id" element={<PrivateRoute><EditRecipe /></PrivateRoute>} />
          <Route path="/my-recipes" element={<PrivateRoute><MyRecipes /></PrivateRoute>} />
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        </Routes>
      </main>
      <footer className="footer">
        <div className="footer-logo">
          🍳 <span className="gradient-text">RecipeHub</span>
        </div>
        <p>© 2026 RecipeHub. Cook with passion, share with love.</p>
      </footer>
    </div>
  )
}

export default App
