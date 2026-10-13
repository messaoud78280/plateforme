/**
 * Modèles métier réutilisables à la création d’un chantier.
 * Lots et phases types seulement — aucune quantité, aucun prix, aucune date,
 * aucun devis, aucune commande, aucune donnée client.
 */

export const CHANTIER_TRADE_TEMPLATE_IDS = [
  "PAVAGE",
  "TERRASSEMENT",
  "VRD",
  "MACONNERIE",
] as const;

export type ChantierTradeTemplateId = (typeof CHANTIER_TRADE_TEMPLATE_IDS)[number];

export type ChantierTradeLot = {
  name: string;
  familyLabel: string;
  phases: readonly string[];
};

export type ChantierTradeTemplate = {
  id: ChantierTradeTemplateId;
  label: string;
  summary: string;
  /** Termes pour retrouver ouvrages, matériaux, métiers et fournisseurs de l’organisation. */
  matchTerms: readonly string[];
  lots: readonly ChantierTradeLot[];
};

export type ChantierTemplateScopeDraft = {
  code: string;
  name: string;
  description: string;
  displayOrder: number;
};

export type ChantierTemplateReuseFacts = {
  companyName: string;
  settingsConfigured: boolean;
  vatRate: string | null;
  currency: string | null;
  paymentTerms: string | null;
  validityDays: number | null;
  tradeNames: string[];
  tradeCount: number;
  matchedTradeNames: string[];
  matchedTradeCount: number;
  workItemNames: string[];
  workItemCount: number;
  materialNames: string[];
  materialCount: number;
  supplierNames: string[];
  supplierCount: number;
  suppliersMatchedByTrade: boolean;
};

export const CHANTIER_TRADE_TEMPLATES: readonly ChantierTradeTemplate[] = [
  {
    id: "PAVAGE",
    label: "Pavage",
    summary:
      "Lots types d’un pavage : préparation, structure et pose, finitions. Les quantités et le calepinage restent à relever.",
    matchTerms: [
      "pavage",
      "pave",
      "paveur",
      "bordure",
      "lit de pose",
      "joint de pavage",
      "dalle de voirie",
      "stabilise",
    ],
    lots: [
      {
        name: "Implantation et préparation",
        familyLabel: "Pavage",
        phases: ["Implantation", "Décapage", "Réglage du fond de forme"],
      },
      {
        name: "Structure et pose",
        familyLabel: "Pavage",
        phases: ["Couche de fondation", "Lit de pose", "Pose des pavés ou dalles"],
      },
      {
        name: "Finitions de pavage",
        familyLabel: "Pavage",
        phases: ["Joints", "Bordures", "Reprises et nettoyage"],
      },
    ],
  },
  {
    id: "TERRASSEMENT",
    label: "Terrassement",
    summary:
      "Lots types de terrassement : implantation, mouvements de terre, remblais. Les volumes restent à cuber.",
    matchTerms: [
      "terrassement",
      "terrassier",
      "decapage",
      "fouille",
      "remblai",
      "deblai",
      "compactage",
    ],
    lots: [
      {
        name: "Implantation",
        familyLabel: "Terrassement",
        phases: ["Implantation", "Piquetage"],
      },
      {
        name: "Terrassements",
        familyLabel: "Terrassement",
        phases: ["Décapage", "Fouilles", "Évacuation des déblais"],
      },
      {
        name: "Remblais et plateformes",
        familyLabel: "Terrassement",
        phases: ["Remblais", "Réglage", "Compactage"],
      },
    ],
  },
  {
    id: "VRD",
    label: "VRD",
    summary:
      "Lots types VRD : réseaux enterrés, assainissement, surfaces. Les fils d’eau et les raccordements restent à confirmer.",
    matchTerms: [
      "vrd",
      "assainissement",
      "regard",
      "canalisation",
      "reseau",
      "voirie",
      "tranchee",
    ],
    lots: [
      {
        name: "Réseaux enterrés",
        familyLabel: "VRD",
        phases: ["Fouilles en tranchée", "Pose des réseaux", "Remblaiement"],
      },
      {
        name: "Assainissement",
        familyLabel: "VRD",
        phases: ["Regards", "Raccordements", "Contrôles"],
      },
      {
        name: "Voirie et surfaces",
        familyLabel: "VRD",
        phases: ["Structure de chaussée", "Revêtements", "Bordures"],
      },
    ],
  },
  {
    id: "MACONNERIE",
    label: "Maçonnerie",
    summary:
      "Lots types de maçonnerie : préparation, élévation, finitions de gros œuvre. Les sections et les niveaux restent à relever.",
    matchTerms: [
      "maconnerie",
      "macon",
      "parpaing",
      "agglo",
      "elevation",
      "linteau",
      "chainage",
      "enduit",
    ],
    lots: [
      {
        name: "Implantation et supports",
        familyLabel: "Maçonnerie",
        phases: ["Implantation", "Préparation des supports"],
      },
      {
        name: "Élévation",
        familyLabel: "Maçonnerie",
        phases: ["Soubassement", "Élévation", "Linteaux et chaînages"],
      },
      {
        name: "Finitions gros œuvre",
        familyLabel: "Maçonnerie",
        phases: ["Enduits", "Seuils", "Nettoyage"],
      },
    ],
  },
];

