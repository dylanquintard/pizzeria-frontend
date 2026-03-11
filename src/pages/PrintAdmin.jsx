import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import {
  deletePrintPrinterAdmin,
  getPrintAgentsAdmin,
  getPrintOverviewAdmin,
  getPrintPrintersAdmin,
  runPrintSchedulerTickAdmin,
  upsertPrintPrinterAdmin,
} from "../api/admin.api";
import { ActionIconButton, DeleteIcon, EditIcon } from "../components/ui/AdminActions";

const AUTO_REFRESH_MS = 10_000;

const initialPrinterForm = {
  name: "",
  code: "",
  ipAddress: "",
  agentCode: "",
};

function statusBadge(status) {
  const normalized = String(status || "").toUpperCase();
  if (["ONLINE", "PRINTED", "READY"].includes(normalized)) {
    return "bg-emerald-500/20 text-emerald-200 border-emerald-300/40";
  }
  if (["DEGRADED", "RETRY_WAITING", "CLAIMED", "PRINTING", "PENDING"].includes(normalized)) {
    return "bg-amber-500/20 text-amber-200 border-amber-300/40";
  }
  return "bg-red-500/20 text-red-200 border-red-300/40";
}

function formatPrinterRuntimeLabel(runtimeStatus, tr) {
  const normalized = String(runtimeStatus || "UNKNOWN").toUpperCase();
  if (normalized === "ONLINE") return tr("Connectee", "Connected");
  if (normalized === "DEGRADED") return tr("Degradee", "Degraded");
  if (normalized === "OFFLINE") return tr("Hors ligne", "Offline");
  if (normalized === "INACTIVE") return tr("Inactive", "Inactive");
  if (normalized === "UNASSIGNED") return tr("Non assignee", "Unassigned");
  return tr("Inconnu", "Unknown");
}

