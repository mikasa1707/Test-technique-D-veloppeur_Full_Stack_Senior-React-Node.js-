import { useEffect, useState } from "react"
import { listNotifications, type Notification } from "../services/notifications"
import { formatDate } from "../utils/formatDate"

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await listNotifications()
      setItems(data)
    } catch {
      setError("Le module notifications n’est pas encore activé côté backend.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div>
        <h1 style={{ margin: 0 }}>Notifications</h1>
        <div style={{ color: "#64748b" }}>Historique des emails envoyés</div>
      </div>

      {error && <div style={warnBox}>{error}</div>}

      <div style={card}>
        {loading ? (
          <div style={{ color: "#64748b" }}>Chargement…</div>
        ) : items.length === 0 ? (
          <div style={{ color: "#64748b" }}>Aucune notification pour le moment.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #e2e8f0" }}>
                <th style={th}>Date</th>
                <th style={th}>Article</th>
                <th style={th}>To</th>
                <th style={th}>Sujet</th>
                <th style={th}>Statut</th>
              </tr>
            </thead>
            <tbody>
              {items.map((n) => (
                <tr key={n.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={td}>{formatDate(n.createdAt)}</td>
                  <td style={td}>{n.articleId}</td>
                  <td style={td}>{n.to}</td>
                  <td style={td}>{n.subject}</td>
                  <td style={td}>
                    <span style={{ ...pill, borderColor: n.status === "sent" ? "#bbf7d0" : "#fecaca", background: n.status === "sent" ? "#ecfdf5" : "#fef2f2" }}>
                      {n.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

const card: React.CSSProperties = { background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: 14 }
const th: React.CSSProperties = { padding: 12, fontSize: 12, color: "#475569" }
const td: React.CSSProperties = { padding: 12, verticalAlign: "top" }
const warnBox: React.CSSProperties = { background: "#fff7ed", border: "1px solid #fed7aa", padding: 12, borderRadius: 12, color: "#9a3412" }
const pill: React.CSSProperties = { padding: "4px 10px", borderRadius: 999, border: "1px solid #e2e8f0", fontSize: 12 }