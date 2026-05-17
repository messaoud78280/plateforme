/** Références prévention / réglementaire — familles sélectionnables (sans numéro inventé). */
export type PpspsNormReferenceOption = {
  id: string;
  label: string;
  hint: string;
};

export const PPSPS_NORM_REFERENCE_OPTIONS: PpspsNormReferenceOption[] = [
  {
    id: "code-travail",
    label: "Code du travail — principes généraux",
    hint: "Obligations employeur, formation, information, consultation.",
  },
  {
    id: "inrs",
    label: "Guides INRS / fiches pratiques",
    hint: "Repères méthodologiques — croiser avec la documentation officielle.",
  },
  {
    id: "r408",
    label: "Règlementation chantier (R.408 / R.451)",
    hint: "Organisation, coordination, installations, accueil.",
  },
  {
    id: "erp-accessibilite",
    label: "ERP / accessibilité / feu",
    hint: "Site occupé, évacuation, continuité d'activité.",
  },
  {
    id: "amiante-plomb",
    label: "Amiante / plomb / polluants",
    hint: "Repérage, sous-section 4, filière déchets.",
  },
  {
    id: "hauteur",
    label: "Travail en hauteur / échafaudages",
    hint: "Garde-corps, ancrages, nacelles — conformité matériel.",
  },
  {
    id: "engins",
    label: "Engins / levage / manutention",
    hint: "CACES, élingage, périmètres d'exclusion.",
  },
  {
    id: "electrique",
    label: "Électricité / consignation",
    hint: "Habilitations, installations provisoires, BT/HT.",
  },
  {
    id: "voirie",
    label: "Voirie / emprise publique",
    hint: "Autorisations, signalisation temporaire.",
  },
  {
    id: "environnement",
    label: "Environnement / nuisances",
    hint: "Bruit, poussières, déchets, ICPE si applicable.",
  },
];

export function formatPpspsNormReferencesForPrompt(ids: string[]): string {
  const selected = PPSPS_NORM_REFERENCE_OPTIONS.filter((o) => ids.includes(o.id));
  if (!selected.length) return "";
  return selected.map((o) => `- **${o.label}** : ${o.hint}`).join("\n");
}
