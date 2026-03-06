import { Link } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import '../styles/Header.css';

export default function Header() {
  const { token, user, logout } = useContext(AuthContext);

  return (
    <header>
      <nav>
        {/* Logo */}
        <div className="logo">Logo</div>

        {/* Liens principaux */}
        <div className="menu-links">
          <Link to="/menu">Carte</Link>
          {token && <Link to="/order">Commander</Link>}
          {token && <Link to="/profile">Mon profil</Link>}
          {token && <Link to="/userorders">Mes commandes</Link>}
        </div>

        {/* Actions : Admin + Déconnexion / Connexion */}
        <div className="actions">
          {token && user?.role === "ADMIN" && (
            <Link to="/admin" className="admin-link">Admin</Link>
          )}

          {!token ? (
            <Link to="/login" className="login-btn">Se connecter</Link>
          ) : (
            <button onClick={logout}>Déconnexion</button>
          )}
        </div>
      </nav>
    </header>
  );
}