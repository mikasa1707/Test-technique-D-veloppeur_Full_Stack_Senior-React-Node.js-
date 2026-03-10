import { Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ArticlesPage from "./pages/ArticlesPage";
import ArticleEditPage from "./pages/ArticleEditPage";
import AdminLayout from "./components/layout/AdminLayout";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import CategoriesPage from "./pages/CategoriesPage";
import ImportPage from "./pages/ImportPage";
import NetworksPage from "./pages/NetworksPage";
import NotificationsPage from "./pages/NotificationsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/articles" element={<ArticlesPage />} />
        <Route path="/articles/new" element={<ArticleEditPage />} />
        <Route path="/articles/:id" element={<ArticleEditPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/networks" element={<NetworksPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/import" element={<ImportPage />} />
      </Route>
    </Routes>
  );
}
