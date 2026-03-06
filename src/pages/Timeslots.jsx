import { useEffect, useState, useContext, useCallback } from "react";
import { AuthContext } from "../context/AuthContext";
import {
  getAllTimeSlots,
  createTimeSlotsBatch,
  activateTimeSlot,
  deleteTimeSlot
} from "../api/timeslot.api";

export default function TimeslotsAdmin() {
  const { token } = useContext(AuthContext);

  const [slots, setSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [form, setForm] = useState({
    serviceDate: new Date().toISOString().split("T")[0],
    startTime: "18:00",
    endTime: "22:00",
    duration: 15,
    maxPizzas: 10
  });
  const [loading, setLoading] = useState(false);

  // --- Récupère les créneaux pour la date sélectionnée ---
  const fetchSlots = useCallback(async (date = selectedDate) => {
    try {
      const allSlots = await getAllTimeSlots(token);
      const filtered = allSlots.filter(
        (s) => new Date(s.serviceDate).toDateString() === new Date(date).toDateString()
      );
      setSlots(filtered);
    } catch (err) {
      console.error(err);
      alert("Impossible de récupérer les créneaux");
    }
  }, [token, selectedDate]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  // --- Changer la date (flèches) ---
  const changeDate = (delta) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + delta);
    setSelectedDate(newDate);
    setForm({ ...form, serviceDate: newDate.toISOString().split("T")[0] });
  };

  // --- Création de batch ---
  const handleCreateBatch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createTimeSlotsBatch(token, form);
      alert("Créneaux créés !");
      fetchSlots();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || err.message);
    }
    setLoading(false);
  };

  // --- Activer / désactiver ---
  const handleToggleActive = async (slot) => {
    try {
      await activateTimeSlot(token, slot.id, !slot.active);
      fetchSlots();
    } catch (err) { console.error(err); }
  };

  // --- Supprimer un créneau ---
  const handleDelete = async (slot) => {
    if (!window.confirm("Supprimer ce créneau ?")) return;
    try {
      await deleteTimeSlot(token, slot.id);
      fetchSlots();
    } catch (err) { console.error(err); }
  };

  // --- Supprimer tous les créneaux de la date sélectionnée ---
  const handleDeleteAllOfDate = async () => {
    if (!window.confirm(`Supprimer tous les créneaux du ${selectedDate.toLocaleDateString()} ?`)) return;
    try {
      for (const slot of slots) {
        await deleteTimeSlot(token, slot.id);
      }
      fetchSlots();
      alert("Tous les créneaux de la date ont été supprimés !");
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la suppression des créneaux");
    }
  };

  return (
    <div>
      <h2>Gestion des créneaux</h2>

      {/* Formulaire création batch */}
      <form onSubmit={handleCreateBatch} style={{ marginBottom: 20 }}>
        <h3>Créer des créneaux automatiques</h3>
        <label>
          Date du service:
          <input
            type="date"
            value={form.serviceDate}
            onChange={e => {
              setForm({ ...form, serviceDate: e.target.value });
              setSelectedDate(new Date(e.target.value));
            }}
            required
          />
        </label>
        <label>
          Heure ouverture:
          <input type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} required />
        </label>
        <label>
          Heure fermeture:
          <input type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} required />
        </label>
        <label>
          Durée créneau (min):
          <input type="number" min="5" value={form.duration} onChange={e => setForm({ ...form, duration: parseInt(e.target.value) })} required />
        </label>
        <label>
          Max pizzas par créneau:
          <input type="number" min="1" value={form.maxPizzas} onChange={e => setForm({ ...form, maxPizzas: parseInt(e.target.value) })} required />
        </label>
        <button type="submit" disabled={loading}>Créer les créneaux</button>
      </form>

      {/* Navigation de date */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
        <button onClick={() => changeDate(-1)}>&lt;</button>
        <span style={{ margin: "0 10px", fontWeight: "bold" }}>
          {selectedDate.toLocaleDateString()}
        </span>
        <button onClick={() => changeDate(1)}>&gt;</button>
      </div>

      {/* Bouton supprimer tous les créneaux du jour */}
      <div style={{ marginBottom: 20 }}>
        {slots.length > 0 && (
          <button style={{ background: "red", color: "white", padding: "5px 10px" }} onClick={handleDeleteAllOfDate}>
            Supprimer tous les créneaux de cette date
          </button>
        )}
      </div>

      {/* Tableau des créneaux */}
      <table border="1" cellPadding="5">
        <thead>
          <tr>
            <th>Heure</th>
            <th>Commandes</th>
            <th>Actif</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {slots.length === 0 && (
            <tr>
              <td colSpan="4" style={{ textAlign: "center" }}>Aucun créneau pour cette date</td>
            </tr>
          )}
          {slots.map(slot => (
            <tr key={slot.id}>
              <td>{new Date(slot.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
              <td>{slot.currentPizzas}/{slot.maxPizzas}</td>
              <td>{slot.active ? "Oui" : "Non"}</td>
              <td>
                <button onClick={() => handleToggleActive(slot)}>{slot.active ? "Désactiver" : "Activer"}</button>
                <button onClick={() => handleDelete(slot)}>Supprimer</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}