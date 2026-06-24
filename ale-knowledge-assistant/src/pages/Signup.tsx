import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Brain } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Signup() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [department, setDepartment] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { signup } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all required fields.')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    setLoading(true)
    try {
      await signup(name, email, password, department)
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
            <img src="/ale-logo.png" alt="ALE Logo" className="w-12 h-12 rounded-full shadow-sm mx-auto mb-3 object-cover" onError={(e) => { e.currentTarget.src = 'https://ui-avatars.com/api/?name=ALE&background=6b21a8&color=fff' }} />
            <h1 className="text-xl font-medium text-gray-900 dark:text-white">Create your account</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Join ALE Knowledge Assistant</p>
          </div>

          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="text-xs text-red-500 bg-red-50 p-2 rounded">{error}</div>}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Full name</label>
              <input value={name} onChange={e => setName(e.target.value)} required placeholder="Your full name" className="input" title="Full name" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Work email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@ale.com" className="input" title="Work email" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Department</label>
              <input value={department} onChange={e => setDepartment(e.target.value)} required placeholder="e.g. Network Engineering" className="input" title="Department" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" className="input" title="Password" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>


          <p className="text-center text-xs text-gray-500 mt-4">
            Already have an account?{' '}
            <span onClick={() => navigate('/login')} className="text-purple-600 cursor-pointer hover:underline">Sign in</span>
          </p>
        </div>
      </div>
    </div>
  )
}