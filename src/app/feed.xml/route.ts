import { NextResponse } from "next/server";
import { TRAINING_OFFERS } from "@/lib/bework-formation";
import { absoluteUrl } from "@/lib/site";

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

const FEED_PAGES = [
  {
    path: "/formation",
    title: "Formation BeWork — Créer avec l’IA sans savoir coder",
    description: `Un parcours progressif de ${TRAINING_OFFERS.essential.hours} h ou ${TRAINING_OFFERS.complete.hours} h pour apprendre à commencer, puis construire plus loin.`,
  },
  {
    path: "/tarifs",
    title: "Parcours et tarifs BeWork",
    description: `${TRAINING_OFFERS.essential.hours} h à ${TRAINING_OFFERS.essential.price} € ou ${TRAINING_OFFERS.complete.hours} h à ${TRAINING_OFFERS.complete.price} € par participant.`,
  },
  {
    path: "/demonstrations",
    title: "Démonstrations BeWork",
    description: "Des exemples concrets de sites, applications et outils numériques pour comprendre les possibilités.",
  },
  {
    path: "/faq",
    title: "FAQ — Formation BeWork",
    description: "Prérequis, déroulement, parcours, modalités et réponses utiles avant de participer.",
  },
] as const;

/** Flux RSS 2.0 du site public — uniquement les ressources formation actives. */
export function GET() {
  const channelTitle = "BeWork — Formation création avec l’IA";
  const channelLink = absoluteUrl("/");
  const channelDescription =
    "Apprendre à créer des sites, applications et outils numériques avec l’intelligence artificielle, sans prérequis en programmation.";

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
