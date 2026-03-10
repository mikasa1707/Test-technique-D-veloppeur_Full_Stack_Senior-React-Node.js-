import { useState } from "react"
import { importArticles, type ImportResult, type ImportRow } from "../services/import"

const sample: ImportRow[] = [
  {
    title: "Article importé",
    content: "Contenu de l'article... ".repeat(10),
    excerpt: "Résumé",
    author: "Import",
    category: "tech",
    network: "Public",
  },
]

export default function ImportPage() {
  const [text, setText] = useState(JSON.stringify(sample, null, 2))
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function onImport() {
    setError(null)
    setResult(null)
    setLoading(true)
    try {
      const json = JSON.parse(text) as ImportRow[]
      const res = await importArticles(json)
      setResult(res)
    } catch {
      setError("JSON invalide ou import impossible.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div>
        <h1 style={{ margin: 0 }}>Import JSON</h1>
        <div style={{ color: "#64748b" }}>Colle un tableau d’articles (simulation CMS)</div>
      </div>

      {error && <div style={errorBox}>{error}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={card}>
          <h3 style={{ marginTop: 0 }}>JSON</h3>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{ ...input, minHeight: 360, fontFamily: "monospace" }}
          />
          <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
            <button style={btnPrimary} onClick={onImport} disabled={loading}>
              {loading ? "Import..." : "Importer"}
            </button>
          </div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 10 }}>
            Champs attendus : title, content, excerpt, author, category (nom), network (nom)
          </div>
        </div>

        <div style={card}>
          <h3 style={{ marginTop: 0 }}>Résultat</h3>
          {!result ? (
            <div style={{ color: "#64748b" }}>Lance un import pour voir le résultat.</div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              <div><b>Créés :</b> {result.createdCount}</div>

              {result.errors?.length ? (
                <div>
                  <b>Erreurs :</b>
                  <ul>
                    {result.errors.map((e) => (
                      <li key={e.index}>#{e.index} — {e.message}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div style={{ color: "#16a34a" }}>Aucune erreur ✅</div>
              )}

              {result.createdIds?.length ? (
                <div style={{ fontSize: 12, color: "#64748b" }}>
                  IDs : {result.createdIds.slice(0, 6).join(", ")}{result.createdIds.length > 6 ? "…" : ""}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const card: React.CSSProperties = { background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: 14 }
const input: React.CSSProperties = { width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #e2e8f0", outline: "none" }
const btnPrimary: React.CSSProperties = { background: "#0f172a", color: "white", padding: "10px 14px", borderRadius: 10, border: "1px solid #0f172a", cursor: "pointer", fontWeight: 700 }
const errorBox: React.CSSProperties = { background: "#fef2f2", border: "1px solid #fecaca", padding: 12, borderRadius: 12, color: "#991b1b" }