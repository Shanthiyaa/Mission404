import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Brain, Building2 } from 'lucide-react'
import { loginUser, User } from '../utils/auth'

interface LoginProps { onLogin: (user: User) => void; onToggleDark: () => void }

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) return
    setError('')
    try {
      const user = await loginUser(email, password)
      onLogin(user)
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-8">
          <div className="text-center mb-6">
            <img src="/ale-logo.png" alt="ALE Logo" className="w-12 h-12 rounded-full shadow-sm mx-auto mb-3 object-cover" onError={(e) => { e.currentTarget.src = 'https://ui-avatars.com/api/?name=ALE&background=6b21a8&color=fff' }} />
            <div className="text-xs text-gray-400 uppercase tracking-widest mb-2">Alcatel-Lucent Enterprise</div>
            <h1 className="text-xl font-medium text-gray-900 dark:text-white">Sign in to ALE Knowledge</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Internal AI-powered document assistant</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="text-xs text-red-500 bg-red-50 p-2 rounded">{error}</div>}
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Work email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@ale.com"
                className="input"
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
              />
            </div>
            <button type="submit" className="btn-primary w-full mt-2">Sign in</button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100 dark:border-gray-800" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white dark:bg-gray-900 px-3 text-xs text-gray-400">or</span>
            </div>
          </div>

          <div className="space-y-2.5">
            <button className="w-full flex items-center justify-center gap-2 border border-gray-200 dark:border-gray-700 rounded-lg py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <Building2 size={15} />
              Continue with ALE SSO
            </button>
            <button type="button" className="w-full flex items-center justify-center gap-2 border border-gray-200 dark:border-gray-700 rounded-lg py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
          </div>

          <p className="text-center text-xs text-gray-500 mt-4">
            Don't have an account?{' '}
            <span
              onClick={() => navigate('/signup')}
              className="text-purple-600 cursor-pointer hover:underline"
            >
              Sign up
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}
