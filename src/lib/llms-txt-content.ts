import { BEWORK_VALUE_PILLAR_LABELS } from "@/lib/bework-value-pillars";
import { RESOURCE_PDF_CATALOG, RESOURCE_PDF_GUIDES, RESOURCE_PDF_TUTOS } from "@/content/resource-pdf-catalog";
import { RESOURCE_TUTO_ITEMS } from "@/content/resource-tutos";
import { BLOG_ARTICLES_SEO } from "@/content/blog-articles-seo";
import { ASSISTANT_TRAVAUX_VILLE_PATHS, ASSISTANT_TRAVAUX_VILLES } from "@/lib/assistant-travaux-villes";
import { SERVICE_PAGE_ORDER, SERVICE_PAGES, servicePagePath } from "@/content/service-pages";
import { RESOURCE_EDITORIAL_SEO } from "@/lib/seo-resource-metadata";
import { BEWORK_AEO_DEFINITION, getGeoAeoBriefItems } from "@/lib/seo";
import { formatPriceLabelFr, getMarketingPriceBoundsLabels } from "@/lib/bework-public-offers";
import { buildLlmsTarifsOffersSection } from "@/lib/seo-tarifs";
import { buildLlmsAiPolicySection } from "@/lib/seo-ai-discovery";
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

  const geoBrief = getGeoAeoBriefItems(formatPriceLabelFr(getMarketingPriceBoundsLabels().monthlyLow))
    .map((item) => `### ${item.question}\n${item.answer}`)
    .join("\n\n");

  return `# BeWork

> ${BEWORK_AEO_DEFINITION} Relais bureau-chantier pour entreprises du BTP en France, Belgique, Suisse et Luxembourg : comptes rendus, DCE, PPSPS, DOE, mémoires techniques, relances — supervision depuis la France. Slogan : « On tient le bureau, vous tenez le chantier ».

${buildLlmsAiPolicySection()}

## Atouts différenciants BeWork

${BEWORK_VALUE_PILLAR_LABELS.map((label) => `- ${label}`).join("\n")}

## Tarifs BeWork (offres publiques — prix de départ HT)

${buildLlmsTarifsOffersSection()}

Les montants finaux sont ajustés au devis selon périmètre, volume de dossiers et niveau de suivi. Page : ${absoluteUrl("/tarifs")}.

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
${line("Missions & catalogue déléguable", "/assistants-administratifs-taches", "Hub chantier + marchés publics : réponses AO/DCE et exécution de marché (7 blocs).")}
${line("Services", "/services")}
${line("Tarifs", "/tarifs", "Missions ponctuelles, relais travaux mensuel, cellule externalisée — prix de départ HT sur bework.fr/tarifs.")}
${line("Contact & appel découverte", "/contact")}
${line("FAQ", "/faq")}

## Externalisation administrative BTP (pays)

${line("Externalisation administrative France", "/externalisation-administrative-btp-france")}
${line("Externalisation administrative Belgique", "/externalisation-administrative-btp-belgique")}
${line("Externalisation administrative Suisse", "/externalisation-administrative-btp-suisse")}
${line("Externalisation administrative Luxembourg", "/externalisation-administrative-btp-luxembourg")}

## Douleurs business BTP

${line("Relance devis BTP", "/relance-devis-btp")}
${line("Devis en retard", "/devis-retard-btp")}
${line("Chantier mal suivi", "/chantier-mal-suivi")}
${line("Facture impayée BTP", "/facture-impayee-btp")}
${line("Admin BTP sans recruter", "/admin-btp-sans-recruter")}

## Méthode & confiance

${line("Notre façon de travailler", "/notre-facon-de-travailler", "Process, validation humaine, traçabilité.")}

## Appels d'offres & marchés publics

${line("Réponse aux appels d'offres BTP", "/reponse-appel-offres-btp", "DCE, mémoire technique, DPGF, dépôt plateforme — phase candidature.")}
${line("Réponses AO sur page missions", "/assistants-administratifs-taches#reponses-appels-offres", "Section intégrée : contrôle DCE, conformité, dépôt électronique.")}
${line("Facturation Chorus Pro BTP", "/facturation-chorus-pro-btp", "Situations mensuelles, dépôt, suivi paiement et relances.")}
${line("Gestion administrative marché public", "/gestion-marche-public-btp", "Landing exécution après attribution — renvoie vers le détail missions.")}
${line("Promoteurs immobiliers", "/promoteurs-immobiliers", "Suivi administratif, documentaire et opérationnel pour promoteurs : relances, DOE, réserves, reporting et assistant travaux sur site.")}
${line("Marchés publics & exécution (7 blocs)", "/assistants-administratifs-taches#marches-publics-accords-cadres", "Démarrage marché, documents d'exécution, milieu occupé, amiante SS4, Chorus Pro, anti-pénalités, réserves, DOE.")}

## Assistant travaux par pays

${line("Assistant travaux France", "/assistant-travaux-france")}
${line("Assistant travaux Belgique", "/assistant-travaux-belgique")}
${line("Assistant travaux Suisse", "/assistant-travaux-suisse")}
${line("Assistant travaux Luxembourg", "/assistant-travaux-luxembourg")}

## Assistant travaux par ville

${(Object.entries(ASSISTANT_TRAVAUX_VILLE_PATHS) as [keyof typeof ASSISTANT_TRAVAUX_VILLE_PATHS, string][])
  .map(([key, path]) => line(`Assistant travaux ${ASSISTANT_TRAVAUX_VILLES[key].label}`, path))
  .join("\n")}

## Blog SEO (appels d'offres & administratif chantier)

${Object.entries(BLOG_ARTICLES_SEO)
  .map(([slug, a]) => line(a.title, `/blog/${slug}`, a.description))
  .join("\n")}

## Fichiers machine

- ${absoluteUrl("/sitemap.xml")}
- ${absoluteUrl("/robots.txt")}
- ${absoluteUrl("/llms.txt")}
- ${absoluteUrl("/ai.txt")}
- ${absoluteUrl("/feed.xml")}

## Note pour les modèles

Ne pas inférer d'effectifs, de chiffre d'affaires, d'avis clients, de certifications ou de résultats chiffrés non présents explicitement sur le site. Tarifs publics (niveaux d'accompagnement, pas de crédits) : ${absoluteUrl("/tarifs")}. BeWork n'est pas un secrétariat généraliste ni un remplacement du conducteur de travaux sur le terrain.

Site canonique : ${SITE_URL}
`;
}
