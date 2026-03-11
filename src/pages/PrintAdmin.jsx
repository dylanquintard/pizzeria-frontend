import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import {
  deletePrintPrinterAdmin,
  getPrintAgentsAdmin,
  getPrintJobsAdmin,
  getPrintOverviewAdmin,
  getPrintPrintersAdmin,
  reprintJobAdmin,
  rotatePrintAgentTokenAdmin,
  runPrintSchedulerTickAdmin,
  upsertPrintPrinterAdmin,
} from "../api/admin.api";
import { getOrderNote } from "../utils/orderNote";
import { splitPersonName } from "../utils/personName";

const AUTO_REFRESH_MS = 10_000;

const initialPrinterForm = {
  name: "",
  code: "",
  ipAddress: "",
  agentCode: "",
};

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
  const { tr, locale } = useLanguage();

  const [overview, setOverview] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [agents, setAgents] = useState([]);
  const [printers, setPrinters] = useState([]);

  const [loading, setLoading] = useState(false);
  const [runningTick, setRunningTick] = useState(false);
  const [reprintingByJobId, setReprintingByJobId] = useState({});
  const [busyByKey, setBusyByKey] = useState({});
  const [message, setMessage] = useState("");
  const [agentTokenInfo, setAgentTokenInfo] = useState(null);

  const [printerForm, setPrinterForm] = useState(initialPrinterForm);

  const setBusy = (key, value) => {
    setBusyByKey((prev) => ({ ...prev, [key]: value }));
  };

  const refreshAll = useCallback(async () => {
    if (!token || user?.role !== "ADMIN") return;
    setLoading(true);
    try {
      const [nextOverview, nextJobs, nextAgents, nextPrinters] = await Promise.all([
        getPrintOverviewAdmin(token),
        getPrintJobsAdmin(token, { limit: 50 }),
        getPrintAgentsAdmin(token),
        getPrintPrintersAdmin(token),
      ]);
      setOverview(nextOverview || null);
      setJobs(Array.isArray(nextJobs) ? nextJobs : []);
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
    return agentAlerts + metadataPrinterAlerts + inactivePrinterAlerts;
  }, [overview]);

  const handleRotateAgentToken = async (agentCode) => {
    const busyKey = `rotate-agent:${agentCode}`;
    setBusy(busyKey, true);
    try {
      const result = await rotatePrintAgentTokenAdmin(token, agentCode);
      if (result?.token) {
        setAgentTokenInfo({
          code: agentCode,
          token: result.token,
        });
      }
      setMessage(tr("Nouveau token genere", "New token generated"));
      await refreshAll();
    } catch (err) {
      setMessage(err?.response?.data?.error || tr("Echec rotation token", "Token rotation failed"));
    } finally {
      setBusy(busyKey, false);
    }
  };

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

  const handleReprint = async (jobId) => {
    if (!window.confirm(tr("Relancer l'impression de ce ticket ?", "Reprint this ticket?"))) return;
    setReprintingByJobId((prev) => ({ ...prev, [jobId]: true }));
    try {
      await reprintJobAdmin(token, jobId, { copies: 1, reason: "manual_reprint_admin" });
      setMessage(tr("Ticket ajoute en reimpression", "Reprint job created"));
      await refreshAll();
    } catch (err) {
      setMessage(err?.response?.data?.error || tr("Echec de reimpression", "Reprint failed"));
    } finally {
      setReprintingByJobId((prev) => ({ ...prev, [jobId]: false }));
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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-white">{tr("Impression, camions & tickets", "Print, trucks & tickets")}</h2>
        <div className="flex items-center gap-2">
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
        <div className="rounded-xl border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          <p className="font-semibold">{tr("Alerte impression", "Print alert")} ({alertCount})</p>
          <p className="text-xs text-red-100">
            {tr(
              "Un agent ou une imprimante est en etat degrade/hors ligne. Verifier papier, reseau et heartbeat Pi.",
              "At least one agent/printer is degraded or offline. Check paper, network, and Pi heartbeat."
            )}
          </p>
        </div>
      )}

      {message && (
        <p className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-stone-200">{message}</p>
      )}

      {agentTokenInfo?.token && (
        <div className="rounded-xl border border-sky-300/40 bg-sky-500/10 px-3 py-3 text-sm text-sky-100">
          <p className="font-semibold text-sky-200">
            {tr("Token PI (affiche apres creation/rotation)", "Pi token (shown after create/rotate)")}
          </p>
          <p className="mt-1 break-all font-mono text-xs">
            {agentTokenInfo.code}: {agentTokenInfo.token}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(agentTokenInfo.token);
                  setMessage(tr("Token copie", "Token copied"));
                } catch (_err) {
                  setMessage(tr("Copie impossible, copie manuelle necessaire", "Cannot copy automatically, please copy manually"));
                }
              }}
              className="rounded-lg border border-sky-300/40 bg-sky-500/20 px-3 py-1.5 text-xs font-semibold text-sky-100"
            >
              {tr("Copier token", "Copy token")}
            </button>
            <button
              type="button"
              onClick={() => setAgentTokenInfo(null)}
              className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-stone-100"
            >
              {tr("Masquer", "Hide")}
            </button>
          </div>
        </div>
      )}

      <section className="grid gap-3 md:grid-cols-3">
        <article className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-xs uppercase tracking-wider text-stone-400">{tr("Jobs", "Jobs")}</p>
          <p className="mt-1 text-xl font-bold text-white">{overview?.jobs?.total ?? 0}</p>
          <p className="text-xs text-stone-300">FAILED 24h: {overview?.jobs?.failedLast24h ?? 0}</p>
        </article>
        <article className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-xs uppercase tracking-wider text-stone-400">{tr("Camions (agents)", "Trucks (agents)")}</p>
          <p className="mt-1 text-xl font-bold text-white">{overview?.agents?.total ?? 0}</p>
          <p className="text-xs text-stone-300">
            ONLINE {overview?.agents?.online ?? 0} | DEGRADED {overview?.agents?.degraded ?? 0} | OFFLINE {overview?.agents?.offline ?? 0}
          </p>
        </article>
        <article className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-xs uppercase tracking-wider text-stone-400">{tr("Imprimantes", "Printers")}</p>
          <p className="mt-1 text-xl font-bold text-white">{overview?.printers?.total ?? 0}</p>
          <p className="text-xs text-stone-300">
            {tr("Connectees", "Connected")} {overview?.printers?.connected ?? 0} | {tr("Hors ligne", "Offline")} {overview?.printers?.offline ?? 0} | DEGRADED {overview?.printers?.degraded ?? 0}
          </p>
          <p className="text-[11px] text-stone-400">
            CONFIG ACTIVE {overview?.printers?.active ?? 0} | INACTIVE {overview?.printers?.inactive ?? 0}
          </p>
        </article>
      </section>

      <section className="rounded-xl border border-white/10 bg-white/5 p-3">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-saffron">{tr("Camions (lecture seule)", "Trucks (read-only)")}</h3>
        <p className="mt-2 text-xs text-stone-300">
          {tr(
            "Creation/lien camion disponibles dans /admin/locations. Ici: supervision + rotation token.",
            "Truck creation/linking is handled in /admin/locations. This page is for monitoring + token rotation."
          )}
        </p>

        <div className="mt-3 space-y-2">
          {agents.length === 0 ? (
            <p className="text-xs text-stone-400">{tr("Aucun camion", "No truck")}</p>
          ) : (
            agents.map((agent) => {
              const busyRotate = busyByKey[`rotate-agent:${agent.code}`];
              const linkedLocationNames = (agent.printers || [])
                .map((printer) => printer?.location?.name)
                .filter(Boolean);

              return (
                <article key={agent.id} className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-white">
                      {agent.name} <span className="text-xs text-stone-400">({agent.code})</span>
                    </p>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${statusBadge(agent.status)}`}>
                      {agent.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-stone-300">
                    {tr("Dernier heartbeat", "Last heartbeat")}: {formatDateTime(agent.lastHeartbeatAt, locale)}
                  </p>
                  <p className="mt-1 text-xs text-stone-300">
                    {tr("Emplacements lies", "Linked locations")}: {linkedLocationNames.length > 0 ? linkedLocationNames.join(", ") : "-"}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busyRotate}
                      onClick={() => handleRotateAgentToken(agent.code)}
                      className="rounded-lg border border-sky-300/40 bg-sky-500/10 px-3 py-1.5 text-xs font-semibold text-sky-200 disabled:opacity-60"
                    >
                      {tr("Rotate token", "Rotate token")}
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-white/5 p-3">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-saffron">{tr("Creer/mettre a jour une imprimante", "Create/update a printer")}</h3>
        <form onSubmit={handleCreateOrUpdatePrinter} className="grid gap-2 md:grid-cols-4">
          <input
            value={printerForm.name}
            onChange={(event) => setPrinterForm((prev) => ({ ...prev, name: event.target.value }))}
            placeholder={tr("Nom imprimante", "Printer name")}
            className="rounded-lg border border-white/20 bg-charcoal/70 px-3 py-2 text-sm text-stone-100"
          />
          <input
            value={printerForm.code}
            onChange={(event) => setPrinterForm((prev) => ({ ...prev, code: event.target.value }))}
            placeholder={tr("Code imprimante", "Printer code")}
            className="rounded-lg border border-white/20 bg-charcoal/70 px-3 py-2 text-sm text-stone-100"
          />
          <input
            value={printerForm.ipAddress}
            onChange={(event) => setPrinterForm((prev) => ({ ...prev, ipAddress: event.target.value }))}
            placeholder={tr("IP imprimante", "Printer IP")}
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
        <p className="mt-2 text-xs text-stone-300">
          {tr(
            "Port fixe 9100. Emplacement gere via liaison camion -> emplacement dans /admin/locations.",
            "Fixed port 9100. Location is managed via truck -> location link in /admin/locations."
          )}
        </p>

        <div className="mt-3 space-y-2">
          {printers.length === 0 ? (
            <p className="text-xs text-stone-400">{tr("Aucune imprimante", "No printer")}</p>
          ) : (
            printers.map((printer) => {
              const busyDelete = busyByKey[`delete-printer:${printer.code}`];
              return (
                <article key={printer.id} className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-white">
                      {printer.name} <span className="text-xs text-stone-400">({printer.code})</span>
                    </p>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${
                        statusBadge(printer?.runtime?.status || (printer.isActive ? "ONLINE" : "INACTIVE"))
                      }`}
                    >
                      {formatPrinterRuntimeLabel(printer?.runtime?.status || (printer.isActive ? "ONLINE" : "INACTIVE"), tr)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-stone-300">
                    {printer.ipAddress || "-"}:{printer.port} | {printer.connectionType} | {tr("Camion", "Truck")}: {printer.agent?.name || "-"}
                  </p>
                  <p className="mt-1 text-xs text-stone-300">
                    {tr("Dernier heartbeat", "Last heartbeat")}: {formatDateTime(printer?.runtime?.lastHeartbeatAt || printer?.agent?.lastHeartbeatAt, locale)}
                    {" | "}
                    {tr("Etat remonte Pi", "Pi-reported state")}: {String(printer?.runtime?.reportedOnline) === "true" ? tr("Connectee", "Connected") : String(printer?.runtime?.reportedOnline) === "false" ? tr("Hors ligne", "Offline") : "-"}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={busyDelete}
                      onClick={() => handleDeletePrinter(printer.code)}
                      className="rounded-lg border border-red-300/40 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-200 disabled:opacity-60"
                    >
                      {tr("Supprimer imprimante", "Delete printer")}
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-white/5 p-3">
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-saffron">{tr("Derniers jobs", "Recent jobs")}</h3>
        {jobs.length === 0 ? (
          <p className="text-xs text-stone-400">{tr("Aucun job", "No job")}</p>
        ) : (
          <div className="space-y-2">
            {jobs.map((job) => {
              const parsedName = splitPersonName(job?.order?.user || {});
              const note = getOrderNote(job?.order || {});
              const canReprint = ["PRINTED", "FAILED", "RETRY_WAITING"].includes(String(job.status || "").toUpperCase());
              return (
                <article key={job.id} className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-white">
                      #{job.orderId} - {job.printer?.code || "-"}
                    </p>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${statusBadge(job.status)}`}>
                      {job.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-stone-300">
                    {tr("Client", "Customer")}: {parsedName.fullName || job?.order?.user?.name || "-"} |{" "}
                    {tr("Retrait", "Pickup")}: {formatDateTime(job?.payload?.order?.pickup_time, locale)} |{" "}
                    {tr("Total", "Total")}: {job?.payload?.order?.total || "-"} EUR
                  </p>
                  {note && <p className="mt-1 text-xs text-stone-200">{tr("Note", "Note")}: {note}</p>}
                  <p className="mt-1 text-[11px] text-stone-400">
                    {tr("Planifie", "Scheduled")}: {formatDateTime(job.scheduledAt, locale)} |{" "}
                    {tr("Derniere MAJ", "Last update")}: {formatDateTime(job.updatedAt, locale)}
                  </p>
                  <div className="mt-2">
                    <button
                      type="button"
                      disabled={!canReprint || reprintingByJobId[job.id]}
                      onClick={() => handleReprint(job.id)}
                      className="rounded-lg border border-sky-300/40 bg-sky-500/10 px-3 py-1.5 text-xs font-semibold text-sky-200 transition hover:bg-sky-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {reprintingByJobId[job.id] ? tr("Reimpression...", "Reprinting...") : tr("Reimprimer", "Reprint")}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
