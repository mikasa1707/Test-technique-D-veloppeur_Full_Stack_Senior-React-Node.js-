import { useState } from "react"
import type { ReactNode } from "react"
import { api } from "../services/api"
import { AuthContext, type User } from "./auth-context"

type LoginResponse = { token: string; user: User }

function readStoredUser(): User | null {
  const raw = localStorage.getItem("user")
  if (!raw) return null
  try {
    return JSON.parse(raw) as User
  } catch {
    localStorage.removeItem("user")
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => readStoredUser())

  const login = async (email: string, password: string) => {
    const { data } = await api.post<LoginResponse>("/api/auth/login", { email, password })
    localStorage.setItem("token", data.token)
    localStorage.setItem("user", JSON.stringify(data.user))
    setUser(data.user)
  }

  const logout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setUser(null)
    window.location.href = "/login"
  }

  

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}