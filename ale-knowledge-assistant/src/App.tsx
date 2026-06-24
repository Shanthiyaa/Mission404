import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Chat from './pages/Chat'
import Upload from './pages/Upload'
import KnowledgeBase from './pages/KnowledgeBase'
import Settings from './pages/Settings'

function Shell() {
  const [dark, setDark] = useState(false)
  const { user, logout } = useAuth()

  const toggleDark = () => {
    setDark(d => !d)
    document.documentElement.classList.toggle('dark')
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login onToggleDark={toggleDark} />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <Layout onLogout={logout} dark={dark} onToggleDark={toggleDark}>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/knowledge-base" element={<KnowledgeBase />} />
        <Route path="/settings" element={<Settings dark={dark} onToggleDark={toggleDark} />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Shell />
      </AuthProvider>
    </BrowserRouter>
  )
}