require("dotenv").config();

const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { randomUUID } = require("crypto");

const store = require("./depot");
const v = require("./validator");

const app = express();
app.use(cors());
app.use(express.json());

/* ------------------------------
   Petits helpers "humains"
--------------------------------*/
const ok = (res, data) => res.json(data);
const fail = (res, status, message, details) =>
  res.status(status).json({ message, details });

function isOwner(req, article) {
  if (!req.user) return false;
  if (req.user.role === "admin") return true;
  return article.createdBy === req.user.sub;
}

function slugify(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-]/g, "")
    .replace(/\-+/g, "-");
}

function mustExistById(list, id) {
  return list.find((x) => x.id === id) || null;
}

function uniqueBy(list, key, value, ignoreId) {
  const found = list.find((x) => x[key] === value && x.id !== ignoreId);
  return !found;
}

/* ------------------------------
   Auth / JWT
--------------------------------*/
function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      email: user.email,
      name: user.name,
      networkIds: user.networkIds || [],
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1h" },
  );
}

function requireAuth(req, res, next) {
  const auth = req.header("authorization") || "";
  const [type, token] = auth.split(" ");

  if (type !== "Bearer" || !token) {
    return fail(
      res,
      401,
      "Tu dois être connecté : envoie un token Bearer dans Authorization.",
    );
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (e) {
    return fail(res, 401, "Ton token est invalide ou expiré. Reconnecte-toi.");
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return fail(res, 401, "Tu dois être connecté.");
    if (!roles.includes(req.user.role)) {
      return fail(res, 403, "Désolé, tu n’as pas les droits pour faire ça.");
    }
    next();
  };
}

function requireArticleAccess(action) {
  // action: "read" | "update" | "delete" | "publish" | "archive"
  return (req, res, next) => {
    const article = mustExistById(store.articles, req.params.id);
    if (!article) return fail(res, 404, "Article introuvable.");

    // 1) Segmentation réseau
    if (!canAccessNetwork(req, article.network)) {
      return fail(res, 403, "Tu n’as pas accès à ce réseau.");
    }

    // 2) Admin => OK
    if (req.user.role === "admin") {
      req.article = article;
      return next();
    }

    // 3) Editor => règles fines
    if (action === "read") {
      req.article = article;
      return next();
    }

    // Editor: update/delete seulement sur SES articles
    if ((action === "update" || action === "delete") && !isOwner(req, article)) {
      return fail(res, 403, "Tu peux modifier/supprimer seulement tes propres articles.");
    }

    // Editor: publier/archiver interdit (version “avancée”)
    if (action === "publish" || action === "archive") {
      return fail(res, 403, "Seul un admin peut publier ou archiver un article.");
    }

    req.article = article;
    next();
  };
}

/* ------------------------------
   Segmentation réseau
--------------------------------*/
function canAccessNetwork(req, networkId) {
  if (!req.user) return false;
  if (req.user.role === "admin") return true;
  const allowed = req.user.networkIds || [];
  return allowed.includes(networkId);
}

/* =========================================================
   AUTH
========================================================= */
app.post("/api/auth/login", (req, res) => {
  const parsed = v.loginSchema.safeParse(req.body);
  if (!parsed.success)
    return fail(res, 400, "Formulaire invalide.", parsed.error.flatten());

  const { email, password } = parsed.data;

  const user = store.users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase(),
  );
  if (!user) return fail(res, 401, "Email ou mot de passe incorrect.");

  const okPwd = bcrypt.compareSync(password, user.passwordHash);
  if (!okPwd) return fail(res, 401, "Email ou mot de passe incorrect.");

  const token = signToken(user);

  ok(res, {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      networkIds: user.networkIds || [],
    },
  });
});

/* =========================================================
   USERS (admin only)
========================================================= */
app.get("/api/users", requireAuth, requireRole("admin"), (req, res) => {
  const safe = store.users.map(({ passwordHash, ...rest }) => rest);
  ok(res, safe);
});

