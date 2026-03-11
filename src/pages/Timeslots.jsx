import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getLocations } from "../api/location.api";
import {
  deleteWeeklyService,
  getWeeklySettings,
  upsertWeeklySetting,
} from "../api/timeslot.api";
import { AuthContext } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

const WEEK_DAYS = [
  { key: "MONDAY", labelFr: "Lundi", labelEn: "Monday" },
  { key: "TUESDAY", labelFr: "Mardi", labelEn: "Tuesday" },
  { key: "WEDNESDAY", labelFr: "Mercredi", labelEn: "Wednesday" },
  { key: "THURSDAY", labelFr: "Jeudi", labelEn: "Thursday" },
  { key: "FRIDAY", labelFr: "Vendredi", labelEn: "Friday" },
  { key: "SATURDAY", labelFr: "Samedi", labelEn: "Saturday" },
  { key: "SUNDAY", labelFr: "Dimanche", labelEn: "Sunday" },
];

const DEFAULT_FORM = {
  startTime: "18:00",
  endTime: "22:00",
  slotDuration: 15,
  maxPizzas: 10,
  locationId: "",
};

function formatLocation(location, tr) {
  if (!location) return tr("Sans emplacement", "No location");
  const cityLine = `${location.postalCode || ""} ${location.city || ""}`.trim();
  return [location.name, location.addressLine1, cityLine].filter(Boolean).join(" - ");
}

function closedSetting(dayOfWeek) {
  return {
    dayOfWeek,
    isOpen: false,
    services: [],
  };
}

function normalizeServices(setting = {}) {
  if (Array.isArray(setting.services) && setting.services.length > 0) {
    return setting.services;
  }

  if (setting.isOpen && setting.startTime && setting.endTime) {
    return [
      {
        id: `${setting.dayOfWeek || "DAY"}-${setting.locationId || "none"}-${setting.startTime}-${setting.endTime}`,
        startTime: setting.startTime,
        endTime: setting.endTime,
        slotDuration: setting.slotDuration,
        maxPizzas: setting.maxPizzas,
        locationId: setting.locationId,
        location: setting.location || null,
        slotsCount: setting.slotsCount || 0,
      },
    ];
  }

  return [];
}

