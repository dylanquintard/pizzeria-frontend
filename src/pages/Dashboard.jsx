// src/pages/Dashboard.jsx
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { NavLink } from "react-router-dom";
import '../styles/Dashboard.css';

export default function Dashboard({ children }) {
  const { user } = useContext(AuthContext);

  if (!user || user.role !== "ADMIN") {
    return <p>Accès refusé : administrateur uniquement</p>;
  }

  return (
    <div className="admin-dashboard">
      {/* Menu horizontal */}
      <nav className="admin-menu">
        <NavLink to="/admin/orders" className={({ isActive }) => isActive ? 'active' : ''}>
          Gestion Commandes
        </NavLink>
        <NavLink to="/admin/users" className={({ isActive }) => isActive ? 'active' : ''}>
          Gestion Clients
        </NavLink>
        <NavLink to="/admin/pizzas" className={({ isActive }) => isActive ? 'active' : ''}>
          Gestion Pizzas
        </NavLink>
        <NavLink to="/admin/ingredients" className={({ isActive }) => isActive ? 'active' : ''}>
          Gestion Ingrédients
        </NavLink>
        <NavLink to="/admin/timeslots" className={({ isActive }) => isActive ? 'active' : ''}>
          Gestion Créneaux
        </NavLink>
      </nav>

      {/* Contenu dynamique */}
      <div className="admin-content">
        {children}
      </div>
    </div>
  );
}