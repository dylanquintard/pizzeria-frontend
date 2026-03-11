import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import {
  getPrintAgentsAdmin,
  getPrintJobsAdmin,
  getPrintOverviewAdmin,
  getPrintPrintersAdmin,
  reprintJobAdmin,
  runPrintSchedulerTickAdmin,
} from "../api/admin.api";
import { getOrderNote } from "../utils/orderNote";
import { splitPersonName } from "../utils/personName";

const AUTO_REFRESH_MS = 10_000;

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

export default function PrintAdmin() {
  const { user, token, loading: authLoading } = useContext(AuthContext);
  const { tr, locale } = useLanguage();

  const [overview, setOverview] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [agents, setAgents] = useState([]);
  const [printers, setPrinters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [runningTick, setRunningTick] = useState(false);
  const [reprintingByJobId, setReprintingByJobId] = useState({});

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

  const handleReprint = async (jobId) => {
    const confirmText = tr("Relancer l'impression de ce ticket ?", "Reprint this ticket?");
    if (!window.confirm(confirmText)) return;

    setReprintingByJobId((prev) => ({ ...prev, [jobId]: true }));
    try {
      await reprintJobAdmin(token, jobId, {
        copies: 1,
        reason: "manual_reprint_admin",
      });
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
        <h2 className="text-2xl font-bold text-white">{tr("Impression & tickets", "Print & tickets")}</h2>
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
          <p className="font-semibold">
            {tr("Alerte impression", "Print alert")} ({alertCount})
          </p>
          <p className="text-xs text-red-100">
            {tr(
              "Un agent ou une imprimante est en etat degrade/hors ligne. Verifier papier, reseau et heartbeat Pi.",
              "At least one agent/printer is degraded or offline. Check paper, network, and Pi heartbeat."
            )}
          </p>
        </div>
      )}

      {message && (
        <p className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-stone-200">
          {message}
        </p>
      )}

      <section className="grid gap-3 md:grid-cols-3">
        <article className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-xs uppercase tracking-wider text-stone-400">{tr("Jobs", "Jobs")}</p>
          <p className="mt-1 text-xl font-bold text-white">{overview?.jobs?.total ?? 0}</p>
          <p className="text-xs text-stone-300">
            FAILED 24h: {overview?.jobs?.failedLast24h ?? 0}
          </p>
        </article>
        <article className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-xs uppercase tracking-wider text-stone-400">{tr("Agents", "Agents")}</p>
          <p className="mt-1 text-xl font-bold text-white">{overview?.agents?.total ?? 0}</p>
          <p className="text-xs text-stone-300">
            ONLINE {overview?.agents?.online ?? 0} | DEGRADED {overview?.agents?.degraded ?? 0} | OFFLINE{" "}
            {overview?.agents?.offline ?? 0}
          </p>
        </article>
        <article className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-xs uppercase tracking-wider text-stone-400">{tr("Imprimantes", "Printers")}</p>
          <p className="mt-1 text-xl font-bold text-white">{overview?.printers?.total ?? 0}</p>
          <p className="text-xs text-stone-300">
            ACTIVE {overview?.printers?.active ?? 0} | INACTIVE {overview?.printers?.inactive ?? 0}
          </p>
        </article>
      </section>

      <section className="rounded-xl border border-white/10 bg-white/5 p-3">
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-saffron">{tr("Agents", "Agents")}</h3>
        {agents.length === 0 ? (
          <p className="text-xs text-stone-400">{tr("Aucun agent", "No agent")}</p>
        ) : (
          <div className="space-y-2">
            {agents.map((agent) => (
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
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-white/10 bg-white/5 p-3">
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-saffron">{tr("Imprimantes", "Printers")}</h3>
        {printers.length === 0 ? (
          <p className="text-xs text-stone-400">{tr("Aucune imprimante", "No printer")}</p>
        ) : (
          <div className="space-y-2">
            {printers.map((printer) => (
              <article key={printer.id} className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-white">
                    {printer.name} <span className="text-xs text-stone-400">({printer.code})</span>
                  </p>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${printer.isActive ? statusBadge("ONLINE") : statusBadge("OFFLINE")}`}>
                    {printer.isActive ? "ACTIVE" : "INACTIVE"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-stone-300">
                  {printer.ipAddress || "-"}:{printer.port} | {printer.connectionType}
                </p>
              </article>
            ))}
          </div>
        )}
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
                  {note && (
                    <p className="mt-1 text-xs text-stone-200">
                      {tr("Note", "Note")}: {note}
                    </p>
                  )}
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
