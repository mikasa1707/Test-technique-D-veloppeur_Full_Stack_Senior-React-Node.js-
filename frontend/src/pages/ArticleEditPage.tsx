import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import type { Article, ArticleStatus } from "../types/article";
import type { Category } from "../types/category";
import type { Network } from "../services/networks";

import { createArticle, getArticle, updateArticle } from "../services/articles";
import { listCategories } from "../services/categories";
import { listNetworks } from "../services/networks";
import axios from "axios";

/* --------------------------------
   Helpers
--------------------------------- */
function clampExcerpt(content: string) {
  const s = content.trim().replace(/\s+/g, " ");
  return s.length <= 140 ? s : s.slice(0, 140) + "…";
}

type ApiError = { message?: string };

type FormState = {
  title: string;
  content: string;
  excerpt: string;
  author: string;
  categories: string[];
  network: string;
  status: ArticleStatus;
  featured: boolean;
};

const emptyForm: FormState = {
  title: "",
  content: "",
  excerpt: "",
  author: "",
  categories: [],
  network: "",
  status: "draft",
  featured: false,
};

export default function ArticleEditPage() {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const nav = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [cats, setCats] = useState<Category[]>([]);
  const [nets, setNets] = useState<Network[]>([]);

  const [form, setForm] = useState<FormState>(emptyForm);
  const [dirty, setDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  // pour autosave : on garde une ref du dernier état “propre”
  const lastSavedSnapshot = useRef<string>("");

  const categoryMap = useMemo(() => {
    const m = new Map<string, Category>();
    cats.forEach((c) => m.set(c.id, c));
    return m;
  }, [cats]);

  const networkMap = useMemo(() => {
    const m = new Map<string, Network>();
    nets.forEach((n) => m.set(n.id, n));
    return m;
  }, [nets]);

  function markDirty(next: FormState) {
    setForm(next);
    const snap = JSON.stringify(next);
    setDirty(snap !== lastSavedSnapshot.current);
  }

  async function loadMeta() {
    const [c, n] = await Promise.all([listCategories(), listNetworks()]);
    setCats(c);
    setNets(n);
    return { c, n };
  }

  async function loadArticle(articleId: string) {
    const a = await getArticle(articleId);

    const next: FormState = {
      title: a.title || "",
      content: a.content || "",
      excerpt: a.excerpt || "",
      author: a.author || "",
      categories: a.categories || [],
      network: a.network || "",
      status: a.status || "draft",
      featured: !!a.featured,
    };

    setForm(next);
    lastSavedSnapshot.current = JSON.stringify(next);
    setDirty(false);
    setLastSavedAt(a.updatedAt || null);
  }

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { n } = await loadMeta();

        // valeurs par défaut en création
        if (isNew && mounted) {
          const userRaw = localStorage.getItem("user");
          const user = userRaw ? JSON.parse(userRaw) : null;

          const defaultNetwork = user?.networkIds?.[0] || n?.[0]?.id || "";
          const next = {
            ...emptyForm,
            author: user?.name || "",
            network: defaultNetwork,
          };
          setForm(next);
          lastSavedSnapshot.current = JSON.stringify(next);
          setDirty(false);
        }

        if (!isNew && id && mounted) {
          await loadArticle(id);
        }
      } catch (e: unknown) {
        setError(getErrorMessage(e, "Impossible de charger l’article."));
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [id, isNew]);

  /* --------------------------------
     Autosave draft toutes les 30s
     - seulement si dirty
     - seulement si on a déjà un id (donc article créé)
  --------------------------------- */
  useEffect(() => {
    const timer = setInterval(() => {
      void (async () => {
        if (!dirty) return;
        if (isNew) return;
        if (!id) return;
        if (form.status !== "draft") return;

        const payload: Partial<Article> = {
          ...form,
          excerpt: form.excerpt?.trim()
            ? form.excerpt
            : clampExcerpt(form.content),
        };

        try {
          await updateArticle(id, payload);
          lastSavedSnapshot.current = JSON.stringify(form);
          setDirty(false);
          setLastSavedAt(new Date().toISOString());
        } catch {
          // ignore
        }
      })();
    }, 30000);

    return () => clearInterval(timer);
  }, [dirty, form, id, isNew]);

  function toggleCategory(cid: string) {
    const next = {
      ...form,
      categories: form.categories.includes(cid)
        ? form.categories.filter((x) => x !== cid)
        : [...form.categories, cid],
    };
    markDirty(next);
  }

  function onChange<K extends keyof FormState>(key: K, value: FormState[K]) {
    markDirty({ ...form, [key]: value });
  }

  async function onSave() {
    setError(null);
    setSaving(true);
    try {
      const payload: Partial<Article> = {
        ...form,
        excerpt: form.excerpt?.trim()
          ? form.excerpt
          : clampExcerpt(form.content),
      };

      if (isNew) {
        const created = await createArticle(payload);
        // après création : on navigue vers la page edit
        lastSavedSnapshot.current = JSON.stringify({
          ...form,
          excerpt: payload.excerpt || "",
        });
        setDirty(false);
        setLastSavedAt(created.updatedAt || new Date().toISOString());
        nav(`/articles/${created.id}`, { replace: true });
      } else {
        await updateArticle(id!, payload);
        lastSavedSnapshot.current = JSON.stringify(form);
        setDirty(false);
        setLastSavedAt(new Date().toISOString());
      }
    } catch (e: unknown) {
      setError(getErrorMessage(e, "Sauvegarde impossible."));
    } finally {
      setSaving(false);
    }
  }

  function getErrorMessage(err: unknown, fallback: string): string {
    if (axios.isAxiosError(err)) {
      return (err.response?.data as ApiError | undefined)?.message ?? fallback;
    }
    if (err instanceof Error) return err.message || fallback;
    return fallback;
  }

  async function setStatus(status: ArticleStatus) {
    setError(null);
    setSaving(true);

    try {
      const payload: Partial<Article> = {
        ...form,
        status,
        excerpt: form.excerpt?.trim()
          ? form.excerpt
          : clampExcerpt(form.content),
      };

      if (isNew) {
        const created = await createArticle(payload);
        // optionnel: mettre à jour l'état local pour rester cohérent
        setForm((prev) => ({
          ...prev,
          status,
          excerpt: payload.excerpt ?? "",
        }));
        setDirty(false);
        setLastSavedAt(created.updatedAt ?? new Date().toISOString());
        nav(`/articles/${created.id}`, { replace: true });
        return;
      }

      await updateArticle(id!, payload);

      const next = { ...form, status };
      setForm(next);
      lastSavedSnapshot.current = JSON.stringify(next);
      setDirty(false);
      setLastSavedAt(new Date().toISOString());
    } catch (e: unknown) {
      setError(getErrorMessage(e, "Action impossible."));
    } finally {
      setSaving(false);
    }
  }

  const preview = useMemo(() => {
    const netName = networkMap.get(form.network)?.name || "-";
    const catNames = form.categories
      .map((cid) => categoryMap.get(cid)?.name || cid)
      .join(", ");

    return {
      title: form.title || "Titre de l’article",
      excerpt: form.excerpt?.trim() ? form.excerpt : clampExcerpt(form.content),
      content: form.content || "Contenu de l’article…",
      meta: `${form.author || "Auteur"} • ${netName} • ${catNames || "Sans catégorie"}`,
      status: form.status,
      featured: form.featured,
    };
  }, [form, categoryMap, networkMap]);

  if (loading) return <div style={{ color: "#64748b" }}>Chargement…</div>;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
        }}
      >
        <div>
          <h1 style={{ margin: 0 }}>
            {isNew ? "Nouvel article" : "Éditer l’article"}
          </h1>
          <div style={{ color: "#64748b" }}>
            {dirty
              ? "● Modifications non sauvegardées"
              : "✓ Tout est sauvegardé"}
            {lastSavedAt
              ? ` • Dernière sauvegarde : ${new Date(lastSavedAt).toLocaleString()}`
              : ""}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Link to="/articles" style={btn}>
            ← Retour
          </Link>

          <button onClick={onSave} disabled={saving} style={btnPrimary}>
            {saving ? "Sauvegarde..." : "Sauvegarder"}
          </button>

          <button
            onClick={() => setStatus("published")}
            disabled={saving}
            style={btn}
          >
            Publier
          </button>
          <button
            onClick={() => setStatus("archived")}
            disabled={saving}
            style={btn}
          >
            Archiver
          </button>
        </div>
      </div>

      {error && <div style={errorBox}>{error}</div>}

      {/* split view */}
      <div
        style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 16 }}
      >
        {/* form */}
        <div style={card}>
          <div style={{ display: "grid", gap: 12 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <div>
                <label style={label}>Titre *</label>
                <input
                  style={input}
                  value={form.title}
                  onChange={(e) => onChange("title", e.target.value)}
                  placeholder="Ex: Comment booster ses perf Node.js"
                />
              </div>

              <div>
                <label style={label}>Auteur *</label>
                <input
                  style={input}
                  value={form.author}
                  onChange={(e) => onChange("author", e.target.value)}
                  placeholder="Ex: Mika"
                />
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 12,
              }}
            >
              <div>
                <label style={label}>Réseau *</label>
                <select
                  style={input}
                  value={form.network}
                  onChange={(e) => onChange("network", e.target.value)}
                >
                  <option value="">Choisir…</option>
                  {nets.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={label}>Statut</label>
                <select
                  style={input}
                  value={form.status}
                  onChange={(e) =>
                    onChange("status", e.target.value as ArticleStatus)
                  }
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div style={{ display: "grid", alignContent: "end" }}>
                <label
                  style={{
                    ...label,
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) => onChange("featured", e.target.checked)}
                  />
                  Mis en avant
                </label>
              </div>
            </div>

            <div>
              <label style={label}>Catégories *</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {cats.map((c) => {
                  const active = form.categories.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleCategory(c.id)}
                      style={{
                        ...chip,
                        borderColor: active ? c.color : "#e2e8f0",
                        background: active ? "#f8fafc" : "white",
                      }}
                    >
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 99,
                          background: c.color,
                          display: "inline-block",
                        }}
                      />
                      {c.name}
                    </button>
                  );
                })}
              </div>
              {form.categories.length === 0 && (
                <div style={{ color: "#991b1b", fontSize: 12, marginTop: 6 }}>
                  Choisis au moins une catégorie.
                </div>
              )}
            </div>

            <div>
              <label style={label}>Résumé (auto si vide)</label>
              <input
                style={input}
                value={form.excerpt}
                onChange={(e) => onChange("excerpt", e.target.value)}
                placeholder="Laisse vide pour générer automatiquement depuis le contenu"
              />
            </div>

            <div>
              <label style={label}>Contenu *</label>
              <textarea
                style={{
                  ...input,
                  minHeight: 240,
                  resize: "vertical",
                  lineHeight: 1.5,
                }}
                value={form.content}
                onChange={(e) => onChange("content", e.target.value)}
                placeholder="Écris ton article ici…"
              />
              <div style={{ color: "#64748b", fontSize: 12, marginTop: 6 }}>
                Minimum 50 caractères (côté API). Autosave toutes les 30s en
                brouillon.
              </div>
            </div>
          </div>
        </div>

        {/* preview */}
        <div style={card}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
            }}
          >
            <h3 style={{ margin: 0 }}>Prévisualisation</h3>
            <div style={{ fontSize: 12, color: "#64748b" }}>
              {preview.featured ? "⭐ Mis en avant" : ""}
            </div>
          </div>

          <div style={{ marginTop: 10, color: "#64748b", fontSize: 12 }}>
            {preview.meta} • <b>{preview.status}</b>
          </div>

          <h2 style={{ margin: "10px 0" }}>{preview.title}</h2>
          <p style={{ marginTop: 0, color: "#334155" }}>{preview.excerpt}</p>

          <hr
            style={{
              border: "none",
              borderTop: "1px solid #e2e8f0",
              margin: "14px 0",
            }}
          />

          <div
            style={{
              whiteSpace: "pre-wrap",
              color: "#0f172a",
              lineHeight: 1.6,
            }}
          >
            {preview.content}
          </div>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------
   Styles (simple & propre)
--------------------------------- */
const card: React.CSSProperties = {
  background: "white",
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  padding: 14,
};

const label: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  color: "#475569",
  marginBottom: 6,
};

const input: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #e2e8f0",
  outline: "none",
};

const btnPrimary: React.CSSProperties = {
  background: "#0f172a",
  color: "white",
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid #0f172a",
  cursor: "pointer",
  fontWeight: 600,
};

const btn: React.CSSProperties = {
  background: "white",
  border: "1px solid #e2e8f0",
  padding: "10px 14px",
  borderRadius: 10,
  cursor: "pointer",
  color: "#0f172a",
};

const chip: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid #e2e8f0",
  background: "white",
  cursor: "pointer",
};

const errorBox: React.CSSProperties = {
  background: "#fef2f2",
  border: "1px solid #fecaca",
  padding: 12,
  borderRadius: 12,
  color: "#991b1b",
};
