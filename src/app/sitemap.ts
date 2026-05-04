import type { MetadataRoute } from "next";
import { BLOG_ARTICLES, BLOG_SLUGS, type BlogArticle, type BlogSlug } from "@/content/blog-slugs";
import { BTP_PAIN_PAGE_PATHS } from "@/lib/btp-pain-pages";
import { EXTERNALISATION_ADMIN_BT_PATHS } from "@/lib/externalisation-administrative-btp-geo";
import { SITE_URL } from "@/lib/site";

const BTP_PAIN_SEO_PAGES: MetadataRoute.Sitemap = (
  Object.values(BTP_PAIN_PAGE_PATHS) as string[]
).map((path) => ({
  url: `${SITE_URL}${path}`,
  lastModified: new Date(),
  changeFrequency: "monthly" as const,
  priority: 0.84,
}));

const GEO_EXTERNALISATION_ADMIN_BT_PAGES: MetadataRoute.Sitemap = (
  Object.values(EXTERNALISATION_ADMIN_BT_PATHS) as string[]
).map((path) => ({
  url: `${SITE_URL}${path}`,
  lastModified: new Date(),
  changeFrequency: "monthly" as const,
  priority: path.endsWith("-europe") ? 0.88 : 0.86,
}));

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 1 },
    {
      url: `${SITE_URL}/assistant-administratif-externalise`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.95,
    },
    { url: `${SITE_URL}/assistant-administratif-pme`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.9 },
    { url: `${SITE_URL}/assistant-administratif-btp`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.9 },
    { url: `${SITE_URL}/assistant-administratif-distance`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.9 },
    { url: `${SITE_URL}/externaliser-administratif`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.92 },
    { url: `${SITE_URL}/assistants-administratifs-taches`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.8 },
    { url: `${SITE_URL}/tarifs`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.9 },
    { url: `${SITE_URL}/faq`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.7 },
    { url: `${SITE_URL}/notre-facon-de-travailler`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.85 },
    { url: `${SITE_URL}/cas-clients`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.75 },
    { url: `${SITE_URL}/contact`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.8 },
    { url: `${SITE_URL}/inscription`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.8 },
    { url: `${SITE_URL}/connexion`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.6 },
    { url: `${SITE_URL}/blog`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.8 },
    // Pages intentionnelles (SEO)
    { url: `${SITE_URL}/relance-devis-btp`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.85 },
    { url: `${SITE_URL}/impayes-btp-relances`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.8 },
    { url: `${SITE_URL}/situation-travaux-btp`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.8 },
    { url: `${SITE_URL}/dict-dt-travaux`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.8 },
    { url: `${SITE_URL}/avenant-chantier`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.75 },
    { url: `${SITE_URL}/suivi-fournisseurs-chantier`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.75 },
    { url: `${SITE_URL}/admin-btp-sans-recruter`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.85 },
    ...BTP_PAIN_SEO_PAGES,
    ...GEO_EXTERNALISATION_ADMIN_BT_PAGES,
  ];

  const blogPages: MetadataRoute.Sitemap = BLOG_SLUGS.map((slug) => {
    const article = BLOG_ARTICLES[slug as BlogSlug] as BlogArticle;
    const modified = article.modifiedTime ?? article.publishedTime;
    return {
      url: `${SITE_URL}/blog/${slug}`,
      lastModified: new Date(modified),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    };
  });

  return [...staticPages, ...blogPages];
}
