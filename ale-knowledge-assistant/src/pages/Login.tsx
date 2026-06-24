import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Brain, Building2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com' // ← same ID as backend

interface LoginProps { onToggleDark: () => void }

declare global {
  interface Window { google: any }
}

export default function Login({ onToggleDark }: LoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login, loginWithGoogle } = useAuth()

  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.onload = () => {
      window.google?.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response: { credential: string }) => {
          setError('')
          try {
            await loginWithGoogle(response.credential)
            navigate('/dashboard')
          } catch (err: any) {
            setError(err.message)
          }
        },
      })
      window.google?.accounts.id.renderButton(
        document.getElementById('google-btn'),
        { theme: 'outline', size: 'large', width: 320 }
      )
    }
    document.body.appendChild(script)
    return () => { document.body.removeChild(script) }
  }, [loginWithGoogle, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email.trim() || !password.trim()) return

    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-8">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Brain size={22} className="text-white" />
            </div>
            <div className="text-xs text-gray-400 uppercase tracking-widest mb-2">Alcatel-Lucent Enterprise</div>
            <h1 className="text-xl font-medium text-gray-900 dark:text-white">Sign in to ALE Knowledge</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Internal AI-powered document assistant</p>
          </div>

          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Work email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@ale.com"
                className="input"
                title="Work email"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input"
                title="Password"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100 dark:border-gray-800" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white dark:bg-gray-900 px-3 text-xs text-gray-400">or</span>
            </div>
          </div>

          <div id="google-btn" className="flex justify-center mb-3" />

          <button
            type="button"
            className="w-full flex items-center justify-center gap-2 border border-gray-200 dark:border-gray-700 rounded-lg py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <Building2 size={15} />
            Continue with ALE SSO
          </button>

          <p className="text-center text-xs text-gray-500 mt-4">
            Don't have an account?{' '}
            <span onClick={() => navigate('/signup')} className="text-purple-600 cursor-pointer hover:underline">
              Sign up
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}