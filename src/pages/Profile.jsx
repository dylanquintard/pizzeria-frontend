// src/pages/Profile.jsx
import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { updateMe } from "../api/user.api";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const { user, token, updateUserContext } = useContext(AuthContext);
  const navigate = useNavigate();

  // ===== States profil =====
  const [editingProfile, setEditingProfile] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // ===== States mot de passe =====
  const [editingPassword, setEditingPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // ===== Loading et messages =====
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Pré-remplissage des champs à la connexion
  useEffect(() => {
    if (!user || !token) {
      navigate("/login");
      return;
    }
    setName(user.name || "");
    setPhone(user.phone || "");
    setEmail(user.email || "");
  }, [user, token, navigate]);

  // ================= UPDATE PROFIL =================
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const formData = { name, phone };
      const updatedUser = await updateMe(token, formData);

      updateUserContext(updatedUser);
      setMessage("Profil mis à jour avec succès !");
      setEditingProfile(false);
    } catch (err) {
      console.error("Erreur update profil :", err);
      setMessage(err.response?.data?.error || "Erreur lors de la mise à jour du profil");
    } finally {
      setLoading(false);
    }
  };

  // ================= CHANGE PASSWORD =================
  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (!oldPassword || !newPassword || !confirmPassword) {
      setMessage("Veuillez remplir tous les champs du mot de passe");
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("Le nouveau mot de passe et la confirmation ne correspondent pas");
      setLoading(false);
      return;
    }

    try {
      // On envoie oldPassword + newPassword pour que le backend vérifie l'ancien et hash le nouveau
      await updateMe(token, { oldPassword, newPassword });

      setMessage("Mot de passe mis à jour avec succès !");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setEditingPassword(false);
    } catch (err) {
      console.error("Erreur update mot de passe :", err);
      setMessage(err.response?.data?.error || "Erreur lors de la mise à jour du mot de passe");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-page" style={{ maxWidth: "600px", margin: "0 auto", padding: "20px" }}>
      <h2>Mon profil</h2>

      {message && (
        <p style={{ color: message.includes("succès") ? "green" : "red" }}>
          {message}
        </p>
      )}

      {/* ====================== MODIFICATION PROFIL ====================== */}
      <div style={{ border: "1px solid #ddd", borderRadius: "12px", padding: "16px", marginBottom: "20px" }}>
        <h3>Informations personnelles</h3>

        {!editingProfile ? (
          <>
            <p><strong>Nom :</strong> {name}</p>
            <p><strong>Email :</strong> {email}</p>
            <p><strong>Téléphone :</strong> {phone}</p>
            <button onClick={() => setEditingProfile(true)}>Modifier mon profil</button>
          </>
        ) : (
          <form onSubmit={handleProfileUpdate} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div>
              <label>Nom</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <label>Email</label>
              <input type="email" value={email} disabled />
            </div>
            <div>
              <label>Téléphone</label>
              <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button type="submit" disabled={loading}>
                {loading ? "Mise à jour..." : "Enregistrer"}
              </button>
              <button type="button" onClick={() => setEditingProfile(false)} className="btn-cancel">
                Annuler
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ====================== MODIFICATION MOT DE PASSE ====================== */}
      <div style={{ border: "1px solid #ddd", borderRadius: "12px", padding: "16px" }}>

        {!editingPassword ? (
          <button onClick={() => setEditingPassword(true)}>Modifier le mot de passe</button>
        ) : (
          <form onSubmit={handlePasswordUpdate} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div>
              <label>Mot de passe actuel</label>
              <input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} required />
            </div>
            <div>
              <label>Nouveau mot de passe</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
            </div>
            <div>
              <label>Confirmer le nouveau mot de passe</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button type="submit" disabled={loading}>
                {loading ? "Mise à jour..." : "Changer le mot de passe"}
              </button>
              <button type="button" onClick={() => setEditingPassword(false)} className="btn-cancel">
                Annuler
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}