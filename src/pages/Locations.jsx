import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import {
  activateLocation,
  createLocation,
  deleteLocation,
  getLocations,
  updateLocation,
} from "../api/location.api";
import {
  deletePrintAgentAdmin,
  getPrintAgentsAdmin,
  getPrintPrintersAdmin,
  rotatePrintAgentTokenAdmin,
  upsertPrintAgentAdmin,
  upsertPrintPrinterAdmin,
} from "../api/admin.api";
import { ActionIconButton, DeleteIcon, EditIcon, StatusToggle } from "../components/ui/AdminActions";

const COUNTRY_OPTIONS = ["France", "Belgique", "Luxembourg", "Allemagne"];

const emptyLocationForm = {
  addressLine1: "",
  addressLine2: "",
  postalCode: "",
  city: "",
  country: "France",
  latitude: "",
  longitude: "",
  notes: "",
  active: true,
};

function normalizeLocationPayload(form) {
  const toNullableNumber = (value) => {
    if (value === "" || value === null || value === undefined) return null;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  };

  const city = form.city.trim();

  return {
    name: city,
    addressLine1: form.addressLine1.trim(),
    addressLine2: form.addressLine2.trim() || null,
    postalCode: form.postalCode.trim(),
    city,
    country: form.country.trim() || "France",
    latitude: toNullableNumber(form.latitude),
    longitude: toNullableNumber(form.longitude),
    notes: form.notes.trim() || null,
    active: Boolean(form.active),
  };
}

function formatLocation(location) {
  const parts = [
    location.addressLine1,
    location.addressLine2,
    `${location.postalCode || ""} ${location.city || ""}`.trim(),
    location.country,
  ].filter(Boolean);
  return parts.join(", ");
}

function formatDateTime(value, locale) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizePrinterRuntime(printer, agentStatus) {
  if (!printer?.isActive) return "INACTIVE";
  const runtime = String(printer?.runtime?.status || "").toUpperCase();
  if (runtime) return runtime;
  const agent = String(agentStatus || "").toUpperCase();
  if (agent === "OFFLINE") return "OFFLINE";
  if (agent === "DEGRADED") return "DEGRADED";
  if (agent === "ONLINE") return "ONLINE";
  return "UNKNOWN";
}

function computeTruckPrintStatus(agentStatus, printers) {
  const normalizedAgentStatus = String(agentStatus || "").toUpperCase();
  if (normalizedAgentStatus === "OFFLINE") return "OFFLINE";

  const activePrinters = (printers || []).filter((printer) => printer?.isActive);
  if (activePrinters.length === 0) {
    return (printers || []).length > 0 ? "INACTIVE" : "UNASSIGNED";
  }

  const statuses = activePrinters.map((printer) => normalizePrinterRuntime(printer, normalizedAgentStatus));
  if (statuses.some((status) => status === "OFFLINE")) return "OFFLINE";
  if (statuses.some((status) => status === "DEGRADED")) return "DEGRADED";
  if (statuses.every((status) => status === "ONLINE")) return "ONLINE";
  if (statuses.some((status) => status === "ONLINE")) return "DEGRADED";
  if (statuses.every((status) => status === "INACTIVE")) return "INACTIVE";
  return "UNKNOWN";
}

function statusBadgeClasses(status) {
  const normalized = String(status || "").toUpperCase();
  if (["ONLINE", "PRINTED", "READY"].includes(normalized)) {
    return "border-emerald-300/40 bg-emerald-500/15 text-emerald-200";
  }
  if (["DEGRADED", "PENDING", "RETRY_WAITING", "CLAIMED", "PRINTING"].includes(normalized)) {
    return "border-amber-300/40 bg-amber-500/15 text-amber-200";
  }
  if (["UNASSIGNED", "INACTIVE", "UNKNOWN"].includes(normalized)) {
    return "border-stone-300/40 bg-stone-500/15 text-stone-200";
  }
  return "border-red-300/40 bg-red-500/15 text-red-200";
}

