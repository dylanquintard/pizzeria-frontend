import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Link } from "react-router-dom";
import {
  getAllPizzas,
  createPizza,
  updatePizza,
  deletePizza
} from "../api/admin.api";

export default function Pizzas() {
  const { token, user, loading: authLoading } = useContext(AuthContext);
  const [pizzas, setPizzas] = useState([]);
  const [message, setMessage] = useState("");
  const [newPizza, setNewPizza] = useState({ name: "", description: "", basePrice: "" });

  useEffect(() => {
    if (authLoading || !user || !token) return;
    if (user.role !== "ADMIN") {
      setMessage("Accès refusé : administrateur uniquement");
      return;
    }

    async function fetchPizzas() {
      try {
        const data = await getAllPizzas(token);
        // Ajouter un état editPrice à chaque pizza
        setPizzas(data.map(p => ({ ...p, editPrice: false, tempPrice: p.basePrice })));
      } catch (err) {
        setMessage(err.response?.data?.error || "Erreur lors du chargement des pizzas");
      }
    }

    fetchPizzas();
  }, [authLoading, token, user]);

  const handleCreate = async () => {
    try {
      const pizza = await createPizza(token, newPizza);
      setPizzas([...pizzas, { ...pizza, editPrice: false, tempPrice: pizza.basePrice }]);
      setNewPizza({ name: "", description: "", basePrice: "" });
    } catch (err) {
      setMessage(err.response?.data?.error || "Erreur lors de la création");
    }
  };

  const toggleEdit = (id) => {
    setPizzas(pizzas.map(p => p.id === id ? { ...p, editPrice: !p.editPrice } : p));
  };

  const handleSavePrice = async (id, tempPrice) => {
    try {
      const updated = await updatePizza(token, id, { basePrice: tempPrice });
      setPizzas(pizzas.map(p => p.id === id ? { ...updated, editPrice: false, tempPrice: updated.basePrice } : p));
    } catch (err) {
      setMessage(err.response?.data?.error || "Erreur lors de la mise à jour du prix");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deletePizza(token, id);
      setPizzas(pizzas.filter(p => p.id !== id));
    } catch (err) {
      setMessage(err.response?.data?.error || "Erreur lors de la suppression");
    }
  };

  if (authLoading) return <p>Chargement...</p>;

  return (
    <div>
      <h2>Pizzas</h2>
      {message && <p>{message}</p>}

      <h3>Ajouter une pizza</h3>
      <input
        placeholder="Nom"
        value={newPizza.name}
        onChange={e => setNewPizza({...newPizza, name: e.target.value})}
      />
      <input
        placeholder="Description"
        value={newPizza.description}
        onChange={e => setNewPizza({...newPizza, description: e.target.value})}
      />
      <input
        type="number"
        placeholder="Prix"
        value={newPizza.basePrice}
        onChange={e => setNewPizza({...newPizza, basePrice: e.target.value})}
      />
      <button onClick={handleCreate}>Créer</button>

      <h3>Liste des pizzas</h3>
      <table>
        <thead>
          <tr>
            <th>ID</th><th>Nom</th><th>Description</th><th>Prix</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {pizzas.map(p => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>{p.name}</td>
              <td>{p.description}</td>
              <td>
                {p.editPrice ? (
                  <input
                    type="number"
                    value={p.tempPrice}
                    onChange={e => setPizzas(pizzas.map(px => px.id === p.id ? { ...px, tempPrice: e.target.value } : px))}
                  />
                ) : (
                  p.basePrice
                )}
              </td>
              <td>
                {p.editPrice ? (
                  <button onClick={() => handleSavePrice(p.id, p.tempPrice)}>Sauvegarder</button>
                ) : (
                  <button onClick={() => toggleEdit(p.id)}>Modifier le prix</button>
                )}
                <Link to={`/admin/editpizza/${p.id}`}>
                  <button>Composition</button>
                </Link>
                <button onClick={() => handleDelete(p.id)}>Supprimer</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}