app.get("/api/users/:id", requireAuth, requireRole("admin"), (req, res) => {
  const u = mustExistById(store.users, req.params.id);
  if (!u) return fail(res, 404, "Utilisateur introuvable.");
  const { passwordHash, ...safe } = u;
  ok(res, safe);
});

app.post("/api/users", requireAuth, requireRole("admin"), (req, res) => {
  const parsed = v.userCreateSchema.safeParse(req.body);
  if (!parsed.success)
    return fail(
      res,
      400,
      "Données utilisateur invalides.",
      parsed.error.flatten(),
    );

  const { name, email, role } = parsed.data;

  if (!uniqueBy(store.users, "email", email)) {
    return fail(res, 409, "Cet email est déjà utilisé.");
  }

  // Ici, tu peux décider d'un mot de passe par défaut (ou d'ajouter un champ password dans le schema)
  // Pour rester simple : password = "changeme"
  const passwordHash = bcrypt.hashSync("changeme", 10);

  const now = store.now();
  const user = {
    id: randomUUID(),
    name,
    email,
    role,
    networkIds: [],
    passwordHash,
    createdAt: now,
    updatedAt: now,
  };

  store.users.push(user);

  res.status(201).json({
    ...user,
    passwordHash: undefined, // on n'expose pas le hash
  });
});

app.put("/api/users/:id", requireAuth, requireRole("admin"), (req, res) => {
  const u = mustExistById(store.users, req.params.id);
  if (!u) return fail(res, 404, "Utilisateur introuvable.");

  const parsed = v.userUpdateSchema.safeParse(req.body);
  if (!parsed.success)
    return fail(
      res,
      400,
      "Données utilisateur invalides.",
      parsed.error.flatten(),
    );

  if (
    parsed.data.email &&
    !uniqueBy(store.users, "email", parsed.data.email, u.id)
  ) {
    return fail(res, 409, "Cet email est déjà utilisé.");
  }

  Object.assign(u, parsed.data, { updatedAt: store.now() });

  ok(res, { ...u, passwordHash: undefined });
});

app.delete("/api/users/:id", requireAuth, requireRole("admin"), (req, res) => {
  const idx = store.users.findIndex((x) => x.id === req.params.id);
  if (idx === -1) return fail(res, 404, "Utilisateur introuvable.");
  store.users.splice(idx, 1);
  res.status(204).send();
});

/* =========================================================
   CATEGORIES
========================================================= */
app.get("/api/categories", requireAuth, (req, res) =>
  ok(res, store.categories),
);

app.post("/api/categories", requireAuth, requireRole("admin"), (req, res) => {
  const parsed = v.categoryCreateSchema.safeParse(req.body);
  if (!parsed.success)
    return fail(res, 400, "Catégorie invalide.", parsed.error.flatten());

  const { name, slug, description, color } = parsed.data;
  if (!uniqueBy(store.categories, "slug", slug))
    return fail(res, 409, "Ce slug existe déjà.");

  const cat = { id: randomUUID(), name, slug, description, color };
  store.categories.push(cat);
  res.status(201).json(cat);
});

app.put(
  "/api/categories/:id",
  requireAuth,
  requireRole("admin"),
  (req, res) => {
    const c = mustExistById(store.categories, req.params.id);
    if (!c) return fail(res, 404, "Catégorie introuvable.");

    const parsed = v.categoryUpdateSchema.safeParse(req.body);
    if (!parsed.success)
      return fail(res, 400, "Catégorie invalide.", parsed.error.flatten());

    if (
      parsed.data.slug &&
      !uniqueBy(store.categories, "slug", parsed.data.slug, c.id)
    ) {
      return fail(res, 409, "Ce slug existe déjà.");
    }

    Object.assign(c, parsed.data);
    ok(res, c);
  },
);

