/** Modes de mission — orientent le prompt et la structure de réponse. */
export type CctpGenerationMode =
  | "redaction"
  | "sommaire"
  | "audit"
  | "enrichissement"
  | "coordination";

export type CctpMarketProfile = "public" | "prive" | "sous_traitance" | "maintenance";

export const CCTP_GENERATION_MODES: {
  id: CctpGenerationMode;
  label: string;
  description: string;
}[] = [
  {
    id: "redaction",
    label: "Rédaction",
    description: "Articles, clauses et prescriptions prêtes à intégrer.",
  },
  {
    id: "sommaire",
    label: "Sommaire & structure",
    description: "Plan détaillé, hiérarchie des articles et logique par lot.",
  },
  {
    id: "audit",
    label: "Audit & manques",
    description: "Analyse critique, tableau des lacunes et priorités.",
  },
  {
    id: "enrichissement",
    label: "Enrichissement",
    description: "Renforcer un texte existant sans le diluer.",
  },
  {
    id: "coordination",
    label: "Coordination lots",
    description: "Interfaces, réservations et coactivité entre corps d'état.",
  },
];

export const CCTP_MARKET_PROFILES: {
  id: CctpMarketProfile;
  label: string;
  hint: string;
}[] = [
  { id: "public", label: "Marché public", hint: "Formulations CCAG, pénalités, variantes, DPGF." },
  { id: "prive", label: "Marché privé", hint: "Souplesse contractuelle, références MOA/MOE." },
  { id: "sous_traitance", label: "Sous-traitance", hint: "Périmètre lot, interfaces donneur d'ordre." },
  { id: "maintenance", label: "Maintenance / exploitation", hint: "Exploitant, accès, sécurité, continuité." },
];

export function getModePromptSuffix(mode: CctpGenerationMode): string {
  switch (mode) {
    case "sommaire":
      return `
## Mode actif : SOMMAIRE & STRUCTURE
Produis un sommaire hiérarchisé (titres numérotés) exploitable tel quel. Pour chaque grande partie, indique en 1 ligne l'objectif.
Inclure : dispositions générales, prescriptions communes, lot technique, sécurité/environnement, réception/DOE.
Terminer par une section « Articles à développer en priorité ».`;
    case "audit":
      return `
## Mode actif : AUDIT & MANQUES
Structure obligatoire :
1. Synthèse exécutive (5 lignes max)
2. Tableau | Thème | Constat | Risque | Recommandation |
3. Liste des incohérences avec documents joints si présents
4. Top 5 actions prioritaires avant diffusion
Ne pas réécrire tout le CCTP : diagnostiquer et prescrire.`;
    case "enrichissement":
      return `
## Mode actif : ENRICHISSEMENT
Conserver la structure existante. Pour chaque section concernée : reformuler, ajouter prescriptions manquantes, sujétions, contrôles et tolérances.
Marquer clairement les ajouts avec « [Ajout BeWork] ».`;
    case "coordination":
      return `
## Mode actif : COORDINATION LOTS
Produire : matrice des interfaces (lot / prestation / responsable / délai), réservations à prévoir, points de contrôle communs, planning type de coordination.
Citer les lots limitrophes à valider avec le MOE.`;
    default:
      return `
## Mode actif : RÉDACTION
Produire un contenu contractuel directement exploitable (phrases à l'infinitif ou « l'entreprise devra »).
Structurer par articles numérotés avec prescriptions impératives et sujétions.`;
  }
}

export function getMarketPromptSuffix(profile: CctpMarketProfile | null | undefined): string {
  if (!profile) return "";
  const p = CCTP_MARKET_PROFILES.find((x) => x.id === profile);
  if (!p) return "";
  return `\n## Profil marché : ${p.label}\n${p.hint}`;
}
