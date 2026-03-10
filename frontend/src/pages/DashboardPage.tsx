import { useEffect, useState } from "react"
import { listArticles } from "../services/articles"
import { formatDate } from "../utils/formatDate"
import type { Article } from "../types/article"
import { Link } from "react-router-dom"

type Stats = {
  total: number
  drafts: number
  published: number
  archived: number
  featured: number
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [stats, setStats] = useState<Stats | null>(null)
  const [latest, setLatest] = useState<Article[]>([])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      // On récupère 100 max pour stats (simple)
      const data = await listArticles({ page: 1, limit: 100 })
      const items = data.items

      const s: Stats = {
        total: data.total,
        drafts: items.filter((a) => a.status === "draft").length,
        published: items.filter((a) => a.status === "published").length,
        archived: items.filter((a) => a.status === "archived").length,
        featured: items.filter((a) => a.featured).length,
      }

      setStats(s)

      // derniers articles (on trie client par updatedAt)
      const sorted = [...items].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
      setLatest(sorted.slice(0, 6))
    } catch {
      setError("Impossible de charger le dashboard.")
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
        <h1 style={{ margin: 0 }}>Dashboard</h1>
        <div style={{ color: "#64748b" }}>Vue d’ensemble</div>
      </div>

      {error && <div style={errorBox}>{error}</div>}
      {loading && <div style={{ color: "#64748b" }}>Chargement…</div>}

      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
          <StatCard label="Total" value={stats.total} />
          <StatCard label="Drafts" value={stats.drafts} />
          <StatCard label="Published" value={stats.published} />
          <StatCard label="Archived" value={stats.archived} />
          <StatCard label="Featured" value={stats.featured} />
        </div>
      )}

      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <h3 style={{ margin: 0 }}>Dernières publications / modifications</h3>
          <Link to="/articles" style={{ color: "#0f172a" }}>Voir tout</Link>
        </div>

        <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
          {latest.length === 0 ? (
            <div style={{ color: "#64748b" }}>Aucun article.</div>
          ) : (
            latest.map((a) => (
              <div key={a.id} style={row}>
                <div>
                  <div style={{ fontWeight: 700 }}>
                    <Link to={`/articles/${a.id}`} style={{ textDecoration: "none", color: "#0f172a" }}>
                      {a.title}
                    </Link>
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>
                    {a.status} • modifié {formatDate(a.updatedAt)}
                    {a.featured ? " • ⭐" : ""}
                  </div>
                </div>
                <div style={{ fontSize: 12, color: "#64748b" }}>{a.author}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div style={card}>
      <div style={{ color: "#64748b", fontSize: 12 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800 }}>{value}</div>
    </div>
  )
}

const card: React.CSSProperties = { background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: 14 }
const row: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #f1f5f9", borderRadius: 12, padding: 12 }
const errorBox: React.CSSProperties = { background: "#fef2f2", border: "1px solid #fecaca", padding: 12, borderRadius: 12, color: "#991b1b" }