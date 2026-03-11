import { useEffect, useMemo, useState } from "react";
import SeoHead from "../components/seo/SeoHead";
import SeoInternalLinks from "../components/seo/SeoInternalLinks";
import { getPublicWeeklySettings } from "../api/timeslot.api";
import { buildBaseFoodEstablishmentJsonLd } from "../seo/jsonLd";
import { DEFAULT_TOUR_CITIES, getCityPath } from "../seo/localLandingContent";
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

function formatHourValue(timeValue) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)/.exec(String(timeValue || "").trim());
  if (!match) return "--";
  const hours = match[1];
  const minutes = match[2];
  return minutes === "00" ? `${hours}H` : `${hours}H${minutes}`;
}

function formatHourRange(startTime, endTime) {
  return `${formatHourValue(startTime)}-${formatHourValue(endTime)}`;
}

function formatAddress(location) {
  if (!location) return "";
  const cityLine = `${location.postalCode || ""} ${location.city || ""}`.trim();
  return [location.addressLine1, cityLine].filter(Boolean).join(", ");
}

export default function TourneeCamion() {
  const [weeklySettings, setWeeklySettings] = useState([]);

  useEffect(() => {
    let cancelled = false;

    getPublicWeeklySettings()
      .then((data) => {
        if (!cancelled) {
          setWeeklySettings(Array.isArray(data) ? data : []);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setWeeklySettings([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const schedule = useMemo(() => {
    const rows = (Array.isArray(weeklySettings) ? weeklySettings : []).flatMap(
      (entry, dayIndex) => {
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

        return services
          .filter((service) => service?.location && entry?.dayOfWeek)
          .map((service, serviceIndex) => {
            const locationName = service.location?.name || "Emplacement";
            const address = formatAddress(service.location);
            return {
              key: `${entry.dayOfWeek}-${service.locationId || locationName}-${serviceIndex}`,
              sortKey: `${dayIndex}-${serviceIndex}`,
              locationName,
              address,
              city: service.location?.city || "",
              dayLabel: DAY_LABELS[entry.dayOfWeek] || entry.dayOfWeek,
              hours: formatHourRange(service.startTime, service.endTime),
            };
          });
      }
    );

    return rows.sort((a, b) => String(a.sortKey).localeCompare(String(b.sortKey)));
  }, [weeklySettings]);

  const visibleCities = useMemo(() => {
    const dynamicCities = schedule
      .map((entry) => String(entry.city || "").trim())
      .filter(Boolean);

    return [...new Set([...DEFAULT_TOUR_CITIES, ...dynamicCities])];
  }, [schedule]);

  const title = "Tournee camion pizza | Emplacements en Moselle";
  const description =
    "Retrouvez les emplacements du camion pizza napolitaine autour de Thionville et Metz, avec horaires de passage hebdomadaires.";

  return (
    <div className="section-shell space-y-8 pb-20 pt-10">
      <SeoHead
        title={title}
        description={description}
        pathname="/tournee-camion"
        jsonLd={buildBaseFoodEstablishmentJsonLd({
          pagePath: "/tournee-camion",
          pageName: title,
          description,
        })}
      />

      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.25em] text-saffron">Tournee du camion</p>
        <h1 className="font-display text-4xl uppercase tracking-wide text-white sm:text-5xl">
          Tournee du camion pizza napolitaine
        </h1>
        <p className="max-w-3xl text-sm text-stone-300 sm:text-base">
          Retrouvez les emplacements et horaires du camion pizza napolitaine autour de Thionville et Metz.
        </p>
        <p className="max-w-3xl text-sm text-stone-300 sm:text-base">
          La tournee change chaque semaine avec differents points de retrait dans le nord de la Moselle.
        </p>
      </header>

      <section className="glass-panel p-6">
        <h2 className="font-display text-3xl uppercase tracking-wide text-white">Villes desservies par le camion pizza</h2>
        <p className="mt-3 text-sm text-stone-300">
          Liste statique actuelle, qui sera alimentee automatiquement par les donnees admin de la rubrique tournee du camion.
        </p>
        <ul className="mt-4 flex flex-wrap gap-2">
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
      </section>

      <section className="glass-panel p-6">
        <h2 className="font-display text-3xl uppercase tracking-wide text-white">Emplacements du camion pizza</h2>
        <p className="mt-3 text-sm text-stone-300">
          Le planning est mis a jour regulierement afin d'indiquer les prochains points de retrait du camion pizza.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {schedule.length === 0 ? (
            <div className="glass-panel p-5 text-sm text-stone-300">
              Aucun horaire disponible pour le moment.
            </div>
          ) : (
            schedule.map((entry) => (
              <article key={entry.key} className="glass-panel p-5">
                <p className="text-[11px] uppercase tracking-wider text-saffron">Nom</p>
                <p className="mt-1 text-lg font-bold text-white">{entry.locationName}</p>

                <p className="mt-3 text-[11px] uppercase tracking-wider text-saffron">Adresse</p>
                <p className="mt-1 text-sm text-stone-200">{entry.address || "Adresse a venir"}</p>

                <p className="mt-3 text-[11px] uppercase tracking-wider text-saffron">Jour d'ouverture</p>
                <p className="mt-1 text-sm text-stone-200">{entry.dayLabel}</p>

                <p className="mt-3 text-[11px] uppercase tracking-wider text-saffron">Horaires</p>
                <p className="mt-1 text-sm text-stone-200">{entry.hours}</p>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="glass-panel p-6">
        <h2 className="font-display text-3xl uppercase tracking-wide text-white">Questions frequentes</h2>
        <div className="mt-4 space-y-4">
          <article>
            <h3 className="text-base font-semibold text-white">Ou trouver le camion pizza cette semaine ?</h3>
            <p className="mt-1 text-sm text-stone-300">
              Consultez la tournee du camion pizza pour connaitre les prochains emplacements.
            </p>
          </article>
          <article>
            <h3 className="text-base font-semibold text-white">Le service est-il sur place ou a emporter ?</h3>
            <p className="mt-1 text-sm text-stone-300">
              Les pizzas sont disponibles uniquement a emporter directement au camion.
            </p>
          </article>
        </div>
      </section>

      <SeoInternalLinks />
    </div>
  );
}
