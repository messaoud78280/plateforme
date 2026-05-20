/**
 * Métadonnées SEO pour guides éditoriaux /ressources/* (hors tutos skills).
 */
import type { Metadata } from "next";
import {
  SEO_OG_ALTERNATE_LOCALES,
  SEO_OG_LOCALE_PRIMARY,
  hreflangFrancophonieLanguages,
  metaDescriptionFrancophonie,
} from "@/lib/seo-francophonie";
import { SEO_PUBLIC_ROBOTS } from "@/lib/seo-search-engines";
import { absoluteUrl } from "@/lib/site";

const defaultOgImage = absoluteUrl("/opengraph-image");

function resDesc(core: string): string {
  return metaDescriptionFrancophonie(core);
}

export type ResourceEditorialSeo = {
  title: string;
  description: string;
  keywords?: string[];
  ogType?: "article" | "website";
};

export const RESOURCE_EDITORIAL_SEO: Record<string, ResourceEditorialSeo> = {
  "/ressources/compte-rendu-chantier": {
    title: "Compte rendu de chantier BTP : modèle et méthode",
    description: resDesc(
      "Compte rendu de chantier : structure, points obligatoires et erreurs à éviter. Assistant travaux BeWork pour vos CR",
    ),
    keywords: ["compte rendu de chantier", "CR chantier BTP", "modèle compte rendu chantier"],
    ogType: "article",
  },
  "/ressources/ppsps-btp": {
    title: "PPSPS BTP : guide, méthode et aide à la rédaction",
    description: resDesc(
      "PPSPS BTP : quand le préparer, quelles informations rassembler et comment structurer le plan sécurité chantier",
    ),
    keywords: ["PPSPS BTP", "plan particulier sécurité chantier", "sécurité chantier BTP"],
    ogType: "article",
  },
  "/ressources/doe-btp": {
    title: "DOE BTP : préparer le dossier des ouvrages exécutés",
    description: resDesc(
      "DOE BTP : pièces à collecter, organisation et remise au maître d’ouvrage. Clôturer vos chantiers sans retard admin",
    ),
    keywords: ["DOE BTP", "dossier des ouvrages exécutés", "récolement chantier"],
    ogType: "article",
  },
  "/ressources/analyse-dce-btp": {
    title: "Analyse DCE BTP : synthèse CCTP et appels d’offres",
    description: resDesc(
      "Analyse DCE BTP : lire un dossier de consultation, repérer les risques et préparer votre réponse marché",
    ),
    keywords: ["analyse DCE BTP", "dossier consultation entreprises", "CCTP appel d’offres"],
    ogType: "article",
  },
  "/ressources/memoire-technique-btp": {
    title: "Mémoire technique BTP : structure et appel d’offres",
    description: resDesc(
      "Mémoire technique BTP : plan type, critères MOA et erreurs fréquentes. Gagnez du temps sur vos réponses marchés",
    ),
    keywords: ["mémoire technique BTP", "appel d’offres BTP", "réponse marché travaux"],
    ogType: "article",
  },
  "/ressources/chiffrage-devis-btp": {
    title: "Chiffrage devis BTP : BPU, DQE et méthode",
    description: resDesc(
      "Chiffrage devis BTP : lire un DPGF, structurer votre offre et éviter les oublis qui mangent la marge",
    ),
    keywords: ["chiffrage devis BTP", "BPU DQE", "devis travaux BTP"],
    ogType: "article",
  },
  "/ressources/planning-chantier-btp": {
    title: "Planning chantier BTP : jalons et pilotage",
    description: resDesc(
      "Planning chantier BTP : jalons, coordination et suivi administratif aligné sur le terrain pour CT et chefs de chantier",
    ),
    keywords: ["planning chantier BTP", "jalons chantier", "pilotage chantier"],
    ogType: "article",
  },
  "/ressources/pv-levee-reserves-btp": {
    title: "PV levée de réserves BTP : méthode et traçabilité",
    description: resDesc(
      "Levée de réserves BTP : préparer le PV, tracer les points levés et sécuriser la réception. Assistant travaux OPR",
    ),
    keywords: ["levée de réserves BTP", "PV réserves", "OPR chantier"],
    ogType: "article",
  },
};

export function getResourceEditorialDescription(path: string): string {
  const seo = RESOURCE_EDITORIAL_SEO[path];
  if (!seo) throw new Error(`Missing resource editorial SEO for ${path}`);
  return seo.description;
}

export function resourceEditorialMetadata(path: string): Metadata {
  const seo = RESOURCE_EDITORIAL_SEO[path];
  if (!seo) {
    throw new Error(`Missing resource editorial SEO for ${path}`);
  }
  const url = absoluteUrl(path);
  const ogType = seo.ogType ?? "article";

  return {
    title: { absolute: seo.title },
    description: seo.description,
    ...(seo.keywords?.length ? { keywords: seo.keywords } : {}),
    alternates: { canonical: url, languages: hreflangFrancophonieLanguages(path) },
    robots: SEO_PUBLIC_ROBOTS,
    openGraph: {
      type: ogType,
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
