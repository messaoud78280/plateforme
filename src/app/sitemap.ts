import type { MetadataRoute } from "next";
import { BLOG_ARTICLES, BLOG_SLUGS, type BlogArticle, type BlogSlug } from "@/content/blog-slugs";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 1 },
    { url: `${SITE_URL}/assistant-administratif-externalise`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.9 },
    { url: `${SITE_URL}/assistant-administratif-pme`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.9 },
    { url: `${SITE_URL}/assistant-administratif-btp`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.9 },
    { url: `${SITE_URL}/assistant-administratif-immobilier`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.9 },
    { url: `${SITE_URL}/assistant-administratif-distance`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.9 },
    { url: `${SITE_URL}/externaliser-administratif`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.9 },
    { url: `${SITE_URL}/assistants-administratifs-taches`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.8 },
    { url: `${SITE_URL}/tarifs`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.9 },
    { url: `${SITE_URL}/faq`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.7 },
    { url: `${SITE_URL}/notre-facon-de-travailler`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.85 },
    { url: `${SITE_URL}/contact`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.8 },
    { url: `${SITE_URL}/inscription`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.8 },
    { url: `${SITE_URL}/connexion`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.6 },
    { url: `${SITE_URL}/blog`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.8 },
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