app.delete(
  "/api/categories/:id",
  requireAuth,
  requireRole("admin"),
  (req, res) => {
    const id = req.params.id;

    const used = store.articles.some((a) => (a.categories || []).includes(id));
    if (used)
      return fail(
        res,
        409,
        "Impossible : cette catégorie est utilisée par un article.",
      );

    const idx = store.categories.findIndex((x) => x.id === id);
    if (idx === -1) return fail(res, 404, "Catégorie introuvable.");

    store.categories.splice(idx, 1);
    res.status(204).send();
  },
);

/* =========================================================
   NETWORKS
========================================================= */
app.get("/api/networks", requireAuth, (req, res) => ok(res, store.networks));

/* =========================================================
   ARTICLES
========================================================= */
app.get("/api/articles", requireAuth, (req, res) => {
  const {
    q,
    status,
    network,
    featured,
    category,
    page = "1",
    limit = "20",
  } = req.query;

  let list = [...store.articles];

  // Segmentation réseau
  if (req.user.role !== "admin") {
    const allowed = req.user.networkIds || [];
    list = list.filter((a) => allowed.includes(a.network));
  }

  // Filtres
  if (q) {
    const s = String(q).toLowerCase();
    list = list.filter((a) =>
      (a.title + " " + a.content).toLowerCase().includes(s),
    );
  }
  if (status) list = list.filter((a) => a.status === status);
  if (network) list = list.filter((a) => a.network === network);
  if (featured === "true") list = list.filter((a) => a.featured === true);

  if (category) {
    const cats = String(category)
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
    list = list.filter((a) =>
      cats.every((c) => (a.categories || []).includes(c)),
    );
  }

  // Pagination
  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
  const total = list.length;
  const start = (p - 1) * l;
  const items = list.slice(start, start + l);

  ok(res, { items, page: p, limit: l, total });
});

app.get("/api/articles/:id", requireAuth, requireArticleAccess("read"), (req, res) => {
  ok(res, req.article);
});

app.post(
  "/api/articles",
  requireAuth,
  requireRole("admin", "editor"),
  (req, res) => {
    const parsed = v.articleCreateSchema.safeParse(req.body);
    if (!parsed.success)
      return fail(res, 400, "Article invalide.", parsed.error.flatten());

    const { categories, network, status } = parsed.data;

    // segmentation réseau : tu peux créer seulement dans tes réseaux
    if (!canAccessNetwork(req, network)) {
      return fail(res, 403, "Tu ne peux pas créer un article dans ce réseau.");
    }

    // verify categories & network exist
    const allCatsOk = categories.every((id) =>
      store.categories.some((c) => c.id === id),
    );
    if (!allCatsOk) return fail(res, 400, "Une des catégories est inconnue.");
    if (!store.networks.some((n) => n.id === network))
      return fail(res, 400, "Réseau inconnu.");

    const now = store.now();
    const article = {
      id: randomUUID(),
      ...parsed.data,
      createdBy: req.user.sub,
      publishedAt: status === "published" ? now : null,
      createdAt: now,
      updatedAt: now,
    };

    store.articles.push(article);
    res.status(201).json(article);
  },
);

app.put("/api/articles/:id",
  requireAuth,
  requireRole("admin", "editor"),
  requireArticleAccess("update"),
  (req, res) => {
    const a = req.article;

    const parsed = v.articleUpdateSchema.safeParse(req.body);
    if (!parsed.success) return fail(res, 400, "Article invalide.", parsed.error.flatten());

    // Si editor, empêcher changement de réseau (même si owner)
    if (req.user.role === "editor" && parsed.data.network && parsed.data.network !== a.network) {
      return fail(res, 403, "Tu ne peux pas déplacer un article vers un autre réseau.");
    }

    Object.assign(a, parsed.data, { updatedAt: store.now() });

    ok(res, a);
  }
);

