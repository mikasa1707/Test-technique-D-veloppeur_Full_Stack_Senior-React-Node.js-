import { useEffect, useState } from "react"
import type { Network } from "../services/networks"
import { listNetworks } from "../services/networks"

export default function NetworksPage() {
  const [items, setItems] = useState<Network[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await listNetworks()
      setItems(data)
    } catch {
      setError("Impossible de charger les réseaux.")
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
        <h1 style={{ margin: 0 }}>Réseaux</h1>
        <div style={{ color: "#64748b" }}>Liste des réseaux disponibles</div>
      </div>

      {error && <div style={errorBox}>{error}</div>}

      <div style={card}>
        {loading ? (
          <div style={{ color: "#64748b" }}>Chargement…</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {items.map((n) => (
              <div key={n.id} style={row}>
                <div>
                  <div style={{ fontWeight: 700 }}>{n.name}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{n.description}</div>
                </div>
                <div style={{ fontSize: 12, color: "#64748b" }}>{n.id}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ fontSize: 12, color: "#64748b" }}>
        Astuce : la gestion “réseaux par utilisateur” se fait côté Users (admin) via `networkIds`.
      </div>
    </div>
  )
}

const card: React.CSSProperties = { background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: 14 }
const row: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #f1f5f9", borderRadius: 12, padding: 12 }
const errorBox: React.CSSProperties = { background: "#fef2f2", border: "1px solid #fecaca", padding: 12, borderRadius: 12, color: "#991b1b" }