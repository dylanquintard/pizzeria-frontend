import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteUser, getAllUsers, updateUserRole } from "../api/admin.api";
import { AuthContext } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

export default function Users() {
  const { user, token, loading: authLoading } = useContext(AuthContext);
  const { tr } = useLanguage();
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
      setMessage(tr("Acces refuse : administrateur uniquement", "Access denied: admin only"));
      return;
    }

    async function fetchUsers() {
      try {
        const data = await getAllUsers(token);
        setUsers(Array.isArray(data) ? data : []);
      } catch (err) {
        setMessage(err.response?.data?.error || tr("Erreur lors du chargement des utilisateurs", "Error while loading users"));
      }
    }

    fetchUsers();
  }, [authLoading, token, user, navigate, tr]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      const updatedUser = await updateUserRole(token, userId, newRole);
      setUsers((prev) => prev.map((entry) => (entry.id === userId ? updatedUser : entry)));
      setMessage(tr("Role mis a jour avec succes.", "Role updated successfully."));
    } catch (err) {
      setMessage(err.response?.data?.error || tr("Erreur lors de la mise a jour du role", "Error while updating role"));
    }
  };

  const handleDelete = async (userId) => {
    try {
      await deleteUser(token, userId);
      setUsers((prev) => prev.filter((entry) => entry.id !== userId));
      setMessage(tr("Utilisateur supprime.", "User deleted."));
    } catch (err) {
      setMessage(err.response?.data?.error || tr("Erreur lors de la suppression", "Error while deleting"));
    }
  };

  if (authLoading) return <p>{tr("Chargement du contexte utilisateur...", "Loading user context...")}</p>;

  return (
    <div>
      <h2>{tr("Liste des utilisateurs", "Users list")}</h2>
      {message && <p>{message}</p>}

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>{tr("Nom", "Name")}</th>
            <th>{tr("Email", "Email")}</th>
            <th>{tr("Telephone", "Phone")}</th>
            <th>{tr("Role", "Role")}</th>
            <th>{tr("Actions", "Actions")}</th>
          </tr>
        </thead>
        <tbody>
          {users.map((entry) => (
            <tr key={entry.id}>
              <td>{entry.id}</td>
              <td>{entry.name}</td>
              <td>{entry.email}</td>
              <td>{entry.phone}</td>
              <td>{entry.role}</td>
              <td>
                {entry.role === "CLIENT" ? (
                  <button onClick={() => handleRoleChange(entry.id, "ADMIN")}>
                    {tr("Promouvoir admin", "Promote to admin")}
                  </button>
                ) : (
                  <button onClick={() => handleRoleChange(entry.id, "CLIENT")}>
                    {tr("Retrograder client", "Demote to client")}
                  </button>
                )}
                <button onClick={() => handleDelete(entry.id)}>{tr("Supprimer", "Delete")}</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
