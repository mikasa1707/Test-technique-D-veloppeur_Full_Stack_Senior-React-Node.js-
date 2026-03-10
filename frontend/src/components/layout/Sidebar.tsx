import { NavLink } from "react-router-dom";
import "../../styles/SideBar.css";
import { useAuth } from "../../hooks/useAuth";

export default function Sidebar() {
const { logout } = useAuth();
  return (
    <div className="sidebar">
      <h2>Back-office</h2>

      <nav>
        <NavLink to="/">Dashboard</NavLink>
        <NavLink to="/articles">Articles</NavLink>
        <NavLink to="/categories">Categories</NavLink>
        <NavLink to="/networks">Networks</NavLink>
        <NavLink to="/notifications">Notifications</NavLink>
        <NavLink to="/import">Import JSON</NavLink>
      </nav>

      <button onClick={logout}>Logout</button>
    </div>
  );
}
