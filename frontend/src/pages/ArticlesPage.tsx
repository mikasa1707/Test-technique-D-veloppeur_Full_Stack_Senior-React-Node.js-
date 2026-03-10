import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { Article, ArticleStatus } from "../types/article";
import type { Category } from "../types/category";
import type { Network } from "../services/networks";

import "../styles/ArticlesPage.css";

import {
  listArticles,
  deleteArticle,
  updateArticle,
} from "../services/articles";
import { listCategories } from "../services/categories";
import { listNetworks } from "../services/networks";
import { formatDate } from "../utils/formatDate";
import axios from "axios";

type SortKey = "title" | "updatedAt" | "status" | "network";
type SortDir = "asc" | "desc";

export default function ArticlesPage() {
  const [items, setItems] = useState<Article[]>([]);
  const [total, setTotal] = useState(0);

  const [categories, setCategories] = useState<Category[]>([]);
  const [networks, setNetworks] = useState<Network[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<ArticleStatus | "">("");
  const [network, setNetwork] = useState<string>("");
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);

  const [page, setPage] = useState(1);
  const limit = 8;

  const [sortKey, setSortKey] = useState<SortKey>("updatedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const totalPages = Math.max(1, Math.ceil(total / limit));

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  const networkMap = useMemo(() => {
    const map = new Map<string, Network>();
    networks.forEach((n) => map.set(n.id, n));
    return map;
  }, [networks]);

  async function loadMeta() {
    try {
      const [cats, nets] = await Promise.all([
        listCategories(),
        listNetworks(),
      ]);
      setCategories(cats);
      setNetworks(nets);
    } catch {
      // pas bloquant pour la page
    }
  }

  async function load() {
    setLoading(true);
    setError(null);

    try {
      const data = await listArticles({
        page,
        limit,
        q: q.trim() || undefined,
        status: status || undefined,
        network: network || undefined,
        featured: featuredOnly || undefined,
        categoryIds: categoryIds.length ? categoryIds : undefined,
      });

      setItems(data.items);
      setTotal(data.total);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Impossible de charger les articles.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMeta();
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status, network, featuredOnly, categoryIds]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      load();
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const sortedItems = useMemo(() => {
    const copy = [...items];

    const getValue = (article: Article) => {
      switch (sortKey) {
        case "title":
          return article.title.toLowerCase();

        case "status":
          return article.status;

        case "network":
          return networkMap.get(article.network)?.name || article.network;

        case "updatedAt":
        default:
          return article.updatedAt;
      }
    };

    copy.sort((a, b) => {
      const av = getValue(a);
      const bv = getValue(b);

      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return copy;
  }, [items, sortKey, sortDir, networkMap]);

  function getErrorMessage(err: unknown, fallback: string): string {
    if (axios.isAxiosError(err)) {
      const data = err.response?.data as { message?: string } | undefined;
      return data?.message ?? fallback;
    }

    if (err instanceof Error) {
      return err.message || fallback;
    }

    return fallback;
  }

  async function onDelete(id: string) {
    if (!confirm("Supprimer cet article ?")) return;

    try {
      await deleteArticle(id);
      await load();
    } catch (err: unknown) {
      alert(getErrorMessage(err, "Suppression impossible."));
    }
  }

  async function onToggleFeatured(article: Article) {
    try {
      await updateArticle(article.id, { featured: !article.featured });
      await load();
    } catch (err: unknown) {
      alert(getErrorMessage(err, "Action impossible."));
    }
  }

  function toggleCategory(id: string) {
    setPage(1);
    setCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  return (
    <div className="articles-page">
      <div className="header">
        <div>
          <h4 className="title">Articles</h4>
        </div>

        <Link to="/articles/new" className="btn btn-sm btn-transparent">
          <i className="fa-solid fa-file-circle-plus"></i>
        </Link>
      </div>

      <div className="card p-3">
        <div className="container text-center">
          <div className="row">
            <div className="col">
              <div className="input-group mb-3">
                <input
                  type="text"
                  className="form-control"
                  aria-label="find"
                  aria-describedby="button-addon2"
                  placeholder="Rechercher (titre ou contenu)…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
                <label className="input-group-text">
                  <i className="fas fa-search"></i>
                </label>
              </div>
            </div>

            <div className="col">
              <select
                value={status}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  setPage(1);
                  setStatus(e.target.value as ArticleStatus);
                }}
                className="form-control"
              >
                <option value="">Tous statuts</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="col">
              <select
                value={network}
                onChange={(e) => {
                  setPage(1);
                  setNetwork(e.target.value);
                }}
                className="form-control"
              >
                <option value="">Tous réseaux</option>
                {networks.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="filters-row">
          <div className="header">
            <div className="category-block">
              {categories.map((c) => {
                const active = categoryIds.includes(c.id);

                return (
                  <button
                    key={c.id}
                    onClick={() => toggleCategory(c.id)}
                    className={`category-chip ${active ? "active" : ""}`}
                    style={{ "--color": c.color } as React.CSSProperties}
                  >
                    <span className="category-dot" />
                    {c.name}
                  </button>
                );
              })}
            </div>

            <div>
              <label className="label-class">
                <input
                  type="checkbox"
                  checked={featuredOnly}
                  onChange={(e) => {
                    setPage(1);
                    setFeaturedOnly(e.target.checked);
                  }}
                />
                Mis en avant
              </label>
            </div>
          </div>
        </div>
      </div>

      {error && <div style={errorBox}>{error}</div>}
      {loading && <div style={{ color: "#64748b" }}>Chargement…</div>}

      <div className="card articles-table-card">
        <div className="table-wrapper">
          <table className="table table-sm table-hover articles-table">
            <thead>
              <tr>
                <Th
                  onClick={() => toggleSort("title")}
                  active={sortKey === "title"}
                >
                  Titre
                </Th>

                <Th
                  onClick={() => toggleSort("status")}
                  active={sortKey === "status"}
                >
                  Statut
                </Th>

                <Th
                  onClick={() => toggleSort("network")}
                  active={sortKey === "network"}
                >
                  Réseau
                </Th>

                <th>Catégories</th>

                <Th
                  onClick={() => toggleSort("updatedAt")}
                  active={sortKey === "updatedAt"}
                >
                  Modifié
                </Th>

                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {!loading && sortedItems.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: 16, color: "#64748b" }}>
                    Aucun article trouvé avec ces filtres.
                  </td>
                </tr>
              )}

              {sortedItems.map((a) => (
                <tr key={a.id} className="article-row">
                  <td style={td}>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      {a.featured && <span title="Mis en avant">⭐</span>}

                      <div>
                        <Link
                          to={`/articles/${a.id}`}
                          style={{
                            fontWeight: 600,
                            color: "#0f172a",
                            textDecoration: "none",
                          }}
                        >
                          {a.title}
                        </Link>

                        <div style={{ fontSize: 12, color: "#64748b" }}>
                          {a.author} •{" "}
                          {a.publishedAt
                            ? `Publié ${formatDate(a.publishedAt)}`
                            : "Non publié"}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td style={td}>
                    <StatusPill status={a.status} />
                  </td>

                  <td style={td}>
                    {networkMap.get(a.network)?.name || a.network}
                  </td>

                  <td style={td}>
                    <div className="categories-list">
                      {a.categories.map((cid) => {
                        const c = categoryMap.get(cid);

                        if (!c) {
                          return (
                            <span key={cid} style={miniTag}>
                              {cid}
                            </span>
                          );
                        }

                        return (
                          <span
                            key={cid}
                            style={{ ...miniTag, borderColor: c.color }}
                          >
                            {c.name}
                          </span>
                        );
                      })}
                    </div>
                  </td>

                  <td style={td}>{formatDate(a.updatedAt)}</td>

                  <td className="td-actions">
                    <div className="table-actions">
                      <button
                        className="action-btn feature-btn"
                        onClick={() => onToggleFeatured(a)}
                        title={
                          a.featured
                            ? "Retirer de la mise en avant"
                            : "Mettre en avant"
                        }
                      >
                        <i
                          className={`fa-solid ${
                            a.featured ? "fa-star" : "fa-star-half-stroke"
                          }`}
                        ></i>
                      </button>

                      <Link
                        to={`/articles/${a.id}`}
                        className="action-btn edit-btn"
                        title="Modifier"
                      >
                        <i className="fa-solid fa-pen"></i>
                      </Link>

                      <button
                        className="action-btn delete-btn"
                        onClick={() => onDelete(a.id)}
                        title="Supprimer"
                      >
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="table-pagination">
          <div className="pagination-info">
            Page {page} / {totalPages}
          </div>

          <div className="pagination-actions">
            <button
              style={btn}
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ◀ Précédent
            </button>

            <button
              style={btn}
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Suivant ▶
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

type ThProps = {
  children: React.ReactNode;
  onClick: () => void;
  active: boolean;
};

function Th({ children, onClick, active }: ThProps) {
  return (
    <th
      onClick={onClick}
      style={{
        cursor: "pointer",
        userSelect: "none",
        color: active ? "#0f172a" : "#475569",
      }}
      title="Cliquer pour trier"
    >
      {children}
    </th>
  );
}

function StatusPill({ status }: { status: Article["status"] }) {
  const map: Record<string, { label: string; bg: string; border: string }> = {
    draft: { label: "Draft", bg: "#f8fafc", border: "#e2e8f0" },
    published: { label: "Published", bg: "#ecfdf5", border: "#bbf7d0" },
    archived: { label: "Archived", bg: "#fff7ed", border: "#fed7aa" },
  };

  const s = map[status] || map.draft;

  return (
    <span
      style={{
        padding: "4px 10px",
        borderRadius: 999,
        border: `1px solid ${s.border}`,
        background: s.bg,
        fontSize: 12,
      }}
    >
      {s.label}
    </span>
  );
}

const btn: React.CSSProperties = {
  background: "white",
  border: "1px solid #e2e8f0",
  padding: "7px 10px",
  borderRadius: 10,
  cursor: "pointer",
};

const td: React.CSSProperties = {
  padding: 12,
  verticalAlign: "top",
};

const miniTag: React.CSSProperties = {
  fontSize: 12,
  padding: "3px 8px",
  borderRadius: 999,
  border: "1px solid #e2e8f0",
  background: "#fff",
};

const errorBox: React.CSSProperties = {
  background: "#fef2f2",
  border: "1px solid #fecaca",
  padding: 12,
  borderRadius: 12,
  color: "#991b1b",
};