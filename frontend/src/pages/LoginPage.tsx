import { useState, type FormEvent } from "react"
import { useAuth } from "../hooks/useAuth"
import { useNavigate } from "react-router-dom"
import "../styles/LoginPage.css"

function UserIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 12a4.5 4.5 0 1 0-4.5-4.5A4.5 4.5 0 0 0 12 12Zm0 2c-4.2 0-8 2.1-8 5v1h16v-1c0-2.9-3.8-5-8-5Z"
        stroke="rgba(255,255,255,0.9)"
        strokeWidth="1.6"
      />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 6h16v12H4V6Zm0 0 8 7 8-7"
        stroke="rgba(15,23,42,0.75)"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M7 11V8a5 5 0 0 1 10 0v3"
        stroke="rgba(15,23,42,0.75)"
        strokeWidth="1.6"
      />
      <path
        d="M6 11h12v10H6V11Z"
        stroke="rgba(15,23,42,0.75)"
        strokeWidth="1.6"
      />
    </svg>
  )
}

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState("admin@demo.com")
  const [password, setPassword] = useState("admin123")
  const [remember, setRemember] = useState(true)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await login(email, password)

      // "Remember me" simple: si décoché => on enlève au refresh
      if (!remember) {
        window.addEventListener("beforeunload", () => {
          localStorage.removeItem("token")
          localStorage.removeItem("user")
        })
      }

      navigate("/")
    } catch {
      setError("Identifiants incorrects ou serveur indisponible.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-avatar">
          <UserIcon />
        </div>

        <h2 className="login-title">LOGIN</h2>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <div className="input-icon">
              <MailIcon />
            </div>
            <input
              className="login-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              autoComplete="username"
            />
          </div>

          <div className="input-group">
            <div className="input-icon">
              <LockIcon />
            </div>
            <input
              className="login-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete="current-password"
            />
          </div>

          <div className="login-row">
            <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              Se souvenir de moi
            </label>

            <a href="#" onClick={(e) => e.preventDefault()}>
              Forgot Password?
            </a>
          </div>

          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? "LOGIN..." : "LOGIN"}
          </button>

          <div style={{ marginTop: 12, fontSize: 12, color: "rgba(255,255,255,0.8)" }}>
            Demo : admin@demo.com / admin123 • editor@demo.com / editor123
          </div>
        </form>
      </div>
    </div>
  )
}