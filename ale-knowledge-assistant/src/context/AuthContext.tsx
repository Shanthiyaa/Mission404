import { createContext, useContext, useState, ReactNode } from 'react'
import { loginUser, registerUser, User } from '../utils/auth'

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
    const saved = localStorage.getItem('ale_current_user')
    return saved ? JSON.parse(saved) : null
  })

  const persist = (u: User) => {
    setUser(u)
    localStorage.setItem('ale_current_user', JSON.stringify(u))
  }

  const login = async (email: string, password: string) => {
    const u = await loginUser(email, password)
    persist(u)
  }

  const signup = async (name: string, email: string, password: string, department: string) => {
    const u = await registerUser({ name, email, department }, password)
    persist(u)
  }

  const loginWithGoogle = async (credential: string) => {
    // For local simulation, we can just throw or mock.
    throw new Error('Google login is not supported in local mode.')
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('ale_current_user')
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