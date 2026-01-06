export const i18n = {
  de: {
    nav_home: "Start",
    nav_services: "Leistungen",
    nav_shop: "RecVerseShop",
    nav_contact: "Kontakt",
    cta: "Brainstorming starten",
    cta_secondary: "Leistungen ansehen",
    lang_de: "DE",
    lang_en: "EN",
  },
  en: {
    nav_home: "Home",
    nav_services: "Services",
    nav_shop: "RecVerseShop",
    nav_contact: "Contact",
    cta: "Start brainstorming",
    cta_secondary: "View services",
    lang_de: "DE",
    lang_en: "EN",
  },
} as const;

export type Locale = keyof typeof i18n;

export function getLocale(pathname: string): Locale {
  return pathname === "/en" || pathname.startsWith("/en/") ? "en" : "de";
}

export function t(locale: Locale, key: keyof (typeof i18n)["de"]): string {
  return i18n[locale][key];
}

export function getAltPath(pathname: string, target: Locale): string {
  const p = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const isEn = p === "/en" || p.startsWith("/en/");

  if (target === "en") {
    if (isEn) return p === "/en" ? "/en/" : p;
    return p === "/" ? "/en/" : `/en${p}`;
  } else {
    if (!isEn) return p;
    const stripped = p.replace(/^\/en(?=\/|$)/, "");
    return stripped === "" ? "/" : stripped;
  }
}
