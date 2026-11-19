import assert from "node:assert/strict";
import sitemap from "../src/app/sitemap";
import robots from "../src/app/robots";
import { BTP_SEO_PAGES } from "../src/lib/bework-btp-services";
import {
  isBeworkFormationBtpAllowlisted,
  isBeworkFormationCommercialPath,
  resolveLegacyMarketingRedirect,
} from "../src/lib/bework-v3-public-gate";
import { getIndexNowPriorityUrls } from "../src/lib/seo-ai-discovery";
import { SITE_URL } from "../src/lib/site";

const sitemapEntries = sitemap();
const sitemapUrls = sitemapEntries.map((entry) => entry.url);
assert.equal(new Set(sitemapUrls).size, sitemapUrls.length, "Le sitemap contient des doublons.");
assert.ok(
  sitemapUrls.every((url) => url.startsWith(`${SITE_URL}/`) || url === SITE_URL),
  "Toutes les URLs du sitemap doivent utiliser le domaine canonique.",
);
assert.ok(
  sitemapUrls.every((url) => {
    const pathname = new URL(url).pathname;
    return !["/dashboard", "/admin", "/connexion", "/api/"].some(
      (prefix) =>
        pathname === prefix.replace(/\/$/, "") || pathname.startsWith(prefix),
    );
  }),
  "Le sitemap ne doit contenir aucune route privée.",
);

for (const required of [
  "/",
  "/conduite-de-travaux",
  "/equipes-tp-vrd",
  "/ingenierie-et-marches-btp",
  "/formation-professionnelle-btp",
  "/demande-de-devis",
]) {
  assert.ok(
    sitemapUrls.includes(`${SITE_URL}${required === "/" ? "" : required}`) ||
      sitemapUrls.includes(`${SITE_URL}${required}`),
    `Sitemap doit inclure ${required}`,
  );
}

const robotsConfig = robots();
const robotsRules = Array.isArray(robotsConfig.rules)
  ? robotsConfig.rules
  : [robotsConfig.rules];
assert.ok(robotsRules.length > 1, "robots.txt doit exposer plusieurs user-agents.");

const disallow = robotsRules.flatMap((rule) => {
  if (!rule?.disallow) return [];
  return Array.isArray(rule.disallow) ? rule.disallow : [rule.disallow];
});

for (const privatePath of ["/admin", "/dashboard", "/api/"]) {
  assert.ok(disallow.includes(privatePath), `${privatePath} doit être bloqué dans robots.txt.`);
}

const pageDescriptions = Object.values(BTP_SEO_PAGES).map((page) => page.description);
assert.equal(
  new Set(pageDescriptions).size,
  pageDescriptions.length,
  "Chaque page BTP_SEO_PAGES doit avoir une meta description unique.",
);
for (const description of pageDescriptions) {
  assert.ok(
    description.length >= 80 && description.length <= 170,
    `Meta description hors plage utile : ${description.length} caractères — ${description.slice(0, 40)}…`,
  );
}

const pageTitles = Object.values(BTP_SEO_PAGES).map((page) =>
  "absoluteTitle" in page && page.absoluteTitle ? page.absoluteTitle : page.title,
);
assert.equal(
  new Set(pageTitles).size,
  pageTitles.length,
  "Chaque page BTP_SEO_PAGES doit avoir un title unique.",
);

assert.equal(isBeworkFormationCommercialPath("/formation"), true);
assert.equal(isBeworkFormationCommercialPath("/formation-professionnelle-btp"), false);
assert.equal(isBeworkFormationBtpAllowlisted("/formation-conducteur-de-travaux"), true);
assert.equal(
  resolveLegacyMarketingRedirect("/formation"),
  "/formation-professionnelle-btp",
);
assert.equal(resolveLegacyMarketingRedirect("/pour-qui"), "/a-propos");
assert.equal(resolveLegacyMarketingRedirect("/tarifs"), "/demande-de-devis");
assert.equal(resolveLegacyMarketingRedirect("/faq"), "/contact");

const indexNow = getIndexNowPriorityUrls();
assert.ok(
  indexNow.some((u) => u.endsWith("/conduite-de-travaux")),
  "IndexNow doit prioriser la conduite de travaux.",
);
assert.ok(
  indexNow.some((u) => u.endsWith("/equipes-tp-vrd")),
  "IndexNow doit prioriser les équipes TP/VRD.",
);

console.info(
  `SEO public BTP : ${sitemapEntries.length} URLs, ${Object.keys(BTP_SEO_PAGES).length} pages meta, IndexNow ${indexNow.length} URLs.`,
);
