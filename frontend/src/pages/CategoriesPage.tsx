import { useEffect, useMemo, useState } from "react";
import type { Category } from "../types/category";
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from "../services/categories";

import "../styles/CategoriesPage.css";

function isHexColor(s: string) {
  return /^#([0-9a-fA-F]{3}){1,2}$/.test(s);
}

export default function CategoriesPage() {
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#2563eb");

  const canSubmit = useMemo(() => {
    return (
      name.trim().length >= 2 &&
      slug.trim().length >= 2 &&
      isHexColor(color.trim())
    );
  }, [name, slug, color]);

  async function load() {
    setLoading(true);
    setError(null);

    try {
      const data = await listCategories();
      setItems(data);
    } catch {
      setError("Impossible de charger les catégories.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function resetForm() {
    setEditingId(null);
    setName("");
    setSlug("");
    setDescription("");
    setColor("#2563eb");
  }

  function startEdit(category: Category) {
    setEditingId(category.id);
    setName(category.name);
    setSlug(category.slug);
    setDescription(category.description || "");
    setColor(category.color);
  }

  async function onSubmit() {
    if (!canSubmit) return;

    setError(null);

    try {
      const payload = {
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        description: description.trim(),
        color: color.trim(),
      };

      if (editingId) {
        await updateCategory(editingId, payload);
      } else {
        await createCategory(payload);
      }

      resetForm();
      load();
    } catch {
      setError("Sauvegarde impossible. Vérifie les droits ou le slug.");
    }
  }

  async function onDelete(id: string) {
    if (!window.confirm("Supprimer cette catégorie ?")) return;

    setError(null);

    try {
      await deleteCategory(id);
      load();
    } catch {
      setError(
        "Suppression impossible. Cette catégorie est peut-être déjà utilisée.",
      );
    }
  }

  return (
    <div className="categories-page">
      <div className="categories-header">
        <div>
          <h1 className="categories-title">Catégories</h1>
          <div className="categories-subtitle">
            Créer, modifier, supprimer
          </div>
        </div>
      </div>

      {error && <div className="categories-error">{error}</div>}

      <div className="categories-content">
        <div className="categories-card">
          <h3 className="card-title">
            {editingId ? "Modifier une catégorie" : "Créer une catégorie"}
          </h3>

          <div className="categories-form">
            <div className="form-group">
              <label className="form-label">Nom *</label>
              <input
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Tech"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Slug *</label>
              <input
                className="form-input"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="Ex: tech"
              />
              <div className="form-help">
                Conseil : slug en minuscules, sans espaces.
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <input
                className="form-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Actualités tech"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Couleur *</label>

              <div className="color-row">
                <input
                  className="form-input"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="#2563eb"
                />

                <div
                  className="color-preview"
                  style={{ background: color }}
                ></div>
              </div>

              {!isHexColor(color.trim()) && (
                <div className="form-error">Couleur hex invalide.</div>
              )}
            </div>

            <div className="form-actions">
              <button
                className="btn-primary"
                onClick={onSubmit}
                disabled={!canSubmit || loading}
              >
                <i
                  className={`fa-solid ${editingId ? "fa-floppy-disk" : "fa-plus"}`}
                ></i>
                <span>{editingId ? "Mettre à jour" : "Créer"}</span>
              </button>

              <button
                className="btn-secondary"
                onClick={resetForm}
                disabled={loading}
              >
                <i className="fa-solid fa-rotate-left"></i>
                <span>Annuler</span>
              </button>
            </div>

            <div className="form-note">
              ⚠️ POST / PUT / DELETE réservés à l’admin côté API.
            </div>
          </div>
        </div>

        <div className="categories-card">
          <h3 className="card-title">Liste</h3>

          {loading ? (
            <div className="empty-state">Chargement…</div>
          ) : items.length === 0 ? (
            <div className="empty-state">Aucune catégorie.</div>
          ) : (
            <div className="categories-list">
              {items.map((c) => (
                <div key={c.id} className="category-row">
                  <div className="category-main">
                    <span
                      className="category-color-dot"
                      style={{ background: c.color }}
                    ></span>

                    <div>
                      <div className="category-name">{c.name}</div>
                      <div className="category-meta">
                        {c.slug} • {c.description || "Sans description"}
                      </div>
                    </div>
                  </div>

                  <div className="category-actions">
                    <button
                      className="btn-icon btn-edit"
                      onClick={() => startEdit(c)}
                      title="Modifier"
                      aria-label="Modifier"
                    >
                      <i className="fa-solid fa-pen"></i>
                    </button>

                    <button
                      className="btn-icon btn-delete"
                      onClick={() => onDelete(c.id)}
                      title="Supprimer"
                      aria-label="Supprimer"
                    >
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}