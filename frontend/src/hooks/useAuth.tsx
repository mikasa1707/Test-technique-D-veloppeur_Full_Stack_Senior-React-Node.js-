import { useContext } from "react"
import { AuthContext, type AuthContextType } from "./auth-context"

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("Erreur de contexte")
  return ctx
}
