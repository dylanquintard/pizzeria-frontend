import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteUser, getAllUsers, updateUserRole } from "../api/admin.api";
import { AuthContext } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { ActionIconButton, DeleteIcon } from "../components/ui/AdminActions";
import { splitPersonName } from "../utils/personName";

export default function Users() {
  const { user, token, loading: authLoading } = useContext(AuthContext);
  const { tr } = useLanguage();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredUsers = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) return users;

    return users.filter((entry) => {
      const parsedName = splitPersonName(entry);
      const fields = [entry.name, parsedName.firstName, parsedName.lastName, entry.email, entry.phone]
        .map((value) => String(value || "").toLowerCase());

      return fields.some((value) => value.includes(normalizedQuery));
    });
  }, [users, searchQuery]);

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
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white">{tr("Liste des utilisateurs", "Users list")}</h2>
      {message && (
        <p className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-stone-200">{message}</p>
      )}

      <div className="grid gap-2 sm:max-w-md">
        <label htmlFor="users-search" className="text-xs font-semibold uppercase tracking-wide text-stone-300">
          {tr("Recherche client", "Customer search")}
        </label>
        <input
          id="users-search"
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder={tr(
            "Rechercher par nom, email ou telephone",
            "Search by name, email, or phone"
          )}
        />
      </div>

      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>{tr("Prenom", "First name")}</th>
              <th>{tr("Nom", "Last name")}</th>
              <th>{tr("Email", "Email")}</th>
              <th>{tr("Telephone", "Phone")}</th>
              <th>{tr("Role", "Role")}</th>
              <th>{tr("Actions", "Actions")}</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6}>{tr("Aucun utilisateur trouve.", "No users found.")}</td>
              </tr>
            ) : (
              filteredUsers.map((entry) => {
                const parsedName = splitPersonName(entry);

                return (
                <tr key={entry.id}>
                  <td>{parsedName.firstName || "-"}</td>
                  <td>{parsedName.lastName || "-"}</td>
                  <td>{entry.email}</td>
                  <td>{entry.phone}</td>
                  <td>{entry.role}</td>
                  <td>
                    <div className="flex min-w-[220px] flex-wrap gap-2">
                      {entry.role === "CLIENT" ? (
                        <button onClick={() => handleRoleChange(entry.id, "ADMIN")}>
                          {tr("Promouvoir admin", "Promote to admin")}
                        </button>
                      ) : (
                        <button onClick={() => handleRoleChange(entry.id, "CLIENT")}>
                          {tr("Retrograder client", "Demote to client")}
                        </button>
                      )}
                      <ActionIconButton
                        onClick={() => handleDelete(entry.id)}
                        label={tr("Supprimer utilisateur", "Delete user")}
                        variant="danger"
                      >
                        <DeleteIcon />
                      </ActionIconButton>
                    </div>
                  </td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
