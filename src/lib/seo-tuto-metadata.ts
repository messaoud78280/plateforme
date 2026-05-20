/**
 * Métadonnées SEO — tutoriels PDF / skills Claude (/ressources/tuto-*).
 */
import type { Metadata } from "next";
import { SEO_PUBLIC_ROBOTS } from "@/lib/seo-search-engines";
import { absoluteUrl } from "@/lib/site";

const defaultOgImage = absoluteUrl("/opengraph-image");

export type TutoPageSeo = {
  title: string;
  description: string;
  keywords?: string[];
};

export const TUTO_PAGE_SEO: Record<string, TutoPageSeo> = {
  "/ressources/tuto-skill-ppsps-bework": {
    title: "Skill PPSPS BTP : tutoriel Claude et prompts | BeWork",
    description:
      "Tutoriel skill PPSPS : 9 rubriques, prompts copiables et PDF gratuit pour structurer votre plan sécurité chantier avec Claude.",
    keywords: ["skill PPSPS", "PPSPS BTP tutoriel", "Claude BTP sécurité"],
  },
  "/ressources/tuto-skill-doe-bework": {
    title: "Skill DOE BTP : tutoriel Claude et checklist | BeWork",
    description:
      "Tutoriel skill DOE : rubriques CCAG, sommaire Word et prompts pour préparer votre dossier des ouvrages exécutés sans oubli.",
    keywords: ["skill DOE", "DOE BTP tutoriel", "dossier ouvrages exécutés"],
  },
  "/ressources/tuto-skill-analyse-dce-bework": {
    title: "Skill analyse DCE BTP : tutoriel et prompts | BeWork",
    description:
      "Tutoriel skill DCE : trier un dossier de consultation, repérer les pièces critiques et gagner du temps avant votre réponse marché.",
    keywords: ["skill analyse DCE", "DCE BTP Claude", "appel d’offres BTP"],
  },
  "/ressources/tuto-skill-analyse-express-cctp-bework": {
    title: "Skill CCTP express : synthèse et fiche Go/No Go | BeWork",
    description:
      "Tutoriel skill CCTP : prestations à chiffrer, clauses sensibles et fiche Go/No Go. PDF gratuit et prompts prêts à coller.",
    keywords: ["skill CCTP", "synthèse CCTP BTP", "analyse CCTP"],
  },
  "/ressources/tuto-skill-memoire-technique-bework": {
    title: "Skill mémoire technique BTP : tutoriel Claude | BeWork",
    description:
      "Tutoriel skill mémoire technique : structure, critères MOA et prompts pour répondre aux appels d’offres du bâtiment plus vite.",
    keywords: ["skill mémoire technique", "mémoire technique BTP", "AO BTP"],
  },
  "/ressources/tuto-skill-chiffrage-devis-bework": {
    title: "Skill chiffrage devis BTP : BPU et prompts | BeWork",
    description:
      "Tutoriel skill chiffrage : BPU, coefficients, exports Excel et prompts de calibrage pour préparer vos devis travaux avec méthode.",
    keywords: ["skill chiffrage devis", "devis BTP Claude", "BPU DQE"],
  },
  "/ressources/tuto-skill-metre-bework": {
    title: "Skill métré BTP : quantitatif, qualitatif et DPGF | BeWork",
    description:
      "Tutoriel skill métré : plans, CCTP, unités et DPGF Excel. Prompts calibrage et usage quotidien pour conducteurs et chargés d’affaires.",
    keywords: ["skill métré BTP", "métré chantier", "DPGF Excel"],
  },
  "/ressources/tuto-skill-duerp-bework": {
    title: "Skill DUERP BTP : tutoriel et matrice risques | BeWork",
    description:
      "Tutoriel skill DUERP : 7 éléments réglementaires, matrice F×G et plan d’action. PDF gratuit BeWork pour document unique entreprise.",
    keywords: ["skill DUERP", "DUERP BTP", "document unique"],
  },
  "/ressources/tuto-skill-constat-retard-bework": {
    title: "Skill constat de retard chantier : tutoriel | BeWork",
    description:
      "Tutoriel skill constat de retard : 7 éléments LRAR, CCAG et prompts pour formaliser un retard de chantier avec traçabilité.",
    keywords: ["constat retard chantier", "skill retard BTP", "CCAG retard"],
  },
  "/ressources/tuto-skill-pv-levee-reserves-bework": {
    title: "Skill PV levée de réserves : tutoriel BTP | BeWork",
    description:
      "Tutoriel skill PV réserves : structurer OPR, levées et preuves. Prompts et PDF pour sécuriser vos réceptions de chantier.",
    keywords: ["PV levée réserves", "OPR BTP", "skill réserves"],
  },
  "/ressources/tuto-skill-ordre-de-service-bework": {
    title: "Skill ordre de service BTP : tutoriel CCAG | BeWork",
    description:
      "Tutoriel skill OS : décortiquer, contester et chiffrer un ordre de service. CCAG, réserves et délai 15 jours — prompts inclus.",
    keywords: ["ordre de service BTP", "skill OS chantier", "CCAG travaux"],
  },
  "/ressources/tuto-skill-rdv-client-bework": {
    title: "Skill préparation RDV client BTP : tutoriel Claude | BeWork",
    description:
      "Tutoriel skill RDV client : brief contact, ordre du jour, questions de découverte et CR post-RDV. PDF gratuit et prompts prêts à coller.",
    keywords: ["skill RDV client", "préparation RDV BTP", "compte rendu RDV", "Claude commercial BTP"],
  },
  "/ressources/tuto-skill-pic-bework": {
    title: "Skill plan installation chantier (PIC) | BeWork",
    description:
      "Tutoriel skill PIC : base vie, coactivité, grue et checklist SPS. PDF et prompts pour un plan d’installation chantier structuré.",
    keywords: ["PIC chantier", "plan installation chantier", "skill PIC BTP"],
  },
  "/ressources/tuto-dispatch-bework": {
    title: "Bureau chantier mobile : tutoriel dispatch BeWork",
    description:
      "Tutoriel dispatch : pairer PC et mobile, commandes vocales BTP et routine terrain. PDF gratuit pour piloter le bureau depuis le chantier.",
    keywords: ["dispatch chantier", "bureau mobile BTP", "assistant chantier"],
  },
  "/ressources/tuto-tri-dce-claude-chrome-bework": {
    title: "Tri DCE avec Claude : veille appels d’offres BTP",
    description:
      "Tutoriel tri DCE : BOAMP, plateformes et filtres métier. Raccourci veille marchés publics — PDF et prompts prêts à l’emploi.",
    keywords: ["tri DCE", "veille marchés BTP", "Claude Chrome DCE"],
  },
  "/ressources/guide-cdt-bework": {
    title: "Guide conducteur de travaux BTP : 6 skills Claude | BeWork",
    description:
      "Guide PDF 52 pages : DCE, PPSPS, compte rendu, retard, PV et DOE. Méthodes Claude pour conducteurs de travaux du bâtiment.",
    keywords: ["guide conducteur de travaux", "conducteur travaux BTP", "skills Claude BTP"],
  },
  "/ressources/guide-conducteur-de-travaux-ia-bework": {
    title: "Conducteur de travaux et IA : guide pratique BTP",
    description:
      "Guide PDF : 6 outils IA pour CR, PPSPS, DCE et DOE. Assistant travaux augmenté par l’IA — téléchargement gratuit BeWork.",
    keywords: ["conducteur de travaux IA", "IA BTP chantier", "guide BTP"],
  },
  "/ressources/compte-rendu-chantier-guide-btp": {
    title: "Skill compte rendu de chantier : tutoriel | BeWork",
    description:
      "Tutoriel skill CR chantier : structure, prompts et PDF pour des comptes rendus lisibles et traçables après chaque réunion.",
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
    alternates: { canonical: url, languages: { fr: url, "x-default": url } },
    robots: SEO_PUBLIC_ROBOTS,
    openGraph: {
      type: "article",
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
