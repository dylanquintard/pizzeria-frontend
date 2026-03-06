import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { getAllUsers, updateUserRole, deleteUser } from "../api/admin.api"; // <-- endpoints à créer si besoin
import { useNavigate } from "react-router-dom";

export default function Users() {
  const { user, token, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (authLoading) return;

    if (!user || !token) {
      navigate("/login");
      return;
    }

    if (user.role !== "ADMIN") {
      setMessage("Accès refusé : administrateur uniquement");
      return;
    }

    async function fetchUsers() {
      try {
        const data = await getAllUsers(token);
        setUsers(data);
      } catch (err) {
        console.error(err);
        setMessage(err.response?.data?.error || "Erreur lors du chargement des utilisateurs");
      }
    }

    fetchUsers();
  }, [authLoading, token, user, navigate]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      const updatedUser = await updateUserRole(token, userId, newRole);
      setUsers(users.map(u => u.id === userId ? updatedUser : u));
      setMessage("Rôle mis à jour avec succès !");
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.error || "Erreur lors de la mise à jour du rôle");
    }
  };

  const handleDelete = async (userId) => {
    try {
      await deleteUser(token, userId);
      setUsers(users.filter(u => u.id !== userId));
      setMessage("Utilisateur supprimé !");
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.error || "Erreur lors de la suppression");
    }
  };

  if (authLoading) return <p>Chargement du contexte utilisateur...</p>;

  return (
    <div>
      <h2>Liste des utilisateurs</h2>
      {message && <p>{message}</p>}

      <table>
        <thead>
          <tr>
            <th>ID</th><th>Nom</th><th>Email</th><th>Téléphone</th><th>Rôle</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>{u.phone}</td>
              <td>{u.role}</td>
              <td>
                {/* Boutons pour changer le rôle */}
                {u.role === "CLIENT" ? (
                  <button onClick={() => handleRoleChange(u.id, "ADMIN")}>Promouvoir Admin</button>
                ) : (
                  <button onClick={() => handleRoleChange(u.id, "CLIENT")}>Retrograder Client</button>
                )}
                <button onClick={() => handleDelete(u.id)}>Supprimer</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}