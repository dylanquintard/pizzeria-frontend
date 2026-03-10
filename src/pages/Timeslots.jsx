import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getLocations } from "../api/location.api";
import { getWeeklySettings, upsertWeeklySetting } from "../api/timeslot.api";
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
  isOpen: false,
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

function normalizeSettingToForm(setting) {
  if (!setting || !setting.isOpen) return { ...DEFAULT_FORM };
  return {
    isOpen: true,
    startTime: setting.startTime || DEFAULT_FORM.startTime,
    endTime: setting.endTime || DEFAULT_FORM.endTime,
    slotDuration: Number(setting.slotDuration || DEFAULT_FORM.slotDuration),
    maxPizzas: Number(setting.maxPizzas || DEFAULT_FORM.maxPizzas),
    locationId: setting.locationId ? String(setting.locationId) : "",
  };
}

function closedSetting(dayOfWeek) {
  return {
    dayOfWeek,
    isOpen: false,
    startTime: null,
    endTime: null,
    slotDuration: null,
    maxPizzas: null,
    locationId: null,
    location: null,
    slotsCount: 0,
  };
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

  const mergedSettings = useMemo(
    () => WEEK_DAYS.map((day) => settingsByDay.get(day.key) || closedSetting(day.key)),
    [settingsByDay]
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
          tr("Impossible de charger les horaires hebdomadaires", "Unable to load weekly opening hours")
      );
    } finally {
      setLoading(false);
    }
  }, [token, tr]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  useEffect(() => {
    const daySetting = settingsByDay.get(activeDay);
    setForm(normalizeSettingToForm(daySetting));
  }, [activeDay, settingsByDay]);

  const handleSave = async (event) => {
    event.preventDefault();

    if (form.isOpen && !form.locationId) {
      alert(tr("Selectionnez un emplacement", "Select a location"));
      return;
    }

    setSaving(true);
    try {
      const payload = form.isOpen
        ? {
            isOpen: true,
            startTime: form.startTime,
            endTime: form.endTime,
            slotDuration: Number(form.slotDuration),
            maxPizzas: Number(form.maxPizzas),
            locationId: Number(form.locationId),
          }
        : { isOpen: false };

      const savedSetting = await upsertWeeklySetting(token, activeDay, payload);

      setWeeklySettings((prev) => {
        const byDay = new Map(prev.map((entry) => [entry.dayOfWeek, entry]));
        byDay.set(activeDay, savedSetting || closedSetting(activeDay));
        return WEEK_DAYS.map((day) => byDay.get(day.key) || closedSetting(day.key));
      });

      setForm(normalizeSettingToForm(savedSetting));
      alert(tr("Horaire enregistre", "Schedule saved"));
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
            "Configurez les jours d'ouverture, les horaires, la capacite par creneau et l'emplacement.",
            "Configure opening days, opening hours, per-slot capacity, and pickup location."
          )}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <aside className="rounded-2xl border border-white/10 bg-white/5 p-3">
          <div className="space-y-2">
            {WEEK_DAYS.map((day) => {
              const setting = settingsByDay.get(day.key) || closedSetting(day.key);
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
                  <p className={`text-xs ${setting.isOpen ? "text-emerald-300" : "text-stone-400"}`}>
                    {setting.isOpen
                      ? `${setting.startTime} - ${setting.endTime}`
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
            <form onSubmit={handleSave} className="space-y-4">
              <h3 className="text-lg font-bold text-white">
                {tr(
                  `Reglages du ${WEEK_DAYS.find((day) => day.key === activeDay)?.labelFr || ""}`,
                  `Settings for ${WEEK_DAYS.find((day) => day.key === activeDay)?.labelEn || ""}`
                )}
              </h3>

              <label className="flex items-center gap-2 text-sm text-stone-200">
                <input
                  type="checkbox"
                  checked={form.isOpen}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, isOpen: event.target.checked }))
                  }
                />
                <span>{tr("Jour ouvert", "Open day")}</span>
              </label>

              {form.isOpen && (
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
              )}

              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-saffron px-5 py-2 text-sm font-bold uppercase tracking-wide text-charcoal transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? tr("Enregistrement...", "Saving...") : tr("Enregistrer", "Save")}
              </button>
            </form>
          )}
        </section>
      </div>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h3 className="mb-3 text-lg font-bold text-white">
          {tr("Resume hebdomadaire", "Weekly summary")}
        </h3>
        <div className="space-y-2">
          {mergedSettings.map((setting) => {
            const day = WEEK_DAYS.find((entry) => entry.key === setting.dayOfWeek);
            return (
              <div
                key={setting.dayOfWeek}
                className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-stone-200"
              >
                <p className="font-semibold text-white">{tr(day?.labelFr || setting.dayOfWeek, day?.labelEn || setting.dayOfWeek)}</p>
                {!setting.isOpen ? (
                  <p className="text-stone-400">{tr("Ferme", "Closed")}</p>
                ) : (
                  <p>
                    {setting.startTime} - {setting.endTime}
                    {" | "}
                    {tr("Duree", "Duration")}: {setting.slotDuration} min
                    {" | "}
                    {tr("Max", "Max")}: {setting.maxPizzas}
                    {" | "}
                    {tr("Adresse", "Address")}: {formatLocation(setting.location, tr)}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
