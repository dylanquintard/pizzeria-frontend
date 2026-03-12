import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getPublicWeeklySettings } from "../api/timeslot.api";
import SeoHead from "../components/seo/SeoHead";
import SeoInternalLinks from "../components/seo/SeoInternalLinks";
import { buildBaseFoodEstablishmentJsonLd } from "../seo/jsonLd";
import {
  DEFAULT_TOUR_CITIES,
  buildDynamicCityContent,
  getCityPath,
  slugifyCity,
} from "../seo/localLandingContent";

const DAY_LABELS = {
  MONDAY: "Lundi",
  TUESDAY: "Mardi",
  WEDNESDAY: "Mercredi",
  THURSDAY: "Jeudi",
  FRIDAY: "Vendredi",
  SATURDAY: "Samedi",
  SUNDAY: "Dimanche",
};

function toDisplayCity(citySlug) {
  const normalized = String(citySlug || "")
    .replace(/-/g, " ")
    .trim();

  if (!normalized) return "Moselle";
  return normalized
    .split(" ")
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
}

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

function getSeoLocationLabel(location) {
  return String(location?.name || location?.city || "").trim();
}

export default function CitySeoPage() {
  const params = useParams();
  const citySlug = slugifyCity(params.city);
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

  const locationBuckets = useMemo(() => {
    const map = new Map();
    const source = Array.isArray(weeklySettings) ? weeklySettings : [];

    for (const dayEntry of source) {
      const services =
        Array.isArray(dayEntry?.services) && dayEntry.services.length > 0
          ? dayEntry.services
          : dayEntry?.isOpen && dayEntry?.location
            ? [
                {
                  startTime: dayEntry.startTime,
                  endTime: dayEntry.endTime,
                  location: dayEntry.location,
                },
              ]
            : [];

      for (const service of services) {
        const label = getSeoLocationLabel(service?.location);
        const slug = slugifyCity(label);
        if (!slug) continue;

        if (!map.has(slug)) {
          map.set(slug, {
            slug,
            label,
            entries: [],
          });
        }

        const dayLabel = DAY_LABELS[dayEntry?.dayOfWeek] || dayEntry?.dayOfWeek || "";
        const address = formatAddress(service?.location);
        const hours = formatHourRange(service?.startTime, service?.endTime);
        const locationName = service?.location?.name || "Emplacement";
        const dedupeKey = `${locationName}|${address}|${dayLabel}|${hours}`;
        const bucket = map.get(slug);
        const alreadyExists = bucket.entries.some((entry) => entry.key === dedupeKey);

        if (!alreadyExists) {
          bucket.entries.push({
            key: dedupeKey,
            locationName,
            address,
            dayLabel,
            hours,
          });
        }
      }
    }

    return [...map.values()].sort((a, b) => a.label.localeCompare(b.label, "fr"));
  }, [weeklySettings]);

  const currentBucket = useMemo(
    () => locationBuckets.find((bucket) => bucket.slug === citySlug),
    [citySlug, locationBuckets]
  );

  const cityDisplay = currentBucket?.label || toDisplayCity(citySlug);
  const content = useMemo(
    () =>
      buildDynamicCityContent(cityDisplay, {
        locationHighlights: (currentBucket?.entries || []).map((entry) => entry.locationName),
      }),
    [cityDisplay, currentBucket]
  );

  const generatedLocationLinks = useMemo(() => {
    const staticLabels = ["Thionville", "Metz", "Moselle"];
    const dynamicLabels = locationBuckets.map((bucket) => bucket.label);
    const merged = [...staticLabels, ...DEFAULT_TOUR_CITIES, ...dynamicLabels];
    const dedupe = new Map();

    for (const label of merged) {
      const key = slugifyCity(label);
      if (!key || dedupe.has(key)) continue;
      dedupe.set(key, {
        label,
        to: getCityPath(label),
      });
    }

    return [...dedupe.values()].slice(0, 6);
  }, [locationBuckets]);

  return (
    <div className="section-shell space-y-8 pb-20 pt-10">
      <SeoHead
        title={content.title}
        description={content.description}
        pathname={content.pathname}
        jsonLd={buildBaseFoodEstablishmentJsonLd({
          pagePath: content.pathname,
          pageName: content.title,
          description: content.description,
        })}
      />

      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.25em] text-saffron">Page pizza-location dynamique</p>
        <h1 className="font-display text-4xl uppercase tracking-wide text-white sm:text-5xl">{content.h1}</h1>
        <p className="max-w-3xl text-sm text-stone-300 sm:text-base">{content.intro}</p>
      </header>

      {content.sections.map((section) => (
        <section key={section.heading} className="glass-panel p-6">
          <h2 className="text-xl font-bold text-white">{section.heading}</h2>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph} className="mt-3 text-sm leading-7 text-stone-300">
              {paragraph}
            </p>
          ))}
        </section>
      ))}

      {currentBucket?.entries?.length > 0 && (
        <section className="glass-panel p-6">
          <h2 className="text-lg font-bold text-white">Emplacements actifs pour {cityDisplay}</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {currentBucket.entries.slice(0, 6).map((entry) => (
              <article key={entry.key} className="rounded-xl border border-white/15 bg-white/5 p-4">
                <p className="text-sm font-semibold text-white">{entry.locationName}</p>
                <p className="mt-1 text-xs text-stone-300">{entry.address || "Adresse a venir"}</p>
                <p className="mt-2 text-xs text-stone-300">
                  {entry.dayLabel} - {entry.hours}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="glass-panel p-6">
        <h2 className="text-lg font-bold text-white">6 pages pizza-location generees</h2>
        <p className="mt-2 text-sm text-stone-300">
          Ces pages locales sont basees sur les emplacements de la tournee du camion et adaptees au SEO local.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {generatedLocationLinks.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-full border border-white/25 px-3 py-1 text-xs text-stone-200 transition hover:border-saffron/70 hover:text-saffron"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="glass-panel p-6">
        <h2 className="text-lg font-bold text-white">Mots-cles SEO locaux</h2>
        <p className="mt-2 text-xs uppercase tracking-[0.2em] text-saffron">{content.keywordLine}</p>
      </section>

      <section className="glass-panel p-6">
        <h2 className="text-lg font-bold text-white">Commander</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            to="/menu"
            className="rounded-full bg-saffron px-4 py-2 text-xs font-bold uppercase tracking-wide text-charcoal transition hover:bg-yellow-300"
          >
            Voir le menu
          </Link>
          <Link
            to="/tournee-camion"
            className="rounded-full border border-white/30 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
          >
            Voir la tournee
          </Link>
        </div>
      </section>

      <SeoInternalLinks />
    </div>
  );
}

