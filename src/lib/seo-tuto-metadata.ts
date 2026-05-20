/**
 * Métadonnées SEO — tutoriels PDF / skills Claude (/ressources/tuto-*).
 * Descriptions ~140–160 car. · hreflang francophonie (FR, BE, CH, LU).
 */
import type { Metadata } from "next";
import {
  SEO_KEYWORDS_FRANCOPHONIE,
  SEO_OG_ALTERNATE_LOCALES,
  SEO_OG_LOCALE_PRIMARY,
  hreflangFrancophonieLanguages,
  metaDescriptionFrancophonie,
} from "@/lib/seo-francophonie";
import { SEO_PUBLIC_ROBOTS } from "@/lib/seo-search-engines";
import { absoluteUrl } from "@/lib/site";

const defaultOgImage = absoluteUrl("/opengraph-image");

function tutoDesc(core: string): string {
  return metaDescriptionFrancophonie(core);
}

export type TutoPageSeo = {
  title: string;
  description: string;
  keywords?: string[];
};

export const TUTO_PAGE_SEO: Record<string, TutoPageSeo> = {
  "/ressources/tuto-skill-ppsps-bework": {
    title: "Skill PPSPS BTP : tutoriel Claude et prompts | BeWork",
    description: tutoDesc(
      "Skill PPSPS : 9 rubriques, prompts copiables et PDF gratuit. Structurer votre plan sécurité chantier avec Claude",
    ),
    keywords: ["skill PPSPS", "PPSPS BTP tutoriel", "Claude BTP sécurité", ...SEO_KEYWORDS_FRANCOPHONIE.slice(0, 2)],
  },
  "/ressources/tuto-skill-doe-bework": {
    title: "Skill DOE BTP : tutoriel Claude et checklist | BeWork",
    description: tutoDesc(
      "Skill DOE : rubriques CCAG, sommaire Word et prompts. Préparer le dossier des ouvrages exécutés sans oubli",
    ),
    keywords: ["skill DOE", "DOE BTP tutoriel", "dossier ouvrages exécutés"],
  },
  "/ressources/tuto-skill-analyse-dce-bework": {
    title: "Skill analyse DCE BTP : tutoriel et prompts | BeWork",
    description: tutoDesc(
      "Skill DCE : trier un dossier de consultation, pièces critiques et fiche Go/No Go avant votre réponse marché",
    ),
    keywords: ["skill analyse DCE", "DCE BTP Claude", "appel d’offres BTP"],
  },
  "/ressources/tuto-skill-analyse-express-cctp-bework": {
    title: "Skill CCTP express : synthèse et fiche Go/No Go | BeWork",
    description: tutoDesc(
      "Skill CCTP express : prestations à chiffrer, clauses sensibles, fiche Go/No Go. PDF gratuit et prompts à coller",
    ),
    keywords: ["skill CCTP", "synthèse CCTP BTP", "analyse CCTP"],
  },
  "/ressources/tuto-skill-memoire-technique-bework": {
    title: "Skill mémoire technique BTP : tutoriel Claude | BeWork",
    description: tutoDesc(
      "Skill mémoire technique : structure, critères MOA et prompts pour répondre aux appels d’offres du bâtiment plus vite",
    ),
    keywords: ["skill mémoire technique", "mémoire technique BTP", "AO BTP"],
  },
  "/ressources/tuto-skill-chiffrage-devis-bework": {
    title: "Skill chiffrage devis BTP : BPU et prompts | BeWork",
    description: tutoDesc(
      "Skill chiffrage devis : BPU, coefficients, exports Excel et prompts de calibrage pour vos devis travaux",
    ),
    keywords: ["skill chiffrage devis", "devis BTP Claude", "BPU DQE"],
  },
  "/ressources/tuto-skill-metre-bework": {
    title: "Skill métré BTP : quantitatif, qualitatif et DPGF | BeWork",
    description: tutoDesc(
      "Skill métré : plans, CCTP, unités et DPGF Excel. Prompts calibrage pour conducteurs et chargés d’affaires",
    ),
    keywords: ["skill métré BTP", "métré chantier", "DPGF Excel"],
  },
  "/ressources/tuto-skill-duerp-bework": {
    title: "Skill DUERP BTP : tutoriel et matrice risques | BeWork",
    description: tutoDesc(
      "Skill DUERP : 7 éléments réglementaires, matrice F×G et plan d’action. PDF gratuit pour le document unique",
    ),
    keywords: ["skill DUERP", "DUERP BTP", "document unique"],
  },
  "/ressources/tuto-skill-constat-retard-bework": {
    title: "Skill constat de retard chantier : tutoriel | BeWork",
    description: tutoDesc(
      "Skill constat de retard : 7 éléments LRAR, CCAG et prompts pour formaliser un retard avec traçabilité",
    ),
    keywords: ["constat retard chantier", "skill retard BTP", "CCAG retard"],
  },
  "/ressources/tuto-skill-pv-levee-reserves-bework": {
    title: "Skill PV levée de réserves : tutoriel BTP | BeWork",
    description: tutoDesc(
      "Skill PV réserves : structurer OPR, levées et preuves. Prompts et PDF pour sécuriser vos réceptions de chantier",
    ),
    keywords: ["PV levée réserves", "OPR BTP", "skill réserves"],
  },
  "/ressources/tuto-skill-ordre-de-service-bework": {
    title: "Skill ordre de service BTP : tutoriel CCAG | BeWork",
    description: tutoDesc(
      "Skill ordre de service : décortiquer, contester et chiffrer un OS. CCAG, réserves, délai 15 jours — prompts inclus",
    ),
    keywords: ["ordre de service BTP", "skill OS chantier", "CCAG travaux"],
  },
  "/ressources/tuto-skill-rdv-client-bework": {
    title: "Skill préparation RDV client BTP : tutoriel Claude | BeWork",
    description: tutoDesc(
      "Skill RDV client : brief contact, ordre du jour, questions de découverte et CR post-RDV. PDF et prompts",
    ),
    keywords: ["skill RDV client", "préparation RDV BTP", "compte rendu RDV", "Claude commercial BTP"],
  },
  "/ressources/tuto-skill-pic-bework": {
    title: "Skill plan installation chantier (PIC) | BeWork",
    description: tutoDesc(
      "Skill PIC : base vie, coactivité, grue et checklist SPS. PDF et prompts pour un plan d’installation chantier",
    ),
    keywords: ["PIC chantier", "plan installation chantier", "skill PIC BTP"],
  },
  "/ressources/tuto-dispatch-bework": {
    title: "Bureau chantier mobile : tutoriel dispatch BeWork",
    description: tutoDesc(
      "Tutoriel dispatch : pairer PC et mobile, commandes vocales BTP et routine terrain. PDF gratuit BeWork",
    ),
    keywords: ["dispatch chantier", "bureau mobile BTP", "assistant chantier"],
  },
  "/ressources/tuto-tri-dce-claude-chrome-bework": {
    title: "Tri DCE avec Claude : veille appels d’offres BTP",
    description: tutoDesc(
      "Tri DCE : BOAMP, plateformes et filtres métier. Veille marchés publics — PDF et prompts prêts à l’emploi",
    ),
    keywords: ["tri DCE", "veille marchés BTP", "Claude Chrome DCE"],
  },
  "/ressources/guide-cdt-bework": {
    title: "Guide conducteur de travaux BTP : 6 skills Claude | BeWork",
    description: tutoDesc(
      "Guide PDF 52 pages : DCE, PPSPS, CR, retard, PV et DOE. Méthodes Claude pour conducteurs de travaux",
    ),
    keywords: ["guide conducteur de travaux", "conducteur travaux BTP", "skills Claude BTP"],
  },
  "/ressources/guide-conducteur-de-travaux-ia-bework": {
    title: "Conducteur de travaux et IA : guide pratique BTP",
    description: tutoDesc(
      "Guide PDF : 6 outils IA pour CR, PPSPS, DCE et DOE. Assistant travaux augmenté par l’IA — téléchargement gratuit",
    ),
    keywords: ["conducteur de travaux IA", "IA BTP chantier", "guide BTP"],
  },
  "/ressources/compte-rendu-chantier-guide-btp": {
    title: "Skill compte rendu de chantier : tutoriel | BeWork",
    description: tutoDesc(
      "Skill CR chantier : structure, prompts et PDF pour des comptes rendus lisibles et traçables après chaque réunion",
    ),
    keywords: ["skill compte rendu chantier", "CR chantier BTP"],
  },
};

export function getTutoPageDescription(path: string): string {
  const seo = TUTO_PAGE_SEO[path];
  if (!seo) throw new Error(`Missing tuto SEO for ${path}`);
  return seo.description;
}

export function tutoPageMetadata(path: string): Metadata {
  const seo = TUTO_PAGE_SEO[path];
  if (!seo) throw new Error(`Missing tuto SEO for ${path}`);
  const url = absoluteUrl(path);

  return {
    title: { absolute: seo.title },
    description: seo.description,
    ...(seo.keywords?.length ? { keywords: seo.keywords } : {}),
    alternates: { canonical: url, languages: hreflangFrancophonieLanguages(path) },
    robots: SEO_PUBLIC_ROBOTS,
    openGraph: {
      type: "article",
      locale: SEO_OG_LOCALE_PRIMARY,
      alternateLocale: [...SEO_OG_ALTERNATE_LOCALES],
      url,
      siteName: "BeWork",
      title: seo.title,
      description: seo.description,
      images: [{ url: defaultOgImage, width: 1200, height: 630, alt: seo.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: seo.title,
      description: seo.description,
    },
  };
}