function formatStatusLabel(status, tr) {
  const normalized = String(status || "").toUpperCase();
  if (normalized === "ONLINE") return tr("En ligne", "Online");
  if (normalized === "DEGRADED") return tr("Degrade", "Degraded");
  if (normalized === "OFFLINE") return tr("Hors ligne", "Offline");
  if (normalized === "UNASSIGNED") return tr("Non assigne", "Unassigned");
  if (normalized === "INACTIVE") return tr("Inactif", "Inactive");
  if (normalized === "UNKNOWN") return tr("Inconnu", "Unknown");
  return tr("Inconnu", "Unknown");
}

function getLinkedLocationInfo(printers, tr) {
  const locationMap = new Map();

  for (const printer of printers || []) {
    if (printer?.location?.id) {
      locationMap.set(String(printer.location.id), printer.location.name || String(printer.location.id));
    }
  }

  const ids = Array.from(locationMap.keys());
  if (ids.length === 0) {
    return {
      label: tr("Global", "Global"),
      selectValue: "",
    };
  }

  if (ids.length === 1) {
    return {
      label: locationMap.get(ids[0]),
      selectValue: ids[0],
    };
  }

  return {
    label: Array.from(locationMap.values()).join(", "),
    selectValue: "__MULTI__",
  };
}

