export type SeoProps = {
  title?: string;
  description?: string;
  image?: string; // relative "/og/x.jpg" or absolute "https://..."
  publishedTime?: string; // ISO 8601
  noindex?: boolean;

  structuredData?: {
    // Minimal, erweiterbar
    legalName?: string;
    addressLocality?: string; // Ort
    addressRegion?: string; // Kanton
    postalCode?: string;
    streetAddress?: string;
    emailObfuscated?: string; // optional, wenn du es wirklich brauchst (idR weglassen)
    telephone?: string;
  };
};

type Alternates = {
  deCH: string;
  en: string;
  xDefault: string;
};

export function ensureTrailingSlash(p: string): string {
  if (!p) return "/";
  if (p === "/" || p.endsWith("/")) return p;
  // file-like paths should not be forced
  if (/\.[a-z0-9]+$/i.test(p)) return p;
  return `${p}/`;
}

export function absUrl(site: string, maybeRelativeOrAbs: string): string {
  if (/^https?:\/\//i.test(maybeRelativeOrAbs)) return maybeRelativeOrAbs;
  const path = maybeRelativeOrAbs.startsWith("/") ? maybeRelativeOrAbs : `/${maybeRelativeOrAbs}`;
  return `${site}${path}`;
}

export function buildCanonical(site: string, pathname: string): string {
  const p = ensureTrailingSlash(pathname);
  return `${site}${p}`;
}

/**
 * Map current page between DE and EN (EN lives under /en/...)
 * Canonical stays self-referencing; alternates cross-link.
 */
export function buildAlternate(site: string, pathname: string): Alternates {
  const p = ensureTrailingSlash(pathname);

  const isEn = p === "/en/" || p.startsWith("/en/");
  const dePathRaw = isEn ? p.replace(/^\/en(?=\/|$)/, "") : p;
  const dePath = ensureTrailingSlash(dePathRaw || "/");
  const enPath = dePath === "/" ? "/en/" : ensureTrailingSlash(`/en${dePath}`);

  return {
    deCH: `${site}${dePath}`,
    en: `${site}${enPath}`,
    xDefault: `${site}${dePath}`, // CH/DE als Default
  };
}

/**
 * Breadcrumb labels – keep small & deterministic.
 * Extend as your IA grows.
 */
const LABELS = {
  de: {
    services: "Leistungen",
    shop: "RecVerseShop",
    contact: "Kontakt",
    privacy: "Datenschutz",
    impressum: "Impressum",
    en: "English",
  },
  en: {
    services: "Services",
    shop: "RecVerseShop",
    contact: "Contact",
    privacy: "Privacy",
    impressum: "Legal Notice",
  },
} as const;

function isEnglishPath(pathname: string): boolean {
  return pathname === "/en/" || pathname.startsWith("/en/");
}

function prettyLabel(locale: "de" | "en", segment: string): string {
  const dict = LABELS[locale] as Record<string, string>;
  return dict[segment] ?? segment.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

/**
 * BreadcrumbList JSON-LD based on URL structure.
 * - Removes /en prefix from breadcrumb structure (but keeps correct item URLs per locale)
 * - Valid for Google Rich Results (Breadcrumb).
 */
export function buildBreadcrumbJsonLd(site: string, pathname: string) {
  const p = ensureTrailingSlash(pathname);
  const locale: "de" | "en" = isEnglishPath(p) ? "en" : "de";

  // Split path into segments, excluding empty
  const rawSegments = p.split("/").filter(Boolean);

  // Remove "en" segment from crumb naming, but keep locale for URL building
  const segments = locale === "en" && rawSegments[0] === "en" ? rawSegments.slice(1) : rawSegments;

  const basePrefix = locale === "en" ? "/en" : "";
  const items: Array<{ "@type": "ListItem"; position: number; name: string; item: string }> = [];

  // Home
  items.push({
    "@type": "ListItem",
    position: 1,
    name: locale === "en" ? "Home" : "Start",
    item: `${site}${basePrefix}/`.replace(/\/+$/, "/"),
  });

  let acc = "";
  segments.forEach((seg, idx) => {
    acc += `/${seg}`;
    const url = `${site}${basePrefix}${ensureTrailingSlash(acc)}`;
    items.push({
      "@type": "ListItem",
      position: idx + 2,
      name: prettyLabel(locale, seg),
      item: url,
    });
  });

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items,
  };
}

/**
 * Organization + LocalBusiness (CH focus).
 * Keep minimal, truthful, and consistent across pages.
 */
export function buildOrgJsonLd(site: string, sd?: SeoProps["structuredData"]) {
  const name = "Recverse";
  const legalName = sd?.legalName ?? "Recverse";
  const url = site;

  const locality = sd?.addressLocality ?? "Dietwil";
  const region = sd?.addressRegion ?? "Aargau";
  const postal = sd?.postalCode; // optional
  const street = sd?.streetAddress; // optional

  const address: Record<string, unknown> = {
    "@type": "PostalAddress",
    addressCountry: "CH",
    addressLocality: locality,
    addressRegion: region,
  };
  if (postal) address.postalCode = postal;
  if (street) address.streetAddress = street;

  // Use LocalBusiness only if you truly are a local business entity (you are).
  // If you later register a company, adjust legalName accordingly.
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name,
        legalName,
        url,
      },
      {
        "@type": "LocalBusiness",
        name,
        url,
        address,
        areaServed: {
          "@type": "Country",
          name: "Switzerland",
        },
      },
    ],
  };
}
