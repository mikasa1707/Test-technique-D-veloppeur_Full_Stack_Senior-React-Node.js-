const bcrypt = require("bcryptjs");
const now = () => new Date().toISOString();

const users = [
  {
    id: "usr-1",
    name: "Admin",
    email: "admin@demo.com",
    role: "admin",
    networkIds: ["net-1", "net-2"],
    passwordHash: bcrypt.hashSync("admin123", 10),
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: "usr-2",
    name: "Editor",
    email: "editor@demo.com",
    role: "editor",
    networkIds: ["net-1"],
    passwordHash: bcrypt.hashSync("editor123", 10),
    createdAt: now(),
    updatedAt: now(),
  },
];

const categories = [
  { id: "cat-1", name: "Tech", slug: "tech", description: "Actu tech", color: "#2563eb" },
  { id: "cat-2", name: "Business", slug: "business", description: "Actu business", color: "#16a34a" },
  { id: "cat-3", name: "Lifestyle", slug: "lifestyle", description: "Actu lifestyle", color: "#f59e0b" },
];

const networks = [
  { id: "net-1", name: "Public", description: "Réseau public" },
  { id: "net-2", name: "Pro", description: "Réseau professionnel" },
];

const articles = Array.from({ length: 10 }).map((_, i) => {
  const published = i % 3 === 0;
  return {
    id: `art-${i + 1}`,
    title: `Article démo ${i + 1}`,
    content: `Contenu ${i + 1}. `.repeat(20).trim(),
    excerpt: `Résumé ${i + 1}`,
    author: users[i % users.length].name,
    categories: [categories[i % categories.length].id],
    network: networks[i % networks.length].id,
    status: published ? "published" : "draft",
    featured: i % 4 === 0,
    publishedAt: published ? now() : null,
    createdAt: now(),
    updatedAt: now(),
  };
});

module.exports = { users, categories, networks, articles, now };