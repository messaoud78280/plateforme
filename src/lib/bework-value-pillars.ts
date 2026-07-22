/** Arguments de différenciation BeWork — accueil, crédibilité, tutos, SEO/AEO. */
export type BeWorkValuePillar = {
  label: string;
  detail: string;
};

export const BEWORK_VALUE_PILLARS: readonly BeWorkValuePillar[] = [
  {
    label: "Formé aux marchés publics et privés",
    detail: "CCAG, accords-cadres, marchés privés, BPU/DPGF, situations et DOE : le périmètre administratif chantier est maîtrisé.",
  },
  {
    label: "Expertise en administration BTP",
    detail: "Candidatures, DCE, pièces marché, situations, réserves et clôture documentaire — pas du secrétariat généraliste.",
  },
  {
    label: "IA spécialisée + validation humaine",
    detail: "L’IA structure et accélère ; un Beworker garde le fil, le relationnel et le cadre. Vous validez avant tout envoi engageant.",
  },
  {
    label: "Contrôle documentaire et traçabilité",
    detail: "Process cadré, relecture humaine sur les documents sensibles — validations juridiques et contractuelles restent chez vous et vos conseils.",
  },
  {
    label: "Réduction du temps administratif répétitif",
    detail: "Classement, synthèses, listes de pièces, échéances et relances documentaires absorbés pour libérer du temps terrain.",
  },
  {
    label: "100 % supervisé en France",
    detail: "Pilotage et encadrement depuis la France, plateforme privée sécurisée, interlocuteurs francophones pour le BTP.",
  },
] as const;

/** Libellés courts pour badges hero / listes à puces. */
export const BEWORK_VALUE_PILLAR_LABELS: readonly string[] = BEWORK_VALUE_PILLARS.map((p) => p.label);
