const { z } = require("zod");

/* -------------------------
   Helpers Zod
--------------------------*/
const trimString = () => z.string().transform((s) => String(s).trim());
const lowerTrimString = () => z.string().transform((s) => String(s).trim().toLowerCase());

const hexColor = z.string().regex(/^#([0-9a-fA-F]{3}){1,2}$/, "Couleur hex invalide (ex: #2563eb)");

const roleSchema = z.enum(["admin", "editor"]);
const statusSchema = z.enum(["draft", "published", "archived"]);

/* -------------------------
   USERS
--------------------------*/
// Création user (admin only)
const userCreateSchema = z.object({
  name: trimString().pipe(z.string().min(2, "Nom trop court (min 2)")),
  email: lowerTrimString().pipe(z.string().email("Email invalide")),
  role: roleSchema,
  // segmentation: quels réseaux l'utilisateur peut voir
  networkIds: z.array(trimString()).optional().default([]),
});

// Update user
const userUpdateSchema = userCreateSchema.partial();

// Login
const loginSchema = z.object({
  email: lowerTrimString().pipe(z.string().email("Email invalide")),
  password: trimString().pipe(z.string().min(4, "Mot de passe trop court")),
});

/* -------------------------
   CATEGORIES
--------------------------*/
const categoryCreateSchema = z.object({
  name: trimString().pipe(z.string().min(2, "Nom trop court (min 2)")),
  slug: lowerTrimString().pipe(z.string().min(2, "Slug trop court (min 2)")),
  description: trimString().optional().default(""),
  color: hexColor,
});

const categoryUpdateSchema = categoryCreateSchema.partial();

/* -------------------------
   ARTICLES
--------------------------*/
const articleCreateSchema = z.object({
  title: trimString().pipe(z.string().min(5, "Titre trop court (min 5)")),
  content: trimString().pipe(z.string().min(50, "Contenu trop court (min 50)")),
  excerpt: trimString().optional().default("").pipe(z.string().max(300, "Résumé trop long (max 300)")),
  author: trimString().pipe(z.string().min(2, "Auteur trop court (min 2)")),
  categories: z.array(trimString()).min(1, "Au moins une catégorie est requise"),
  network: trimString().pipe(z.string().min(1, "Réseau requis")),
  status: statusSchema.default("draft"),
  featured: z.boolean().default(false),
});

const articleUpdateSchema = articleCreateSchema.partial();

// PATCH status
const articleStatusSchema = z.object({
  status: statusSchema,
});

/* -------------------------
   IMPORT JSON
--------------------------*/
const importRowSchema = z.object({
  title: trimString().pipe(z.string().min(5, "Titre trop court (min 5)")),
  content: trimString().pipe(z.string().min(50, "Contenu trop court (min 50)")),
  excerpt: trimString().optional().default(""),
  author: trimString().optional().default("Import"),
  category: trimString().pipe(z.string().min(1, "Catégorie manquante")),
  network: trimString().pipe(z.string().min(1, "Réseau manquant")),
});

const importArraySchema = z.array(importRowSchema);

module.exports = {
  // users
  userCreateSchema,
  userUpdateSchema,
  loginSchema,

  // categories
  categoryCreateSchema,
  categoryUpdateSchema,

  // articles
  articleCreateSchema,
  articleUpdateSchema,
  articleStatusSchema,

  // import
  importArraySchema,
};