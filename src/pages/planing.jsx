import { useEffect, useMemo, useState } from "react";
import SeoHead from "../components/seo/SeoHead";
import SeoInternalLinks from "../components/seo/SeoInternalLinks";
import { getPublicWeeklySettings } from "../api/timeslot.api";
import { getLocations } from "../api/location.api";
import { buildBaseFoodEstablishmentJsonLd } from "../seo/jsonLd";
import { getCityPath } from "../seo/localLandingContent";
import { Link } from "react-router-dom";

const DAY_LABELS = {
  MONDAY: "Lundi",
  TUESDAY: "Mardi",
  WEDNESDAY: "Mercredi",
  THURSDAY: "Jeudi",
  FRIDAY: "Vendredi",
  SATURDAY: "Samedi",
  SUNDAY: "Dimanche",
};

const ORDERED_DAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function formatHourValue(timeValue) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)/.exec(String(timeValue || "").trim());
  if (!match) return "--";
  const hours = match[1];
  const minutes = match[2];
  return minutes === "00" ? `${hours}H` : `${hours}H${minutes}`;
}

function formatAddress(location) {
  if (!location) return "";
  const cityLine = `${location.postalCode || ""} ${location.city || ""}`.trim();
  return [location.addressLine1, cityLine].filter(Boolean).join(", ");
}

