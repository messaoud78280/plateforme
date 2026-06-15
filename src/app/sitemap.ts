import type { MetadataRoute } from "next";
import { BLOG_ARTICLES, BLOG_SLUGS, type BlogArticle, type BlogSlug } from "@/content/blog-articles";
import { BLOG_ARTICLES_SEO } from "@/content/blog-articles-seo";
import { RESOURCE_PDF_CATALOG } from "@/content/resource-pdf-catalog";
import { SERVICE_PAGE_ORDER, servicePagePath } from "@/content/service-pages";
import { BTP_PAIN_PAGE_PATHS } from "@/lib/btp-pain-pages";
import { ASSISTANT_TRAVAUX_GEO_PATHS } from "@/lib/assistant-travaux-geo";
import { ASSISTANT_TRAVAUX_VILLE_PATHS } from "@/lib/assistant-travaux-villes";
import { EXTERNALISATION_ADMIN_BT_PATHS } from "@/lib/externalisation-administrative-btp-geo";
import { SITE_URL } from "@/lib/site";

type ChangeFreq = NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;

function entry(
  path: string,
  priority: number,
  changeFrequency: ChangeFreq = "monthly"
): MetadataRoute.Sitemap[number] {
  return {
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  };
}

const BTP_PAIN_SEO_PAGES = (Object.values(BTP_PAIN_PAGE_PATHS) as string[]).map((path) => entry(path, 0.84));

const GEO_EXTERNALISATION_ADMIN_BT_PAGES = (Object.values(EXTERNALISATION_ADMIN_BT_PATHS) as string[]).map((path) =>
  entry(path, 0.86)
);

const GEO_ASSISTANT_TRAVAUX_PAGES = (Object.values(ASSISTANT_TRAVAUX_GEO_PATHS) as string[]).map((path) =>
  entry(path, 0.86)
);

const VILLE_ASSISTANT_TRAVAUX_PAGES = (Object.values(ASSISTANT_TRAVAUX_VILLE_PATHS) as string[]).map((path) =>
  entry(path, 0.82)
);

const SEO_SERVICE_LANDING_PAGES = [
  "/reponse-appel-offres-btp",
  "/facturation-chorus-pro-btp",
  "/gestion-marche-public-btp",
  "/promoteurs-immobiliers",
] as const;

const SERVICE_PAGES_SITEMAP: MetadataRoute.Sitemap = [
  entry("/services", 0.92),
  ...SERVICE_PAGE_ORDER.map((slug) => entry(servicePagePath(slug), 0.88)),
];

/** Pages ressources éditoriales (hors catalogue PDF tutos/guides). */
const RESOURCE_EDITORIAL_PAGES = [
  "/ressources/compte-rendu-chantier",
  "/ressources/planning-chantier-btp",
  "/ressources/analyse-dce-btp",
  "/ressources/memoire-technique-btp",
  "/ressources/chiffrage-devis-btp",
  "/ressources/analyse-dce-chiffrage-btp",
  "/ressources/ppsps-btp",
  "/ressources/pv-levee-reserves-btp",
  "/ressources/doe-btp",
] as const;

const PDF_RESOURCE_PAGES = RESOURCE_PDF_CATALOG.map((r) => entry(r.href, r.kind === "guide" ? 0.83 : 0.81));

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    entry("/", 1, "weekly"),
    entry("/assistant-administratif-externalise", 0.95),
    entry("/assistant-administratif-pme", 0.9),
    entry("/assistant-administratif-btp", 0.9),
    entry("/assistant-administratif-distance", 0.9),
    entry("/externaliser-administratif", 0.92),
    entry("/assistants-administratifs-taches", 0.95, "weekly"),
    entry("/tarifs", 0.9),
    entry("/faq", 0.88),
    entry("/notre-facon-de-travailler", 0.85),
    entry("/cas-clients", 0.75),
    entry("/cas-clients/ccmi-martin-audit-devis", 0.72),
    entry("/contact", 0.8),
    entry("/mentions-legales", 0.35, "yearly"),
    entry("/politique-confidentialite", 0.35, "yearly"),
    entry("/blog", 0.8, "weekly"),
    entry("/ressources", 0.82, "weekly"),
    entry("/ressources/guides", 0.81, "weekly"),
    entry("/ressources/tutos", 0.81, "weekly"),
    entry("/llms.txt", 0.72, "weekly"),
    entry("/ai.txt", 0.72, "weekly"),
    entry("/feed.xml", 0.6, "daily"),
    ...RESOURCE_EDITORIAL_PAGES.map((path) => entry(path, 0.8)),
    ...PDF_RESOURCE_PAGES,
    entry("/relance-devis-btp", 0.85),
    entry("/impayes-btp-relances", 0.8),
    entry("/situation-travaux-btp", 0.8),
    entry("/dict-dt-travaux", 0.8),
    entry("/avenant-chantier", 0.75),
    entry("/suivi-fournisseurs-chantier", 0.75),
    entry("/admin-btp-sans-recruter", 0.85),
    ...BTP_PAIN_SEO_PAGES,
    ...GEO_EXTERNALISATION_ADMIN_BT_PAGES,
    ...GEO_ASSISTANT_TRAVAUX_PAGES,
    ...VILLE_ASSISTANT_TRAVAUX_PAGES,
    ...SEO_SERVICE_LANDING_PAGES.map((path) => entry(path, 0.9)),
    ...SERVICE_PAGES_SITEMAP,
  ];

  const blogPages: MetadataRoute.Sitemap = BLOG_SLUGS.map((slug) => {
    const article = BLOG_ARTICLES[slug as BlogSlug] as BlogArticle;
    const modified = article.modifiedTime ?? article.publishedTime;
    const isSeoCluster = slug in BLOG_ARTICLES_SEO;
    return {
      url: `${SITE_URL}/blog/${slug}`,
      lastModified: new Date(modified),
      changeFrequency: "monthly" as const,
      priority: isSeoCluster ? 0.78 : 0.7,
    };
  });

  return [...staticPages, ...blogPages];
}
