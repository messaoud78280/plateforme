/**
 * Métadonnées SEO pour guides éditoriaux /ressources/* (hors tutos skills).
 */
import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site";

const defaultOgImage = absoluteUrl("/opengraph-image");

export type ResourceEditorialSeo = {
  title: string;
  description: string;
  keywords?: string[];
  ogType?: "article" | "website";
};

export const RESOURCE_EDITORIAL_SEO: Record<string, ResourceEditorialSeo> = {
  "/ressources/compte-rendu-chantier": {
    title: "Compte rendu de chantier BTP : modèle et méthode",
    description:
      "Rédigez un compte rendu de chantier clair : structure, points obligatoires et erreurs à éviter. Assistant travaux BeWork pour structurer vos CR.",
    keywords: ["compte rendu de chantier", "CR chantier BTP", "modèle compte rendu chantier"],
    ogType: "article",
  },
  "/ressources/ppsps-btp": {
    title: "PPSPS BTP : guide, méthode et aide à la rédaction",
    description:
      "PPSPS BTP : quand le préparer, quelles informations rassembler et comment structurer votre plan sécurité chantier sans oublier l’essentiel.",
    keywords: ["PPSPS BTP", "plan particulier sécurité chantier", "sécurité chantier BTP"],
    ogType: "article",
  },
  "/ressources/doe-btp": {
    title: "DOE BTP : préparer le dossier des ouvrages exécutés",
    description:
      "DOE BTP : pièces à collecter, organisation et remise au maître d’ouvrage. Méthode pratique pour clôturer vos chantiers sans retard administratif.",
    keywords: ["DOE BTP", "dossier des ouvrages exécutés", "récolement chantier"],
    ogType: "article",
  },
  "/ressources/analyse-dce-btp": {
    title: "Analyse DCE BTP : synthèse CCTP et appels d’offres",
    description:
      "Analyse DCE BTP : lire un dossier de consultation, repérer les risques et préparer votre réponse marché. Méthode pour chargés d’affaires et conducteurs.",
    keywords: ["analyse DCE BTP", "dossier consultation entreprises", "CCTP appel d’offres"],
    ogType: "article",
  },
  "/ressources/memoire-technique-btp": {
    title: "Mémoire technique BTP : structure et appel d’offres",
    description:
      "Mémoire technique BTP : plan type, critères MOA et erreurs fréquentes. Gagnez du temps sur vos réponses aux marchés publics et privés.",
    keywords: ["mémoire technique BTP", "appel d’offres BTP", "réponse marché travaux"],
    ogType: "article",
  },
  "/ressources/chiffrage-devis-btp": {
    title: "Chiffrage devis BTP : BPU, DQE et méthode",
    description:
      "Chiffrage devis BTP : lire un DPGF, structurer votre offre et éviter les oublis qui mangent la marge. Relais bureau-chantier BeWork sur demande.",
    keywords: ["chiffrage devis BTP", "BPU DQE", "devis travaux BTP"],
    ogType: "article",
  },
  "/ressources/planning-chantier-btp": {
    title: "Planning chantier BTP : jalons et pilotage",
    description:
      "Planning chantier BTP : jalons, coordination et suivi administratif aligné sur le terrain. Méthode pour conducteurs et chefs de chantier débordés.",
    keywords: ["planning chantier BTP", "jalons chantier", "pilotage chantier"],
    ogType: "article",
  },
  "/ressources/pv-levee-reserves-btp": {
    title: "PV levée de réserves BTP : méthode et traçabilité",
    description:
      "Levée de réserves BTP : préparer le PV, tracer les points levés et sécuriser la réception. Assistant travaux pour structurer vos dossiers OPR.",
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
    alternates: { canonical: url, languages: { fr: url, "x-default": url } },
    robots: { index: true, follow: true },
    openGraph: {
      type: ogType,
      locale: "fr_FR",
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
