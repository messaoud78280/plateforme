import { NextResponse } from "next/server";
import { BLOG_ARTICLES, BLOG_SLUGS } from "@/content/blog-articles";
import { SITE_URL, absoluteUrl } from "@/lib/site";

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Flux RSS 2.0 — blog + annonce site (Google, Bing, Apple News, agrégateurs). */
export async function GET() {
  const channelTitle = "BeWork — Blog AO & administratif BTP";
  const channelLink = absoluteUrl("/blog");
  const channelDescription =
    "Guides BeWork : candidatures, analyse DCE, suivi admin des marchés et organisation bureau-chantier pour le BTP.";

  const items = BLOG_SLUGS.map((slug) => {
    const article = BLOG_ARTICLES[slug];
    if (!article) return "";
    const link = absoluteUrl(`/blog/${slug}`);
    const pubDate = new Date(article.publishedTime).toUTCString();
    return `    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <description>${escapeXml(article.description)}</description>
      <pubDate>${pubDate}</pubDate>
    </item>`;
  }).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(channelTitle)}</title>
    <link>${escapeXml(channelLink)}</link>
    <description>${escapeXml(channelDescription)}</description>
    <language>fr-fr</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${escapeXml(absoluteUrl("/feed.xml"))}" rel="self" type="application/rss+xml"/>
    <item>
      <title>BeWork — Renfort assistants travaux BTP</title>
      <link>${escapeXml(SITE_URL)}</link>
      <guid isPermaLink="true">${escapeXml(SITE_URL)}</guid>
      <description>Assistants travaux spécialisés : préparation candidatures, analyse DCE et suivi administratif des marchés — sous validation du client.</description>
      <pubDate>${new Date().toUTCString()}</pubDate>
    </item>
${items}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