const BY_ID = new Map(CHANTIER_TRADE_TEMPLATES.map((template) => [template.id, template]));

export function getChantierTradeTemplate(
  id: string | null | undefined,
): ChantierTradeTemplate | null {
  if (!id) return null;
  return BY_ID.get(id.trim().toUpperCase() as ChantierTradeTemplateId) ?? null;
}

export function parseTradeTemplateId(
  raw: unknown,
): { ok: true; id: string | null } | { ok: false; error: string } {
  if (raw == null || raw === "") return { ok: true, id: null };
  if (typeof raw !== "string") return { ok: false, error: "Modèle métier invalide." };
  const id = raw.trim();
  if (!id) return { ok: true, id: null };
  const template = getChantierTradeTemplate(id);
  if (!template) return { ok: false, error: "Modèle métier inconnu." };
  return { ok: true, id: template.id };
}

export function normalizeTradeMatchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function templateMatchesText(
  template: ChantierTradeTemplate,
  text: string,
): boolean {
  const hay = normalizeTradeMatchText(text);
  if (!hay) return false;
  return template.matchTerms.some((term) => hay.includes(normalizeTradeMatchText(term)));
}

export function selectReusableRows<T>(
  template: ChantierTradeTemplate,
  rows: readonly T[],
  textOf: (row: T) => string,
): T[] {
  return rows.filter((row) => templateMatchesText(template, textOf(row)));
}

export function scopeCodeForTemplateLot(templateId: string, index: number): string {
  return `${templateId}-${String(index + 1).padStart(2, "0")}`;
}

export function lotDescription(lot: ChantierTradeLot): string {
  return `Famille ${lot.familyLabel}. Phases types : ${lot.phases.join(" · ")}. Quantités, prix chantier et dates à valider.`;
}

export function buildTradeTemplateScopes(
  templateId: string,
): ChantierTemplateScopeDraft[] | null {
  const template = getChantierTradeTemplate(templateId);
  if (!template) return null;
  return template.lots.map((lot, index) => ({
    code: scopeCodeForTemplateLot(template.id, index),
    name: lot.name,
    description: lotDescription(lot),
    displayOrder: index,
  }));
}

export function resolveTemplateFromScopeCodes(
  codes: readonly string[],
): ChantierTradeTemplate | null {
  const counts = new Map<ChantierTradeTemplateId, number>();
  for (const code of codes) {
    const template = getChantierTradeTemplate(code.split("-")[0] ?? "");
    if (!template) continue;
    if (!code.startsWith(`${template.id}-`)) continue;
    counts.set(template.id, (counts.get(template.id) ?? 0) + 1);
  }
  let best: ChantierTradeTemplate | null = null;
  let bestCount = 0;
  for (const [id, count] of counts) {
    if (count > bestCount) {
      best = getChantierTradeTemplate(id);
      bestCount = count;
    }
  }
  return best;
}

function joinNames(names: string[], count: number): string {
  const shown = names.filter(Boolean).slice(0, 4);
  if (shown.length === 0) return "";
  const extra = count - shown.length;
  return extra > 0 ? `${shown.join(", ")} (+${extra})` : shown.join(", ");
}

export function formatChantierTemplateReuseLines(
  facts: ChantierTemplateReuseFacts,
): string[] {
  const company = facts.settingsConfigured
    ? `Paramètres ${facts.companyName} : TVA ${facts.vatRate ?? "à confirmer"} %, ${facts.currency ?? "EUR"}${
        facts.paymentTerms ? `, ${facts.paymentTerms}` : ""
      }${facts.validityDays != null ? `, validité ${facts.validityDays} j` : ""}.`
    : `Paramètres entreprise ${facts.companyName} : fiche commerciale à compléter.`;

  const trades =
    facts.matchedTradeCount > 0
      ? `Métiers entreprise pour ce modèle : ${joinNames(facts.matchedTradeNames, facts.matchedTradeCount)}.`
      : facts.tradeCount > 0
        ? `Métiers entreprise : ${joinNames(facts.tradeNames, facts.tradeCount)}.`
        : "Métiers entreprise : aucun métier actif en bibliothèque.";

  const workItems =
    facts.workItemCount > 0
      ? `Ouvrages de la bibliothèque : ${joinNames(facts.workItemNames, facts.workItemCount)}. Prix non recopiés sur le chantier.`
      : "Ouvrages : aucun ouvrage de cette famille dans la bibliothèque. Rien n’est inventé.";

  const materials =
    facts.materialCount > 0
      ? `Matériaux de la bibliothèque : ${joinNames(facts.materialNames, facts.materialCount)}. Prix non recopiés sur le chantier.`
      : "Matériaux : aucun matériau de cette famille dans la bibliothèque. Rien n’est inventé.";

  const suppliers =
    facts.supplierCount === 0
      ? "Fournisseurs : aucun fournisseur actif."
      : facts.suppliersMatchedByTrade
        ? `Fournisseurs de ce métier : ${joinNames(facts.supplierNames, facts.supplierCount)}.`
        : `Fournisseurs de l’organisation : ${joinNames(facts.supplierNames, facts.supplierCount)}.`;

  return [company, trades, workItems, materials, suppliers];
}
