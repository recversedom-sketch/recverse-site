import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

const SITE = "https://www.recverse.ch";

export default defineConfig({
  site: SITE,
  trailingSlash: "always", // verhindert Duplicate Content: /services vs /services/
  integrations: [
    sitemap({
      filter: (page) => {
        // Optional: interne/irrelevante Seiten aus Sitemap ausschliessen
        // Beispiel: wenn du /thanks/ nicht indexieren willst:
        // return !page.pathname.startsWith("/thanks/");
        return true;
      },
    }),
  ],
});