export default function PrintAdmin() {
  const { user, token, loading: authLoading } = useContext(AuthContext);
  const { tr } = useLanguage();

  const [overview, setOverview] = useState(null);
  const [agents, setAgents] = useState([]);
  const [printers, setPrinters] = useState([]);

  const [loading, setLoading] = useState(false);
  const [runningTick, setRunningTick] = useState(false);
  const [busyByKey, setBusyByKey] = useState({});
  const [message, setMessage] = useState("");

  const [printerForm, setPrinterForm] = useState(initialPrinterForm);

  const setBusy = (key, value) => {
    setBusyByKey((prev) => ({ ...prev, [key]: value }));
  };

  const refreshAll = useCallback(async () => {
    if (!token || user?.role !== "ADMIN") return;
    setLoading(true);
    try {
      const [nextOverview, nextAgents, nextPrinters] = await Promise.all([
        getPrintOverviewAdmin(token),
        getPrintAgentsAdmin(token),
        getPrintPrintersAdmin(token),
      ]);
      setOverview(nextOverview || null);
      setAgents(Array.isArray(nextAgents) ? nextAgents : []);
      setPrinters(Array.isArray(nextPrinters) ? nextPrinters : []);
      setMessage("");
    } catch (err) {
      setMessage(err?.response?.data?.error || tr("Erreur de chargement impression", "Print loading error"));
    } finally {
      setLoading(false);
    }
  }, [token, user, tr]);

  useEffect(() => {
    if (authLoading) return undefined;
    refreshAll();
    const timer = setInterval(refreshAll, AUTO_REFRESH_MS);
    return () => clearInterval(timer);
  }, [authLoading, refreshAll]);

  const alertCount = useMemo(() => {
    const agentAlerts = overview?.agents?.alerts?.length || 0;
    const metadataPrinterAlerts = overview?.printers?.alerts?.metadataIssues?.length || 0;
    const inactivePrinterAlerts = overview?.printers?.alerts?.inactive?.length || 0;
    const readyStaleAlerts = overview?.jobs?.alerts?.readyStaleCount || 0;
    return agentAlerts + metadataPrinterAlerts + inactivePrinterAlerts + readyStaleAlerts;
  }, [overview]);

  const handleCreateOrUpdatePrinter = async (event) => {
    event.preventDefault();
    if (!printerForm.code.trim() || !printerForm.name.trim()) {
      setMessage(tr("Code et nom imprimante obligatoires", "Printer code and name are required"));
      return;
    }

    const busyKey = "upsert-printer";
    setBusy(busyKey, true);
    try {
      const normalizedCode = printerForm.code.trim().toLowerCase();
      const existingPrinter = (printers || []).find(
        (entry) => String(entry?.code || "").trim().toLowerCase() === normalizedCode
      ) || null;

      const payload = {
        code: printerForm.code.trim(),
        name: printerForm.name.trim(),
        model: existingPrinter?.model || null,
        paperWidthMm: Number(existingPrinter?.paperWidthMm || 80),
        connectionType: existingPrinter?.connectionType || "ETHERNET",
        ipAddress: printerForm.ipAddress.trim() || null,
        port: Number(existingPrinter?.port || 9100),
        isActive: typeof existingPrinter?.isActive === "boolean" ? existingPrinter.isActive : true,
        agentCode: printerForm.agentCode.trim() || null,
        locationId: existingPrinter?.location?.id ?? null,
      };

      await upsertPrintPrinterAdmin(token, payload);
      setPrinterForm(initialPrinterForm);
      setMessage(tr("Imprimante enregistree", "Printer saved"));
      await refreshAll();
    } catch (err) {
      setMessage(err?.response?.data?.error || tr("Echec enregistrement imprimante", "Printer save failed"));
    } finally {
      setBusy(busyKey, false);
    }
  };

  const handleEditPrinter = (printer) => {
    setPrinterForm({
      name: printer?.name || "",
      code: printer?.code || "",
      ipAddress: printer?.ipAddress || "",
      agentCode: printer?.agent?.code || "",
    });
  };

  const handleDeletePrinter = async (printerCode) => {
    if (!window.confirm(tr("Supprimer cette imprimante ?", "Delete this printer?"))) return;
    const busyKey = `delete-printer:${printerCode}`;
    setBusy(busyKey, true);
    try {
      await deletePrintPrinterAdmin(token, printerCode);
      setMessage(tr("Imprimante supprimee", "Printer deleted"));
      await refreshAll();
    } catch (err) {
      setMessage(err?.response?.data?.error || tr("Echec suppression imprimante", "Printer deletion failed"));
    } finally {
      setBusy(busyKey, false);
    }
  };

  const handleTick = async () => {
    setRunningTick(true);
    try {
      const result = await runPrintSchedulerTickAdmin(token);
      setMessage(
        tr(
          `Tick OK: ${result.pending_to_ready || 0} pending->ready, ${result.retry_to_ready || 0} retry->ready`,
          `Tick OK: ${result.pending_to_ready || 0} pending->ready, ${result.retry_to_ready || 0} retry->ready`
        )
      );
      await refreshAll();
    } catch (err) {
      setMessage(err?.response?.data?.error || tr("Echec du tick scheduler", "Scheduler tick failed"));
    } finally {
      setRunningTick(false);
    }
  };

  if (!token || user?.role !== "ADMIN") {
    return <p>{tr("Acces refuse : administrateur uniquement", "Access denied: admin only")}</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-white">{tr("Camions & impressions", "Trucks & printing")}</h2>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={refreshAll}
            className="rounded-lg border border-white/25 bg-white/5 px-3 py-2 text-xs font-semibold text-stone-100 transition hover:bg-white/15"
          >
            {loading ? tr("Actualisation...", "Refreshing...") : tr("Actualiser", "Refresh")}
          </button>
          <button
            type="button"
            onClick={handleTick}
            disabled={runningTick}
            className="rounded-lg border border-amber-300/40 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-200 transition hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {runningTick ? tr("Tick en cours...", "Tick running...") : tr("Forcer tick scheduler", "Force scheduler tick")}
          </button>
        </div>
      </div>

      {alertCount > 0 && (
        <div className="rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          <p className="font-semibold">{tr("Alerte impression", "Print alert")} ({alertCount})</p>
          <p className="text-xs text-red-100">
            {tr(
              "Un agent, une imprimante ou un job pret trop ancien est en alerte. Verifier papier, reseau, dernier signal PI et tickets.",
              "An agent, printer or stale READY job is in alert. Check paper, network, latest Pi signal and tickets."
            )}
          </p>
        </div>
      )}

      {message && (
        <p className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-stone-200">{message}</p>
      )}

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-wider text-stone-400">{tr("Tickets", "Tickets")}</p>
          <p className="mt-1 text-xl font-bold text-white">{overview?.jobs?.total ?? 0}</p>
          <p className="text-xs text-stone-300">{tr("Echecs 24h", "Failed 24h")}: {overview?.jobs?.failedLast24h ?? 0}</p>
          <p className="text-[11px] text-stone-400">
            {tr("READY > seuil", "READY > threshold")}: {overview?.jobs?.alerts?.readyStaleCount ?? 0}
          </p>
        </article>
        <article className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-wider text-stone-400">{tr("Camions (agents)", "Trucks (agents)")}</p>
          <p className="mt-1 text-xl font-bold text-white">{overview?.agents?.total ?? 0}</p>
          <p className="text-xs text-stone-300">
            {tr("En ligne", "Online")} {overview?.agents?.online ?? 0} | {tr("Degrades", "Degraded")} {overview?.agents?.degraded ?? 0} | {tr("Hors ligne", "Offline")} {overview?.agents?.offline ?? 0}
          </p>
        </article>
        <article className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-wider text-stone-400">{tr("Imprimantes", "Printers")}</p>
          <p className="mt-1 text-xl font-bold text-white">{overview?.printers?.total ?? 0}</p>
          <p className="text-xs text-stone-300">
            {tr("Connectees", "Connected")} {overview?.printers?.connected ?? 0} | {tr("Hors ligne", "Offline")} {overview?.printers?.offline ?? 0} | {tr("Degradees", "Degraded")} {overview?.printers?.degraded ?? 0}
          </p>
          <p className="text-[11px] text-stone-400">
            {tr("Config actives", "Active config")} {overview?.printers?.active ?? 0} | {tr("Inactives", "Inactive")} {overview?.printers?.inactive ?? 0}
          </p>
        </article>
      </section>

      <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-stone-300">
        <p>
          {tr("Gestion camions: ", "Truck management: ")}
          <Link to="/admin/locations" className="font-semibold text-saffron underline underline-offset-2">
            /admin/locations
          </Link>
        </p>
        <p className="mt-1">
          {tr("Gestion tickets: ", "Ticket management: ")}
          <Link to="/admin/tickets" className="font-semibold text-saffron underline underline-offset-2">
            /admin/tickets
          </Link>
        </p>
      </div>

      <section className="rounded-xl border border-white/10 bg-white/5 p-4 md:p-5">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-saffron">{tr("Creer/mettre a jour une imprimante", "Create/update a printer")}</h3>
        <form onSubmit={handleCreateOrUpdatePrinter} className="grid gap-3 md:grid-cols-4">
          <input
            value={printerForm.name}
            onChange={(event) => setPrinterForm((prev) => ({ ...prev, name: event.target.value }))}
            placeholder="Imprimante camion 0"
            className="rounded-lg border border-white/20 bg-charcoal/70 px-3 py-2 text-sm text-stone-100"
          />
          <input
            value={printerForm.code}
            onChange={(event) => setPrinterForm((prev) => ({ ...prev, code: event.target.value }))}
            placeholder="print_truck_00"
            className="rounded-lg border border-white/20 bg-charcoal/70 px-3 py-2 text-sm text-stone-100"
          />
          <input
            value={printerForm.ipAddress}
            onChange={(event) => setPrinterForm((prev) => ({ ...prev, ipAddress: event.target.value }))}
            placeholder="192.168.50.20"
            className="rounded-lg border border-white/20 bg-charcoal/70 px-3 py-2 text-sm text-stone-100"
          />
          <select
            value={printerForm.agentCode}
            onChange={(event) => setPrinterForm((prev) => ({ ...prev, agentCode: event.target.value }))}
            className="rounded-lg border border-white/20 bg-charcoal/70 px-3 py-2 text-sm text-stone-100"
          >
            <option value="">{tr("Aucun camion", "No truck")}</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.code}>
                {agent.name} ({agent.code})
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={busyByKey["upsert-printer"]}
            className="rounded-lg border border-emerald-300/40 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-200 disabled:opacity-60 md:col-span-4"
          >
            {tr("Enregistrer imprimante", "Save printer")}
          </button>
        </form>

        <div className="mt-4 space-y-3">
          {printers.length === 0 ? (
            <p className="text-xs text-stone-400">{tr("Aucune imprimante", "No printer")}</p>
          ) : (
            printers.map((printer) => {
              const busyDelete = busyByKey[`delete-printer:${printer.code}`];
              return (
                <article key={printer.id} className="rounded-lg border border-white/10 bg-black/20 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-white">{printer.name}</p>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${
                        statusBadge(printer?.runtime?.status || (printer.isActive ? "ONLINE" : "INACTIVE"))
                      }`}
                    >
                      {formatPrinterRuntimeLabel(printer?.runtime?.status || (printer.isActive ? "ONLINE" : "INACTIVE"), tr)}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <ActionIconButton onClick={() => handleEditPrinter(printer)} label={tr("Modifier", "Edit")}>
                      <EditIcon />
                    </ActionIconButton>
                    <ActionIconButton
                      onClick={() => handleDeletePrinter(printer.code)}
                      label={tr("Supprimer", "Delete")}
                      variant="danger"
                      disabled={busyDelete}
                    >
                      <DeleteIcon />
                    </ActionIconButton>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}