export default function TourneeCamion() {
  const [weeklySettings, setWeeklySettings] = useState([]);
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    let cancelled = false;

    Promise.allSettled([getPublicWeeklySettings(), getLocations({ active: true })]).then((results) => {
      if (cancelled) return;

      const [weeklyResult, locationsResult] = results;

      setWeeklySettings(
        weeklyResult.status === "fulfilled" && Array.isArray(weeklyResult.value)
          ? weeklyResult.value
          : []
      );

      setLocations(
        locationsResult.status === "fulfilled" && Array.isArray(locationsResult.value)
          ? locationsResult.value
          : []
      );
    }).catch(() => {
      if (cancelled) return;
      setWeeklySettings([]);
      setLocations([]);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const scheduleByLocation = useMemo(() => {
    const map = new Map();
    const source = Array.isArray(weeklySettings) ? weeklySettings : [];

    for (const entry of source) {
      const dayOfWeek = String(entry?.dayOfWeek || "").toUpperCase();
      if (!ORDERED_DAYS.includes(dayOfWeek)) continue;

      const services =
        Array.isArray(entry?.services) && entry.services.length > 0
          ? entry.services
          : entry?.isOpen && entry?.location
            ? [
                {
                  startTime: entry.startTime,
                  endTime: entry.endTime,
                  locationId: entry.locationId,
                  location: entry.location,
                },
              ]
            : [];

      for (const service of services) {
        const location = service?.location;
        if (!location) continue;

        const locationName = String(location.name || "Emplacement").trim();
        const address = formatAddress(location);
        const locationKey = normalizeText(locationName) || String(service.locationId || "");

        if (!map.has(locationKey)) {
          map.set(locationKey, {
            key: locationKey,
            locationName,
            addresses: new Set(),
            slotsByDay: ORDERED_DAYS.reduce((accumulator, dayKey) => {
              accumulator[dayKey] = [];
              return accumulator;
            }, {}),
          });
        }

        const bucket = map.get(locationKey);
        if (address) {
          bucket.addresses.add(address);
        }

        const startLabel = formatHourValue(service?.startTime);
        const endLabel = formatHourValue(service?.endTime);
        if (startLabel === "--" || endLabel === "--") {
          continue;
        }

        const range = `${startLabel}-${endLabel}`;
        if (!bucket.slotsByDay[dayOfWeek].includes(range)) {
          bucket.slotsByDay[dayOfWeek].push(range);
        }
      }
    }

    return [...map.values()]
      .map((entry) => ({
        ...entry,
        addresses: [...entry.addresses],
        slotsByDay: ORDERED_DAYS.reduce((accumulator, dayKey) => {
          accumulator[dayKey] = [...entry.slotsByDay[dayKey]].sort((left, right) =>
            String(left).localeCompare(String(right))
          );
          return accumulator;
        }, {}),
      }))
      .sort((left, right) => left.locationName.localeCompare(right.locationName, "fr"));
  }, [weeklySettings]);

  const visibleCities = useMemo(() => {
    const fromSchedule = scheduleByLocation
      .map((entry) => String(entry.locationName || "").trim())
      .filter(Boolean);

    const fromLocations = (Array.isArray(locations) ? locations : [])
      .map((location) => String(location?.name || location?.city || "").trim())
      .filter(Boolean);

    return [...new Set([...fromSchedule, ...fromLocations])].sort((a, b) => a.localeCompare(b, "fr"));
  }, [scheduleByLocation, locations]);

  const title = "Horaires d'ouvertures camion pizza | Emplacements en Moselle";
  const description =
    "Retrouvez les emplacements du camion pizza napolitaine autour de Thionville et Metz, avec horaires de passage hebdomadaires.";

  return (
    <div className="section-shell space-y-8 pb-20 pt-10">
      <SeoHead
        title={title}
        description={description}
        pathname="/planing"
        jsonLd={buildBaseFoodEstablishmentJsonLd({
          pagePath: "/planing",
          pageName: title,
          description,
        })}
      />

      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.25em] text-saffron">Horaires d'ouvertures du camion</p>
        <h1 className="font-display text-4xl uppercase tracking-wide text-white sm:text-5xl">
          Horaires d'ouvertures du camion pizza napolitaine
        </h1>
        <p className="max-w-3xl text-sm text-stone-300 sm:text-base">
          Retrouvez les emplacements et horaires du camion pizza napolitaine autour de Thionville et Metz.
        </p>
      </header>

      <section className="glass-panel p-6">
        <h2 className="font-display text-3xl uppercase tracking-wide text-white">Emplacements du camion pizza</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {scheduleByLocation.length === 0 ? (
            <div className="glass-panel p-5 text-sm text-stone-300">
              Aucun horaire disponible pour le moment.
            </div>
          ) : (
            scheduleByLocation.map((entry) => (
              <article key={entry.key} className="glass-panel p-5">
                <p className="text-[11px] uppercase tracking-wider text-saffron">Nom</p>
                <p className="mt-1 text-lg font-bold text-white">{entry.locationName}</p>

                <p className="mt-3 text-[11px] uppercase tracking-wider text-saffron">Adresse</p>
                {entry.addresses.length > 0 ? (
                  <div className="mt-1 space-y-1">
                    {entry.addresses.map((address) => (
                      <p key={address} className="text-sm text-stone-200">
                        {address}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-stone-200">Adresse a venir</p>
                )}

                <p className="mt-4 text-[11px] uppercase tracking-wider text-saffron">Planning hebdomadaire</p>
                <ul className="mt-2 space-y-1">
                  {ORDERED_DAYS.map((dayKey) => {
                    const hours = Array.isArray(entry?.slotsByDay?.[dayKey])
                      ? entry.slotsByDay[dayKey]
                      : [];
                    return (
                      <li key={`${entry.key}-${dayKey}`} className="flex items-start justify-between gap-4 text-sm">
                        <span className="text-stone-300">{DAY_LABELS[dayKey] || dayKey}</span>
                        <span className="text-right text-stone-100">
                          {hours.length > 0 ? hours.join(" / ") : "Ferme"}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </article>
            ))
          )}
        </div>
        {visibleCities.length > 0 && (
          <ul className="mt-6 flex flex-wrap gap-2">
            {visibleCities.map((city) => (
              <li key={city}>
                <Link
                  to={getCityPath(city)}
                  className="inline-flex rounded-full border border-white/20 px-3 py-1 text-xs text-stone-200 transition hover:border-saffron/70 hover:text-saffron"
                >
                  {city}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <SeoInternalLinks />
    </div>
  );
}
