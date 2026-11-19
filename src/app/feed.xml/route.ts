import { NextResponse } from "next/server";
import { absoluteUrl } from "@/lib/site";

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Flux RSS — pages commerciales BTP (plus de funnel formation IA). */
const FEED_PAGES = [
  {
    path: "/",
    title: "BeWork | Conduite de travaux externalisée & ingénierie BTP",
    description:
      "Conduite de travaux externalisée, équipes TP/VRD en régie, ingénierie et marchés BTP.",
  },
  {
    path: "/conduite-de-travaux",
    title: "Conduite de travaux externalisée",
    description:
      "Conducteur de travaux externalisé, chef de chantier en régie et pilotage de chantier.",
  },
  {
    path: "/equipes-tp-vrd",
    title: "Équipes TP/VRD en régie",
    description:
      "Chefs d’équipe et maçons VRD pour renforcer les chantiers TP, voirie et réseaux.",
  },
  {
    path: "/ingenierie-et-marches-btp",
    title: "Ingénierie et marchés BTP",
    description:
      "Études, métrés, analyse DCE et assistance aux appels d’offres publics et privés.",
  },
  {
    path: "/formation-professionnelle-btp",
    title: "Formation professionnelle BTP",
    description:
      "Formations pratiques sur chantier pour conducteurs, chefs d’équipe et compagnons.",
  },
  {
    path: "/demande-de-devis",
    title: "Demande de devis BTP",
    description:
      "Demandez un conducteur de travaux, une équipe TP/VRD ou une assistance marchés.",
  },
] as const;

export function GET() {
  const channelTitle = "BeWork — Conduite de travaux & équipes BTP";
  const channelLink = absoluteUrl("/");
  const channelDescription =
    "BeWork accompagne les entreprises du BTP : conduite de travaux externalisée, équipes TP/VRD en régie, ingénierie, marchés publics et formation sur chantier.";

  const items = FEED_PAGES.map((page) => {
    const link = absoluteUrl(page.path);
    return `    <item>
      <title>${escapeXml(page.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <description>${escapeXml(page.description)}</description>
    </item>`;
  }).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(channelTitle)}</title>
    <link>${escapeXml(channelLink)}</link>
    <description>${escapeXml(channelDescription)}</description>
    <language>fr-fr</language>
    <atom:link href="${escapeXml(absoluteUrl("/feed.xml"))}" rel="self" type="application/rss+xml"/>
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
