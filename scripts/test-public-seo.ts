import assert from "node:assert/strict";
import sitemap from "../src/app/sitemap";
import robots from "../src/app/robots";
import { TRAINING_OFFERS } from "../src/lib/bework-formation";
import {
  beworkCourseJsonLd,
  SEO_PAGES,
} from "../src/lib/seo-formation-pages";
import { SITE_URL } from "../src/lib/site";

assert.equal(TRAINING_OFFERS.essential.hours, 7);
assert.equal(TRAINING_OFFERS.essential.price, 300);
assert.equal(TRAINING_OFFERS.complete.hours, 14);
assert.equal(TRAINING_OFFERS.complete.price, 600);

const sitemapEntries = sitemap();
const sitemapUrls = sitemapEntries.map((entry) => entry.url);
assert.equal(new Set(sitemapUrls).size, sitemapUrls.length, "Le sitemap contient des doublons.");
assert.ok(
  sitemapUrls.every((url) => url.startsWith(`${SITE_URL}/`) || url === SITE_URL),
  "Toutes les URLs du sitemap doivent utiliser le domaine canonique.",
);
assert.ok(
  sitemapUrls.every(
    (url) => {
      const pathname = new URL(url).pathname;
      return !["/dashboard", "/admin", "/connexion", "/api/"].some(
        (prefix) => pathname === prefix.replace(/\/$/, "") || pathname.startsWith(prefix),
      );
    },
  ),
  "Le sitemap ne doit contenir aucune route privée.",
);

const robotsConfig = robots();
const robotsRules = Array.isArray(robotsConfig.rules)
  ? robotsConfig.rules
  : [robotsConfig.rules];
const disallow = robotsRules.flatMap((rule) => {
  if (!rule?.disallow) return [];
  return Array.isArray(rule.disallow) ? rule.disallow : [rule.disallow];
});

for (const privatePath of ["/admin", "/dashboard", "/api/"]) {
  assert.ok(disallow.includes(privatePath), `${privatePath} doit être bloqué dans robots.txt.`);
}
for (const retiredPublicPath of ["/blog", "/ressources/", "/services/"]) {
  assert.ok(
    !disallow.includes(retiredPublicPath),
    `${retiredPublicPath} doit rester crawlable pour exposer sa redirection ou son statut 410.`,
  );
}

const pageDescriptions = Object.values(SEO_PAGES).map((page) => page.description);
assert.equal(
  new Set(pageDescriptions).size,
  pageDescriptions.length,
  "Chaque page majeure doit avoir une meta description unique.",
);
for (const description of pageDescriptions) {
  assert.ok(
    description.length >= 80 && description.length <= 160,
    `Meta description hors plage utile : ${description.length} caractères.`,
  );
}
const pageTitles = Object.values(SEO_PAGES).map(
  (page) => ("absoluteTitle" in page ? page.absoluteTitle : page.title),
);
assert.equal(
  new Set(pageTitles).size,
  pageTitles.length,
  "Chaque page majeure doit avoir un title unique.",
);

const course = beworkCourseJsonLd();
assert.equal(course["@id"], `${SITE_URL}/formation#course`);
assert.ok(!("hasCourseInstance" in course), "Ne pas inventer de sessions CourseInstance.");
const offers = course.offers as Array<Record<string, unknown>>;
assert.deepEqual(
  offers.map((offer) => [offer.price, offer.priceCurrency]),
  [
    ["300", "EUR"],
    ["600", "EUR"],
  ],
);

console.info(
  `SEO public : ${sitemapEntries.length} URLs canoniques, offre et schemas validés.`,
);
