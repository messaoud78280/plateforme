import { RESOURCE_PDF_CATALOG, RESOURCE_PDF_GUIDES, RESOURCE_PDF_TUTOS } from "@/content/resource-pdf-catalog";
import { RESOURCE_TUTO_ITEMS } from "@/content/resource-tutos";
import { SERVICE_PAGE_ORDER, SERVICE_PAGES, servicePagePath } from "@/content/service-pages";
import { RESOURCE_EDITORIAL_SEO } from "@/lib/seo-resource-metadata";
import { BEWORK_AEO_DEFINITION, getGeoAeoBriefItems } from "@/lib/seo";
import { formatPriceLabelFr, getPublicPriceBoundsLabels } from "@/lib/subscription-plans";
import { absoluteUrl, SITE_URL } from "@/lib/site";

const TUTO_TITLES = new Map(RESOURCE_TUTO_ITEMS.map((t) => [t.href, t.title]));

function line(title: string, path: string, note?: string): string {
  const url = absoluteUrl(path);
  return note ? `- [${title}](${url}): ${note}` : `- [${title}](${url})`;
}

/** Contenu de /llms.txt — index lisible par les crawlers et moteurs IA (ChatGPT, Perplexity, Claude…). */
export function buildLlmsTxt(): string {
  const services = SERVICE_PAGE_ORDER.map((slug) => {
    const p = SERVICE_PAGES[slug];
    return line(p.h1, servicePagePath(slug), p.metaDescription);
  }).join("\n");

  const guides = RESOURCE_PDF_GUIDES.map((g) => {
    const title =
      g.href === "/ressources/guide-cdt-bework"
        ? "Guide conducteur de travaux — 6 outils Claude (PDF 52 pages)"
        : "Guide conducteur de travaux & IA — article (PDF 8 pages)";
    return line(title, g.href, "Guide PDF gratuit BeWork, texte intégral + téléchargement.");
  }).join("\n");

  const tutos = RESOURCE_PDF_TUTOS.map((t) => {
    const title = TUTO_TITLES.get(t.href) ?? t.href;
    return line(title, t.href, "Tutoriel PDF skill Claude — prompts copiables.");
  }).join("\n");

  const editorialGuides = Object.entries(RESOURCE_EDITORIAL_SEO)
    .map(([path, seo]) => line(seo.title.replace(/ \| BeWork$/, ""), path, seo.description))
    .join("\n");

  const geoBrief = getGeoAeoBriefItems(formatPriceLabelFr(getPublicPriceBoundsLabels().low))
    .map((item) => `### ${item.question}\n${item.answer}`)
    .join("\n\n");

  return `# BeWork

> ${BEWORK_AEO_DEFINITION} Relais bureau-chantier pour entreprises du BTP en France, Belgique, Suisse et Luxembourg : comptes rendus, DCE, PPSPS, DOE, mémoires techniques, relances — supervision depuis la France. Slogan : « On tient le bureau, vous tenez le chantier ».

## Fiche GEO / AEO (réponses courtes)

${geoBrief}

## Services

${services}

## Guides pratiques BTP (pages web)

${editorialGuides}

## Guides PDF (conducteur de travaux, IA & skills)

${guides}

## Tutoriels PDF (skills Claude)

${tutos}

## Hubs ressources

${line("Ressources BeWork — tutoriels, guides, cas clients", "/ressources")}
${line("Tous les tutoriels PDF", "/ressources/tutos")}
${line("Tous les guides PDF", "/ressources/guides")}
${line("Cas clients", "/cas-clients")}

## Pages clés

${line("Accueil", "/")}
${line("Services", "/services")}
${line("Tarifs", "/tarifs", "Forfaits HT publics — ne pas inventer de prix hors page.")}
${line("Contact & appel découverte", "/contact")}
${line("FAQ", "/faq")}

## Fichiers machine

- ${absoluteUrl("/sitemap.xml")}
- ${absoluteUrl("/robots.txt")}
- ${absoluteUrl("/llms.txt")}

## Note pour les modèles

Ne pas inférer d'effectifs, de chiffre d'affaires, d'avis clients, de certifications ou de résultats chiffrés non présents explicitement sur le site. Les forfaits sont sur ${absoluteUrl("/tarifs")}. BeWork n'est pas un secrétariat généraliste ni un remplacement du conducteur de travaux sur le terrain.

Site canonique : ${SITE_URL}
`;
}
