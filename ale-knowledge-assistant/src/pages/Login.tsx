import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Brain, Building2 } from 'lucide-react'

interface LoginProps { onLogin: () => void; onToggleDark: () => void }

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent) => {
    if (!email.trim() || !password.trim()) return
    onLogin()
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

          <form onSubmit={handleSubmit} className="space-y-4">
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

          <button className="w-full flex items-center justify-center gap-2 border border-gray-200 dark:border-gray-700 rounded-lg py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <Building2 size={15} />
            Continue with ALE SSO
          </button>

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
