import { useState, useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { registerUser, loginUser } from "../api/user.api"; 
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    setLoading(true);
    setError("");

    try {
      // 1️⃣ Création du compte
      await registerUser({ name, email, phone, password });

      // 2️⃣ Connexion automatique
      const { user: loggedUser, token } = await loginUser({ email, password });
      login(loggedUser, token);

      // 3️⃣ Redirection
      navigate("/profile");
    } catch (err) {
      setError(err.response?.data?.error || "Erreur inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page" style={{ maxWidth: 400, margin: "0 auto" }}>
      <h2>Créer un compte</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <input
          placeholder="Nom"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          placeholder="Téléphone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
        <input
          placeholder="Mot de passe"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Création en cours..." : "S’inscrire"}
        </button>
      </form>
    </div>
  );
}