export default function TimeslotsAdmin() {
  const { token } = useContext(AuthContext);
  const { tr } = useLanguage();

  const [locations, setLocations] = useState([]);
  const [weeklySettings, setWeeklySettings] = useState([]);
  const [activeDay, setActiveDay] = useState("MONDAY");
  const [form, setForm] = useState({ ...DEFAULT_FORM });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const settingsByDay = useMemo(
    () => new Map(weeklySettings.map((setting) => [setting.dayOfWeek, setting])),
    [weeklySettings]
  );

  const activeDaySetting = settingsByDay.get(activeDay) || closedSetting(activeDay);
  const activeDayServices = useMemo(
    () => normalizeServices(activeDaySetting),
    [activeDaySetting]
  );

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      const [locationData, settingsData] = await Promise.all([
        getLocations({ active: true }),
        getWeeklySettings(token),
      ]);
      setLocations(Array.isArray(locationData) ? locationData : []);
      setWeeklySettings(Array.isArray(settingsData) ? settingsData : []);
    } catch (err) {
      console.error(err);
      alert(
        err.response?.data?.error ||
          tr(
            "Impossible de charger les horaires hebdomadaires",
            "Unable to load weekly opening hours"
          )
      );
    } finally {
      setLoading(false);
    }
  }, [token, tr]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  useEffect(() => {
    const firstService = normalizeServices(activeDaySetting)[0];
    setForm((prev) => ({
      ...prev,
      locationId:
        prev.locationId ||
        (firstService?.locationId ? String(firstService.locationId) : ""),
    }));
  }, [activeDaySetting]);

  const upsertWeeklySettingInState = (dayKey, setting) => {
    setWeeklySettings((prev) => {
      const byDay = new Map(prev.map((entry) => [entry.dayOfWeek, entry]));
      byDay.set(dayKey, setting || closedSetting(dayKey));
      return WEEK_DAYS.map((day) => byDay.get(day.key) || closedSetting(day.key));
    });
  };

  const handleAddService = async (event) => {
    event.preventDefault();

    if (!form.locationId) {
      alert(tr("Selectionnez un emplacement", "Select a location"));
      return;
    }

    setSaving(true);
    try {
      const savedSetting = await upsertWeeklySetting(token, activeDay, {
        isOpen: true,
        startTime: form.startTime,
        endTime: form.endTime,
        slotDuration: Number(form.slotDuration),
        maxPizzas: Number(form.maxPizzas),
        locationId: Number(form.locationId),
      });

      upsertWeeklySettingInState(activeDay, savedSetting);
      alert(tr("Service ajoute", "Service added"));
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCloseDay = async () => {
    if (
      !window.confirm(
        tr(
          "Fermer ce jour supprimera tous les services planifies. Continuer ?",
          "Closing this day will remove all planned services. Continue?"
        )
      )
    ) {
      return;
    }

    setSaving(true);
    try {
      const savedSetting = await upsertWeeklySetting(token, activeDay, { isOpen: false });
      upsertWeeklySettingInState(activeDay, savedSetting);
      alert(tr("Jour ferme", "Day closed"));
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteService = async (service) => {
    if (!service?.locationId || !service?.startTime || !service?.endTime) return;
    if (
      !window.confirm(
        tr("Supprimer ce service ?", "Delete this service?")
      )
    ) {
      return;
    }

    setSaving(true);
    try {
      const savedSetting = await deleteWeeklyService(token, activeDay, {
        startTime: service.startTime,
        endTime: service.endTime,
        locationId: Number(service.locationId),
      });
      upsertWeeklySettingInState(activeDay, savedSetting);
      alert(tr("Service supprime", "Service deleted"));
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display uppercase tracking-wide text-white">
          {tr("Planning hebdomadaire", "Weekly schedule")}
        </h2>
        <p className="mt-1 text-sm text-stone-300">
          {tr(
            "Ajoutez plusieurs services par jour: horaires, capacite par creneau et emplacement.",
            "Add multiple services per day: hours, per-slot capacity and location."
          )}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <aside className="rounded-2xl border border-white/10 bg-white/5 p-3">
          <div className="space-y-2">
            {WEEK_DAYS.map((day) => {
              const setting = settingsByDay.get(day.key) || closedSetting(day.key);
              const services = normalizeServices(setting);
              const isActive = day.key === activeDay;
              return (
                <button
                  key={day.key}
                  type="button"
                  onClick={() => setActiveDay(day.key)}
                  className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                    isActive
                      ? "border-saffron bg-saffron/15"
                      : "border-white/15 bg-black/20 hover:bg-white/10"
                  }`}
                >
                  <p className={`text-sm font-semibold ${isActive ? "text-saffron" : "text-stone-100"}`}>
                    {tr(day.labelFr, day.labelEn)}
                  </p>
                  <p className={`text-xs ${services.length > 0 ? "text-emerald-300" : "text-stone-400"}`}>
                    {services.length > 0
                      ? tr(
                          `${services.length} service(s)`,
                          `${services.length} service(s)`
                        )
                      : tr("Ferme", "Closed")}
                  </p>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="rounded-2xl border border-white/10 bg-charcoal/35 p-5">
          {loading ? (
            <p className="text-sm text-stone-300">{tr("Chargement...", "Loading...")}</p>
          ) : (
            <div className="space-y-5">
              <form onSubmit={handleAddService} className="space-y-4">
                <h3 className="text-lg font-bold text-white">
                  {tr(
                    `Ajouter un service - ${WEEK_DAYS.find((day) => day.key === activeDay)?.labelFr || ""}`,
                    `Add service - ${WEEK_DAYS.find((day) => day.key === activeDay)?.labelEn || ""}`
                  )}
                </h3>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-sm text-stone-300">
                    {tr("Heure ouverture", "Opening time")}
                    <input
                      type="time"
                      value={form.startTime}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, startTime: event.target.value }))
                      }
                      required
                      className="mt-1 w-full rounded-lg border border-white/20 bg-charcoal/70 px-3 py-2 text-white"
                    />
                  </label>

                  <label className="text-sm text-stone-300">
                    {tr("Heure fermeture", "Closing time")}
                    <input
                      type="time"
                      value={form.endTime}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, endTime: event.target.value }))
                      }
                      required
                      className="mt-1 w-full rounded-lg border border-white/20 bg-charcoal/70 px-3 py-2 text-white"
                    />
                  </label>

                  <label className="text-sm text-stone-300">
                    {tr("Duree d'un creneau (min)", "Slot duration (min)")}
                    <input
                      type="number"
                      min="5"
                      step="5"
                      value={form.slotDuration}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          slotDuration: Number(event.target.value || DEFAULT_FORM.slotDuration),
                        }))
                      }
                      required
                      className="mt-1 w-full rounded-lg border border-white/20 bg-charcoal/70 px-3 py-2 text-white"
                    />
                  </label>

                  <label className="text-sm text-stone-300">
                    {tr("Max pizzas par creneau", "Max pizzas per slot")}
                    <input
                      type="number"
                      min="1"
                      value={form.maxPizzas}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          maxPizzas: Number(event.target.value || DEFAULT_FORM.maxPizzas),
                        }))
                      }
                      required
                      className="mt-1 w-full rounded-lg border border-white/20 bg-charcoal/70 px-3 py-2 text-white"
                    />
                  </label>

                  <label className="text-sm text-stone-300 sm:col-span-2">
                    {tr("Emplacement", "Location")}
                    <select
                      value={form.locationId}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, locationId: event.target.value }))
                      }
                      required
                      className="mt-1 w-full rounded-lg border border-white/20 bg-charcoal/70 px-3 py-2 text-white"
                    >
                      <option value="">{tr("Choisir un emplacement", "Choose a location")}</option>
                      {locations.map((location) => (
                        <option key={location.id} value={location.id}>
                          {formatLocation(location, tr)}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-full bg-saffron px-5 py-2 text-sm font-bold uppercase tracking-wide text-charcoal transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving
                      ? tr("Enregistrement...", "Saving...")
                      : tr("Ajouter ce service", "Add this service")}
                  </button>

                  <button
                    type="button"
                    disabled={saving}
                    onClick={handleCloseDay}
                    className="rounded-full border border-white/25 px-5 py-2 text-sm font-semibold text-stone-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {tr("Fermer ce jour", "Close this day")}
                  </button>
                </div>
              </form>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <h4 className="text-sm font-semibold uppercase tracking-wide text-saffron">
                  {tr("Services du jour selectionne", "Selected day services")}
                </h4>

                {activeDayServices.length === 0 ? (
                  <p className="mt-2 text-sm text-stone-400">{tr("Aucun service", "No service")}</p>
                ) : (
                  <div className="mt-3 space-y-2">
                    {activeDayServices.map((service, index) => (
                      <div
                        key={service.id || `${service.startTime}-${service.endTime}-${index}`}
                        className="rounded-xl border border-white/10 bg-charcoal/45 px-3 py-2 text-sm text-stone-200"
                      >
                        <p className="font-semibold text-white">
                          {service.startTime} - {service.endTime}
                        </p>
                        <p className="text-xs text-stone-300">
                          {tr("Duree", "Duration")}: {service.slotDuration} min |{" "}
                          {tr("Max", "Max")}: {service.maxPizzas}
                        </p>
                        <p className="text-xs text-stone-300">
                          {tr("Adresse", "Address")}: {formatLocation(service.location, tr)}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleDeleteService(service)}
                          className="mt-2 rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-200 transition hover:bg-red-500/20"
                        >
                          {tr("Supprimer ce service", "Delete this service")}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </div>

    </div>
  );
}
