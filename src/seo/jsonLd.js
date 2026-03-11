import { INSTAGRAM_URL, SITE_URL } from "../config/env";

export function buildBaseFoodEstablishmentJsonLd({
  pagePath = "/",
  pageName = "Pizza Truck",
  description,
  extra = {},
} = {}) {
  const canonical = new URL(pagePath, `${SITE_URL}/`).toString();

  return {
    "@context": "https://schema.org",
    "@type": "FoodEstablishment",
    "@id": canonical,
    name: "Pizza Truck",
    url: canonical,
    description,
    servesCuisine: "Pizza napolitaine",
    areaServed: ["Moselle", "Thionville", "Metz"],
    sameAs: INSTAGRAM_URL ? [INSTAGRAM_URL] : [],
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonical,
      name: pageName,
    },
    ...extra,
  };
}

