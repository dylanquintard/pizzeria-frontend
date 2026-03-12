import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getPublicWeeklySettings } from "../api/timeslot.api";
import SeoHead from "../components/seo/SeoHead";
import SeoInternalLinks from "../components/seo/SeoInternalLinks";
import { buildBaseFoodEstablishmentJsonLd } from "../seo/jsonLd";
import {
  buildDynamicCityContent,
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

export default function CitySeoPage({ forcedCitySlug = "" }) {
  const params = useParams();
  const rawCity = forcedCitySlug || params.city || params["*"] || "";
  const citySlug = slugifyCity(rawCity);
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
        <h1 className="font-display text-4xl uppercase tracking-wide text-white sm:text-5xl">{content.h1}</h1>
        {Array.isArray(content.introParagraphs) && content.introParagraphs.length > 0 ? (
          content.introParagraphs.map((paragraph, index) => (
            <p key={`intro-${index}`} className="max-w-3xl text-sm text-stone-300 sm:text-base">
              {paragraph}
            </p>
          ))
        ) : (
          <p className="max-w-3xl text-sm text-stone-300 sm:text-base">{content.intro}</p>
        )}
      </header>

      {content.sections.map((section) => (
        <section key={section.heading} className="glass-panel p-6">
          <h2 className="text-xl font-bold text-white">{section.heading}</h2>
          {section.paragraphs.map((paragraph, index) => (
            <p key={`${section.heading}-${index}`} className="mt-3 text-sm leading-7 text-stone-300">
              {paragraph}
            </p>
          ))}
        </section>
      ))}

      {currentBucket?.entries?.length > 0 && (
        <section className="glass-panel p-6">
          <h2 className="text-lg font-bold text-white">
            {content?.nearbySection?.heading || `Prochains emplacements a ${cityDisplay}`}
          </h2>
          <p className="mt-3 text-sm text-stone-300">
            {content?.nearbySection?.lead || "Exemples d'emplacements actifs :"}
          </p>
          <ul className="mt-3 grid gap-2 md:grid-cols-2">
            {currentBucket.entries.slice(0, 6).map((entry) => (
              <li key={entry.key} className="rounded-xl border border-white/15 bg-white/5 p-4 text-sm text-stone-200">
                <p className="font-semibold text-white">{entry.locationName}</p>
                <p className="mt-1 text-xs text-stone-300">{entry.address || "Adresse a venir"}</p>
                <p className="mt-1 text-xs text-stone-300">
                  {entry.dayLabel} - {entry.hours}
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-stone-300">
            {content?.nearbySection?.footer ||
              "Consultez la page horaires d'ouvertures pour connaitre les prochains passages du camion pizza."}
          </p>
        </section>
      )}

      {Array.isArray(content.faq) && content.faq.length > 0 && (
        <section className="glass-panel p-6">
          <h2 className="text-lg font-bold text-white">Questions frequentes</h2>
          <div className="mt-4 space-y-4">
            {content.faq.map((item, index) => (
              <article key={`faq-${index}`} className="rounded-xl border border-white/15 bg-white/5 p-4">
                <h3 className="text-sm font-semibold text-white">{item.question}</h3>
                <p className="mt-2 text-sm text-stone-300">{item.answer}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="glass-panel p-6">
        <h2 className="text-lg font-bold text-white">Commander votre pizza</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            to="/menu"
            className="rounded-full bg-saffron px-4 py-2 text-xs font-bold uppercase tracking-wide text-charcoal transition hover:bg-yellow-300"
          >
            Voir le menu des pizzas
          </Link>
          <Link
            to="/planing"
            className="rounded-full border border-white/30 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
          >
            Consulter les horaires d'ouvertures du camion pizza
          </Link>
        </div>
      </section>

      <SeoInternalLinks />
    </div>
  );
}