export default function Locations() {
  const { token, user, loading: authLoading } = useContext(AuthContext);
  const { tr, locale } = useLanguage();

  const [locations, setLocations] = useState([]);
  const [newLocation, setNewLocation] = useState(emptyLocationForm);
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editLocation, setEditLocation] = useState(emptyLocationForm);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [printAgents, setPrintAgents] = useState([]);
  const [printPrinters, setPrintPrinters] = useState([]);
  const [showTruckForm, setShowTruckForm] = useState(false);
  const [truckForm, setTruckForm] = useState({
    code: "",
    name: "",
    locationId: "",
  });
  const [truckBusy, setTruckBusy] = useState({});
  const [truckTokenInfo, setTruckTokenInfo] = useState(null);

  const locationOptions = useMemo(() => {
    const map = new Map();
    for (const location of locations) {
      if (!map.has(location.id)) {
        map.set(location.id, location);
      }
    }
    return Array.from(map.values());
  }, [locations]);

  const fetchLocations = useCallback(async () => {
    try {
      const data = await getLocations();
      setLocations(data);
    } catch (err) {
      setMessage(err.response?.data?.error || tr("Erreur lors du chargement des emplacements", "Error while loading locations"));
    }
  }, [tr]);

  const fetchPrintResources = useCallback(async () => {
    if (!token || user?.role !== "ADMIN") return;
    try {
      const [agents, printers] = await Promise.all([
        getPrintAgentsAdmin(token),
        getPrintPrintersAdmin(token),
      ]);
      setPrintAgents(Array.isArray(agents) ? agents : []);
      setPrintPrinters(Array.isArray(printers) ? printers : []);
    } catch (err) {
      setMessage(err.response?.data?.error || tr("Erreur lors du chargement des camions", "Error while loading trucks"));
    }
  }, [token, user, tr]);

  useEffect(() => {
    if (authLoading) return;
    if (!token || user?.role !== "ADMIN") return;
    fetchLocations();
    fetchPrintResources();
  }, [authLoading, token, user, fetchLocations, fetchPrintResources]);

  const setTruckBusyFlag = (key, value) => {
    setTruckBusy((prev) => ({ ...prev, [key]: value }));
  };

  const applyTruckLocationLink = async (agentCode, locationId, { silentNoPrinter = false, skipRefresh = false } = {}) => {
    const targetPrinters = (printPrinters || []).filter((printer) => printer?.agent?.code === agentCode);
    if (targetPrinters.length === 0) {
      if (!silentNoPrinter) {
        setMessage(
          tr(
            "Aucune imprimante liee a ce camion. Configure une imprimante dans /admin/print.",
            "No printer linked to this truck. Configure one in /admin/print."
          )
        );
      }
      return false;
    }

    for (const printer of targetPrinters) {
      // eslint-disable-next-line no-await-in-loop
      await upsertPrintPrinterAdmin(token, {
        code: printer.code,
        name: printer.name,
        model: printer.model || null,
        paperWidthMm: Number(printer.paperWidthMm || 80),
        connectionType: printer.connectionType || "ETHERNET",
        ipAddress: printer.ipAddress || null,
        port: Number(printer.port || 9100),
        isActive: Boolean(printer.isActive),
        agentCode,
        locationId: locationId === "" ? null : Number(locationId),
      });
    }

    if (!skipRefresh) {
      await fetchPrintResources();
    }
    return true;
  };

  const handleCreate = async (event) => {
    event.preventDefault();

    if (
      !newLocation.addressLine1.trim() ||
      !newLocation.postalCode.trim() ||
      !newLocation.city.trim()
    ) {
      setMessage(
        tr(
          "Adresse, code postal et ville sont obligatoires",
          "Address, postal code and city are required"
        )
      );
      return;
    }

    try {
      setLoading(true);
      await createLocation(token, normalizeLocationPayload(newLocation));
      setNewLocation(emptyLocationForm);
      setShowLocationForm(false);
      setMessage("");
      await fetchLocations();
    } catch (err) {
      setMessage(err.response?.data?.error || tr("Erreur lors de la creation", "Error while creating"));
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (location) => {
    setEditingId(location.id);
    setEditLocation({
      ...emptyLocationForm,
      ...location,
      latitude: location.latitude ?? "",
      longitude: location.longitude ?? "",
      addressLine2: location.addressLine2 ?? "",
      notes: location.notes ?? "",
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditLocation(emptyLocationForm);
  };

  const handleUpdate = async () => {
    if (
      !editLocation.addressLine1.trim() ||
      !editLocation.postalCode.trim() ||
      !editLocation.city.trim()
    ) {
      setMessage(
        tr(
          "Adresse, code postal et ville sont obligatoires",
          "Address, postal code and city are required"
        )
      );
      return;
    }

    try {
      setLoading(true);
      await updateLocation(token, editingId, normalizeLocationPayload(editLocation));
      setMessage("");
      cancelEditing();
      await fetchLocations();
    } catch (err) {
      setMessage(err.response?.data?.error || tr("Erreur lors de la mise a jour", "Error while updating"));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (location) => {
    try {
      await activateLocation(token, location.id, !location.active);
      await fetchLocations();
    } catch (err) {
      setMessage(err.response?.data?.error || tr("Erreur lors du changement de statut", "Error while changing status"));
    }
  };

  const handleDelete = async (locationId) => {
    if (!window.confirm(tr("Supprimer cet emplacement ?", "Delete this location?"))) return;

    try {
      await deleteLocation(token, locationId);
      await fetchLocations();
    } catch (err) {
      setMessage(err.response?.data?.error || tr("Erreur lors de la suppression", "Error while deleting"));
    }
  };

  const handleCreateTruck = async (event) => {
    event.preventDefault();
    if (!truckForm.code.trim() || !truckForm.name.trim()) {
      setMessage(tr("Code et nom camion obligatoires", "Truck code and name are required"));
      return;
    }

    const busyKey = "create-truck";
    setTruckBusyFlag(busyKey, true);
    try {
      const normalizedCode = truckForm.code.trim();
      const result = await upsertPrintAgentAdmin(token, {
        code: normalizedCode,
        name: truckForm.name.trim(),
      });

      if (result?.token) {
        setTruckTokenInfo({
          code: normalizedCode,
          token: result.token,
        });
      }

      await fetchPrintResources();

      let feedback = tr("Camion enregistre", "Truck saved");
      if (truckForm.locationId !== "") {
        const linked = await applyTruckLocationLink(normalizedCode, truckForm.locationId, {
          silentNoPrinter: true,
          skipRefresh: true,
        });
        if (linked) {
          feedback = tr("Camion enregistre et lie a l'emplacement", "Truck saved and linked to location");
        } else {
          feedback = tr(
            "Camion enregistre. L'emplacement sera applique une fois une imprimante liee.",
            "Truck saved. Location will be applied once a printer is linked."
          );
        }
        await fetchPrintResources();
      }

      setMessage(feedback);
      setTruckForm({ code: "", name: "", locationId: "" });
      setShowTruckForm(false);
    } catch (err) {
      setMessage(err.response?.data?.error || tr("Erreur creation camion", "Truck creation error"));
    } finally {
      setTruckBusyFlag(busyKey, false);
    }
  };

  const handleDeleteTruck = async (agentCode) => {
    if (!window.confirm(tr("Supprimer ce camion ?", "Delete this truck?"))) return;
    const busyKey = `delete-truck:${agentCode}`;
    setTruckBusyFlag(busyKey, true);
    try {
      await deletePrintAgentAdmin(token, agentCode);
      setMessage(tr("Camion supprime", "Truck deleted"));
      await fetchPrintResources();
    } catch (err) {
      setMessage(err.response?.data?.error || tr("Erreur suppression camion", "Truck deletion error"));
    } finally {
      setTruckBusyFlag(busyKey, false);
    }
  };

  const handleRotateTruckToken = async (agentCode) => {
    const busyKey = `rotate-truck:${agentCode}`;
    setTruckBusyFlag(busyKey, true);
    try {
      const result = await rotatePrintAgentTokenAdmin(token, agentCode);
      if (result?.token) {
        setTruckTokenInfo({
          code: agentCode,
          token: result.token,
        });
      }
      setMessage(tr("Nouveau token genere", "New token generated"));
    } catch (err) {
      setMessage(err.response?.data?.error || tr("Erreur rotation token camion", "Truck token rotation error"));
    } finally {
      setTruckBusyFlag(busyKey, false);
    }
  };

  const handleLinkTruckToLocation = async (agentCode, locationId) => {
    const busyKey = `link-truck:${agentCode}`;
    setTruckBusyFlag(busyKey, true);
    try {
      const linked = await applyTruckLocationLink(agentCode, locationId);
      if (linked) {
        setMessage(tr("Camion lie a l'emplacement", "Truck linked to location"));
      }
    } catch (err) {
      setMessage(err.response?.data?.error || tr("Erreur liaison camion/emplacement", "Truck/location link error"));
    } finally {
      setTruckBusyFlag(busyKey, false);
    }
  };

  if (authLoading) return <p>{tr("Chargement...", "Loading...")}</p>;
  if (!token || user?.role !== "ADMIN") return <p>{tr("Acces refuse : administrateur uniquement", "Access denied: admin only")}</p>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">{tr("Camions & adresses", "Trucks & addresses")}</h2>
      {message && (
        <p className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-stone-100">{message}</p>
      )}

      {truckTokenInfo?.token && (
        <div className="rounded-lg border border-sky-300/40 bg-sky-500/10 p-2 text-sm text-sky-100">
          <p className="font-semibold">{tr("Token PI (affiche apres creation/rotation)", "Pi token (shown after create/rotate)")}</p>
          <p className="mt-1 break-all font-mono text-xs">
            {truckTokenInfo.code}: {truckTokenInfo.token}
          </p>
        </div>
      )}

      <section className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-saffron">
            {tr("Gestion emplacement", "Address management")}
          </h3>
          <button
            type="button"
            onClick={() => setShowLocationForm((prev) => !prev)}
            className="rounded-lg border border-emerald-300/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-200"
          >
            {showLocationForm
              ? tr("Fermer le formulaire", "Close form")
              : tr("Ajouter un emplacement", "Add address")}
          </button>
        </div>

        {showLocationForm && (
          <form onSubmit={handleCreate} className="grid gap-2 md:grid-cols-2">
            <input
              placeholder={tr("Adresse", "Address")}
              value={newLocation.addressLine1}
              onChange={(event) =>
                setNewLocation((prev) => ({ ...prev, addressLine1: event.target.value }))
              }
              className="rounded-lg border border-white/20 bg-charcoal/70 px-3 py-2 text-sm text-stone-100"
            />
            <input
              placeholder={tr("Complement d'adresse", "Address line 2")}
              value={newLocation.addressLine2}
              onChange={(event) =>
                setNewLocation((prev) => ({ ...prev, addressLine2: event.target.value }))
              }
              className="rounded-lg border border-white/20 bg-charcoal/70 px-3 py-2 text-sm text-stone-100"
            />
            <input
              placeholder={tr("Code postal", "Postal code")}
              value={newLocation.postalCode}
              onChange={(event) =>
                setNewLocation((prev) => ({ ...prev, postalCode: event.target.value }))
              }
              className="rounded-lg border border-white/20 bg-charcoal/70 px-3 py-2 text-sm text-stone-100"
            />
            <input
              placeholder={tr("Ville", "City")}
              value={newLocation.city}
              onChange={(event) =>
                setNewLocation((prev) => ({ ...prev, city: event.target.value }))
              }
              className="rounded-lg border border-white/20 bg-charcoal/70 px-3 py-2 text-sm text-stone-100"
            />
            <select
              value={newLocation.country}
              onChange={(event) =>
                setNewLocation((prev) => ({ ...prev, country: event.target.value }))
              }
              className="rounded-lg border border-white/20 bg-charcoal/70 px-3 py-2 text-sm text-stone-100 md:col-span-2"
            >
              {COUNTRY_OPTIONS.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
            <button type="submit" disabled={loading} className="rounded-lg border border-saffron/40 bg-saffron/15 px-3 py-2 text-xs font-semibold text-saffron md:col-span-2">
              {tr("Creer", "Create")}
            </button>
          </form>
        )}

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-stone-400">
                <th className="pb-2">{tr("Nom", "Name")}</th>
                <th className="pb-2">{tr("Adresse", "Address")}</th>
                <th className="pb-2">{tr("Actif", "Active")}</th>
                <th className="pb-2">{tr("Actions", "Actions")}</th>
              </tr>
            </thead>
            <tbody>
              {locations.length === 0 && (
                <tr>
                  <td colSpan="4" className="py-2 text-stone-400">{tr("Aucun emplacement", "No address")}</td>
                </tr>
              )}
              {locations.map((location) => (
                <tr key={location.id} className="border-t border-white/10">
                  <td className="py-2 text-stone-100">{location.name}</td>
                  <td className="py-2 text-stone-300">{formatLocation(location)}</td>
                  <td className="py-2 text-stone-100">{location.active ? tr("Oui", "Yes") : tr("Non", "No")}</td>
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <ActionIconButton onClick={() => startEditing(location)} label={tr("Modifier", "Edit")}>
                        <EditIcon />
                      </ActionIconButton>
                      <StatusToggle
                        checked={location.active}
                        onChange={() => handleToggleActive(location)}
                        labelOn={tr("Desactiver", "Disable")}
                        labelOff={tr("Activer", "Enable")}
                      />
                      <ActionIconButton onClick={() => handleDelete(location.id)} label={tr("Supprimer", "Delete")} variant="danger">
                        <DeleteIcon />
                      </ActionIconButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-saffron">
            {tr("Gestion camions", "Truck management")}
          </h3>
          <button
            type="button"
            onClick={() => setShowTruckForm((prev) => !prev)}
            className="rounded-lg border border-emerald-300/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-200"
          >
            {showTruckForm ? tr("Fermer le formulaire", "Close form") : tr("Ajouter un camion", "Add truck")}
          </button>
        </div>

        {showTruckForm && (
          <form onSubmit={handleCreateTruck} className="grid gap-2 md:grid-cols-3">
            <div className="grid gap-2 md:col-span-2 md:grid-cols-2">
              <input
                placeholder="pizza_truck_00"
                value={truckForm.code}
                onChange={(event) => setTruckForm((prev) => ({ ...prev, code: event.target.value }))}
                className="rounded-lg border border-white/20 bg-charcoal/70 px-3 py-2 text-sm text-stone-100"
              />
              <input
                placeholder="Pi Camion 00"
                value={truckForm.name}
                onChange={(event) => setTruckForm((prev) => ({ ...prev, name: event.target.value }))}
                className="rounded-lg border border-white/20 bg-charcoal/70 px-3 py-2 text-sm text-stone-100"
              />
            </div>
            <select
              value={truckForm.locationId}
              onChange={(event) => setTruckForm((prev) => ({ ...prev, locationId: event.target.value }))}
              className="rounded-lg border border-white/20 bg-charcoal/70 px-3 py-2 text-sm text-stone-100"
            >
              <option value="">{tr("Global", "Global")}</option>
              {locationOptions.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
            <button type="submit" disabled={truckBusy["create-truck"]} className="rounded-lg border border-saffron/40 bg-saffron/15 px-3 py-2 text-xs font-semibold text-saffron md:col-span-3">
              {tr("Creer camion", "Create truck")}
            </button>
          </form>
        )}

        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-stone-400">
                <th className="pb-2">{tr("Nom camion", "Truck name")}</th>
                <th className="pb-2">{tr("Etat PI", "PI status")}</th>
                <th className="pb-2">{tr("Etat impression", "Print status")}</th>
                <th className="pb-2">{tr("Dernier signal", "Latest signal")}</th>
                <th className="pb-2">{tr("Selection emplacement", "Location selection")}</th>
                <th className="pb-2">{tr("Token", "Token")}</th>
                <th className="pb-2">{tr("Supprimer", "Delete")}</th>
              </tr>
            </thead>
            <tbody>
              {printAgents.length === 0 && (
                <tr>
                  <td colSpan="7" className="py-2 text-stone-400">{tr("Aucun camion", "No truck")}</td>
                </tr>
              )}
              {printAgents.map((agent) => {
                const agentPrinters = (printPrinters || []).filter((printer) => printer?.agent?.code === agent.code);
                const printStatus = computeTruckPrintStatus(agent.status, agentPrinters);
                const linkedLocationInfo = getLinkedLocationInfo(agentPrinters, tr);
                const isLinking = truckBusy[`link-truck:${agent.code}`];
                const isRotating = truckBusy[`rotate-truck:${agent.code}`];
                const isDeleting = truckBusy[`delete-truck:${agent.code}`];

                return (
                  <tr key={agent.id} className="border-t border-white/10">
                    <td className="py-2 text-stone-100">
                      <span className="font-medium">{agent.name}</span>
                      <span className="ml-2 text-xs text-stone-400">({agent.code})</span>
                    </td>
                    <td className="py-2">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${statusBadgeClasses(agent.status)}`}>
                        {formatStatusLabel(agent.status, tr)}
                      </span>
                    </td>
                    <td className="py-2">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${statusBadgeClasses(printStatus)}`}>
                        {formatStatusLabel(printStatus, tr)}
                      </span>
                    </td>
                    <td className="py-2 text-xs text-stone-300">
                      {formatDateTime(agent.lastHeartbeatAt, locale)}
                    </td>
                    <td className="py-2">
                      <select
                        value={linkedLocationInfo.selectValue}
                        onChange={(event) => {
                          const value = event.target.value;
                          if (value === "__MULTI__") return;
                          handleLinkTruckToLocation(agent.code, value);
                        }}
                        disabled={isLinking}
                        className="rounded-lg border border-white/20 bg-charcoal/70 px-2 py-1.5 text-xs text-stone-100"
                      >
                        {linkedLocationInfo.selectValue === "__MULTI__" && (
                          <option value="__MULTI__" disabled>
                            {tr("Multiple", "Multiple")}
                          </option>
                        )}
                        <option value="">{tr("Global", "Global")}</option>
                        {locationOptions.map((location) => (
                          <option key={location.id} value={location.id}>
                            {location.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2">
                      <button
                        type="button"
                        onClick={() => handleRotateTruckToken(agent.code)}
                        disabled={isRotating}
                        className="rounded-lg border border-sky-300/40 bg-sky-500/10 px-3 py-1.5 text-xs font-semibold text-sky-200 disabled:opacity-60"
                      >
                        {tr("Generer token", "Generate token")}
                      </button>
                    </td>
                    <td className="py-2">
                      <ActionIconButton
                        onClick={() => handleDeleteTruck(agent.code)}
                        label={tr("Supprimer", "Delete")}
                        variant="danger"
                        disabled={isDeleting}
                      >
                        <DeleteIcon />
                      </ActionIconButton>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {editingId && (
        <section className="rounded-xl border border-white/10 bg-white/5 p-4">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-saffron">
            {tr("Modifier l'emplacement", "Edit address")}
          </h3>
          <div className="grid gap-2 md:grid-cols-2">
            <input
              placeholder={tr("Adresse", "Address")}
              value={editLocation.addressLine1}
              onChange={(event) =>
                setEditLocation((prev) => ({ ...prev, addressLine1: event.target.value }))
              }
              className="rounded-lg border border-white/20 bg-charcoal/70 px-3 py-2 text-sm text-stone-100"
            />
            <input
              placeholder={tr("Complement d'adresse", "Address line 2")}
              value={editLocation.addressLine2}
              onChange={(event) =>
                setEditLocation((prev) => ({ ...prev, addressLine2: event.target.value }))
              }
              className="rounded-lg border border-white/20 bg-charcoal/70 px-3 py-2 text-sm text-stone-100"
            />
            <input
              placeholder={tr("Code postal", "Postal code")}
              value={editLocation.postalCode}
              onChange={(event) =>
                setEditLocation((prev) => ({ ...prev, postalCode: event.target.value }))
              }
              className="rounded-lg border border-white/20 bg-charcoal/70 px-3 py-2 text-sm text-stone-100"
            />
            <input
              placeholder={tr("Ville", "City")}
              value={editLocation.city}
              onChange={(event) =>
                setEditLocation((prev) => ({ ...prev, city: event.target.value }))
              }
              className="rounded-lg border border-white/20 bg-charcoal/70 px-3 py-2 text-sm text-stone-100"
            />
            <select
              value={editLocation.country}
              onChange={(event) =>
                setEditLocation((prev) => ({ ...prev, country: event.target.value }))
              }
              className="rounded-lg border border-white/20 bg-charcoal/70 px-3 py-2 text-sm text-stone-100"
            >
              {COUNTRY_OPTIONS.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
            <label className="inline-flex items-center gap-2 text-sm text-stone-100">
              <input
                type="checkbox"
                checked={editLocation.active}
                onChange={(event) =>
                  setEditLocation((prev) => ({ ...prev, active: event.target.checked }))
                }
              />
              {tr("Actif", "Active")}
            </label>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleUpdate}
              disabled={loading}
              className="rounded-lg border border-saffron/40 bg-saffron/15 px-3 py-2 text-xs font-semibold text-saffron"
            >
              {tr("Sauvegarder", "Save")}
            </button>
            <button
              type="button"
              onClick={cancelEditing}
              className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-xs font-semibold text-stone-200"
            >
              {tr("Annuler", "Cancel")}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