app.put("/api/articles/:id",
  requireAuth,
  requireRole("admin", "editor"),
  requireArticleAccess("update"),
  (req, res) => {
    const a = req.article;

    const parsed = v.articleUpdateSchema.safeParse(req.body);
    if (!parsed.success) return fail(res, 400, "Article invalide.", parsed.error.flatten());

    // Si editor, empêcher changement de réseau (même si owner)
    if (req.user.role === "editor" && parsed.data.network && parsed.data.network !== a.network) {
      return fail(res, 403, "Tu ne peux pas déplacer un article vers un autre réseau.");
    }

    Object.assign(a, parsed.data, { updatedAt: store.now() });

    ok(res, a);
  }
);

app.patch("/api/articles/:id/status",
  requireAuth,
  requireRole("admin"), // <= ultra clair
  requireArticleAccess("publish"),
  (req, res) => {
    const a = req.article;

    const parsed = v.articleStatusSchema.safeParse(req.body);
    if (!parsed.success) return fail(res, 400, "Statut invalide.", parsed.error.flatten());

    a.status = parsed.data.status;
    a.updatedAt = store.now();
    a.publishedAt = a.status === "published" ? (a.publishedAt || store.now()) : null;

    ok(res, a);
  }
);

/* =========================================================
   IMPORT JSON
========================================================= */
app.post(
  "/api/import/articles",
  requireAuth,
  requireRole("admin"),
  (req, res) => {
    const parsed = v.importArraySchema.safeParse(req.body);

    if (!parsed.success) {
      return fail(res, 400, "Fichier JSON invalide.", parsed.error.flatten());
    }

    const data = parsed.data;

    const results = { createdCount: 0, errors: [], createdIds: [] };

    data.forEach((row, index) => {
      try {
        const title = row?.title;
        const content = row?.content;
        const excerpt = row?.excerpt || "";
        const author = row?.author || "Import";
        const categoryName = row?.category;
        const networkName = row?.network;

        if (!title || typeof title !== "string" || title.trim().length < 5) {
          throw new Error("Titre invalide (min 5 caractères).");
        }
        if (
          !content ||
          typeof content !== "string" ||
          content.trim().length < 50
        ) {
          throw new Error("Contenu invalide (min 50 caractères).");
        }
        if (!categoryName || typeof categoryName !== "string") {
          throw new Error("Catégorie manquante.");
        }
        if (!networkName || typeof networkName !== "string") {
          throw new Error("Réseau manquant.");
        }

        // categorie
        const slug = slugify(categoryName);
        let cat = store.categories.find((c) => c.slug === slug);
        if (!cat) {
          cat = {
            id: randomUUID(),
            name: categoryName.trim(),
            slug,
            description: "Catégorie importée",
            color: "#64748b",
          };
          store.categories.push(cat);
        }

        // reseau
        let net = store.networks.find(
          (n) => n.name.toLowerCase() === networkName.trim().toLowerCase(),
        );
        if (!net) {
          net = {
            id: randomUUID(),
            name: networkName.trim(),
            description: "Réseau importé",
          };
          store.networks.push(net);
        }

        if (!canAccessNetwork(req, net.id)) {
          throw new Error("Tu n’as pas le droit d’importer dans ce réseau.");
        }

        const now = store.now();
        const article = {
          id: randomUUID(),
          title: title.trim(),
          content: content.trim(),
          excerpt,
          author,
          categories: [cat.id],
          network: net.id,
          status: "draft",
          featured: false,
          publishedAt: null,
          createdAt: now,
          updatedAt: now,
        };

        store.articles.push(article);
        results.createdCount += 1;
        results.createdIds.push(article.id);
      } catch (e) {
        results.errors.push({ index, message: e.message });
      }
    });

    ok(res, results);
  },
);

/* =========================================================
   404 global
========================================================= */
app.use((req, res) => fail(res, 404, "Route introuvable."));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
