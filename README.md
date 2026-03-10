# Back-office CMS – Test technique

Ce projet est un mini **back-office de gestion d’articles** permettant d’administrer un contenu éditorial via une interface web.

Il a été réalisé dans le cadre d’un **test technique fullstack** avec un backend Node.js et un frontend React.

---

# Stack technique

### Backend
- Node.js
- Express
- JWT (authentification)
- Zod (validation)
- Données en mémoire (seed)

### Frontend
- React
- TypeScript
- Axios
- React Router

---

# Fonctionnalités principales

### Authentification
- Connexion utilisateur avec JWT
- Gestion des rôles (admin / editor)
- Déconnexion automatique si token expiré

### Gestion des articles
- CRUD complet
- Filtres (status, catégorie, réseau, recherche)
- Pagination
- Mise en avant (featured)

### Catégories
- Création / modification / suppression
- Couleur associée
- Vérification des conflits de slug

### Réseaux utilisateurs
- Segmentation des articles par réseau
- Accès conditionnel selon le rôle

### Import JSON
- Import d’articles via fichier JSON
- Création automatique des catégories et réseaux manquants
- Rapport d’import (succès / erreurs)

### Dashboard
- Vue globale du contenu
- Statistiques simples
- Derniers articles publiés

### Notifications
- Historique des emails envoyés

---

# Structure du projet
backend/
src/
app.js
depot.js
validator.js

frontend/
src/
components/
hooks/
pages/
services/
types/
utils/