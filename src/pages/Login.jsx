import { useState, useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { loginUser } from "../api/user.api";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const { user, login } = useContext(AuthContext);
  const navigate = useNavigate();

  // Redirection si déjà connecté
  useEffect(() => {
    if (user) {
      navigate("/profile");
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const { user: loggedUser, token } = await loginUser({ email, password });
      login(loggedUser, token);
      navigate("/profile"); // redirection après login
    } catch (err) {
      setError(err.response?.data?.error || "Erreur connexion");
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "0 auto" }}>
      <h2>Connexion</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Se connecter</button>
        {error && <p style={{ color: "red" }}>{error}</p>}
      </form>
    </div>
  );
}