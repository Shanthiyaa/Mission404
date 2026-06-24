import { createContext, useContext, useState, ReactNode } from 'react'

interface User {
  name: string
  email: string
  department: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string, department: string) => Promise<void>
  loginWithGoogle: (credential: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('ale_user')
    return saved ? JSON.parse(saved) : null
  })

  const persist = (u: User) => {
    setUser(u)
    localStorage.setItem('ale_user', JSON.stringify(u))
  }

  const handleResponse = async (res: Response) => {
    const data = await res.json()
    if (!res.ok) throw new Error(data.detail || 'Something went wrong.')
    return data
  }

  const login = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await handleResponse(res)
    persist(data.user)
  }

  const signup = async (name: string, email: string, password: string, department: string) => {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, department }),
    })
    const data = await handleResponse(res)
    persist(data.user)
  }

  const loginWithGoogle = async (credential: string) => {
    const res = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential }),
    })
    const data = await handleResponse(res)
    persist(data.user)
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('ale_user')
  }

  return (
    <AuthContext.Provider value={{ user, login, signup, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}