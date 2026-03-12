import { Helmet } from "react-helmet-async";
import { SITE_URL } from "../../config/env";

function buildCanonical(pathname = "/") {
  try {
    return new URL(pathname, `${SITE_URL}/`).toString();
  } catch (_err) {
    return SITE_URL;
  }
}

export default function SeoHead({
  title,
  description,
  pathname = "/",
  image = "/pizza-background-1920.webp",
  ogType = "website",
  robots = "index,follow",
  jsonLd = null,
}) {
  const canonical = buildCanonical(pathname);
  const absoluteImage = image.startsWith("http")
    ? image
    : `${SITE_URL}${image.startsWith("/") ? image : `/${image}`}`;
  const jsonLdEntries = Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : [];

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={robots} />
      <link rel="canonical" href={canonical} />

      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content="Pizza Truck" />
      <meta property="og:locale" content="fr_FR" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={absoluteImage} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={absoluteImage} />

      {jsonLdEntries.map((entry, index) => (
        <script
          key={`jsonld-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(entry) }}
        />
      ))}
    </Helmet>
  );
}
