/**
 * Seuils fiscaux versionnables — jamais en dur dans l’UI.
 * Une PME classique ne voit pas les alertes micro-entreprise.
 *
 * Les montants suivent les barèmes officiels à la date `effectiveFrom`.
 * À actualiser ici (ou via config) quand BOFIP / CGI évolue — pas dans les composants.
 */

export type FiscalRegime =
  | "STANDARD_VAT"
  | "VAT_FRANCHISE"
  | "MICRO_BIC"
  | "MICRO_BNC";

export type FiscalActivityCategory = "SERVICES" | "SALES_OR_HOUSING" | "MIXED";

export type FiscalThresholdRule = {
  id: string;
  type: "VAT_FRANCHISE" | "MICRO_CA";
  regime: FiscalRegime;
  activityCategory: FiscalActivityCategory;
  thresholdHt: number;
  effectiveFrom: string;
  effectiveTo: string | null;
  label: string;
  source: string;
};

/**
 * Barèmes indicatifs 2025–2026 (à confirmer sur pièce officielle avant usage décisionnel).
 * Non affichés tant que le profil entreprise n’est pas renseigné.
 */
export const FISCAL_THRESHOLD_RULES: FiscalThresholdRule[] = [
  {
    id: "vat-franchise-services-2025",
    type: "VAT_FRANCHISE",
    regime: "VAT_FRANCHISE",
    activityCategory: "SERVICES",
    thresholdHt: 37_500,
    effectiveFrom: "2025-01-01",
    effectiveTo: null,
    label: "Franchise en base de TVA — prestations de services",
    source: "CGI — à confirmer selon millésime",
  },
  {
    id: "vat-franchise-sales-2025",
    type: "VAT_FRANCHISE",
    regime: "VAT_FRANCHISE",
    activityCategory: "SALES_OR_HOUSING",
    thresholdHt: 85_000,
    effectiveFrom: "2025-01-01",
    effectiveTo: null,
    label: "Franchise en base de TVA — ventes / hébergement",
    source: "CGI — à confirmer selon millésime",
  },
  {
    id: "micro-bic-services-2025",
    type: "MICRO_CA",
    regime: "MICRO_BIC",
    activityCategory: "SERVICES",
    thresholdHt: 77_700,
    effectiveFrom: "2025-01-01",
    effectiveTo: null,
    label: "Seuil micro-BIC — prestations",
    source: "CGI — à confirmer selon millésime",
  },
  {
    id: "micro-bic-sales-2025",
    type: "MICRO_CA",
    regime: "MICRO_BIC",
    activityCategory: "SALES_OR_HOUSING",
    thresholdHt: 188_700,
    effectiveFrom: "2025-01-01",
    effectiveTo: null,
    label: "Seuil micro-BIC — ventes",
    source: "CGI — à confirmer selon millésime",
  },
];

export type OrgFiscalProfile = {
  regime?: FiscalRegime | null;
  activityCategory?: FiscalActivityCategory | null;
};

export type FiscalThresholdAlert = {
  ruleId: string;
  label: string;
  thresholdHt: number;
  currentHt: number;
  ratio: number;
  tone: "info" | "watch" | "critical";
  message: string;
};

function ruleActiveOn(rule: FiscalThresholdRule, at: Date): boolean {
  const from = new Date(`${rule.effectiveFrom}T00:00:00`);
  if (at < from) return false;
  if (!rule.effectiveTo) return true;
  const to = new Date(`${rule.effectiveTo}T00:00:00`);
  return at < to;
}

/**
 * Aucune alerte si le régime n’est pas connu (cas PME BeWork par défaut).
 */
export function getApplicableFiscalAlerts(input: {
  profile: OrgFiscalProfile | null | undefined;
  revenueHt: number;
  at?: Date;
}): FiscalThresholdAlert[] {
  const regime = input.profile?.regime ?? null;
  if (!regime || regime === "STANDARD_VAT") return [];
  const at = input.at ?? new Date();
  const category = input.profile?.activityCategory ?? null;
  const revenue = Number.isFinite(input.revenueHt) ? input.revenueHt : 0;

  return FISCAL_THRESHOLD_RULES.filter((rule) => {
    if (rule.regime !== regime) return false;
    if (category && rule.activityCategory !== category) return false;
    return ruleActiveOn(rule, at);
  }).map((rule) => {
    const ratio = rule.thresholdHt > 0 ? revenue / rule.thresholdHt : 0;
    const tone: FiscalThresholdAlert["tone"] =
      ratio >= 1 ? "critical" : ratio >= 0.8 ? "watch" : "info";
    const pct = Math.round(ratio * 100);
    return {
      ruleId: rule.id,
      label: rule.label,
      thresholdHt: rule.thresholdHt,
      currentHt: revenue,
      ratio,
      tone,
      message: `${pct} % du seuil (${rule.thresholdHt.toLocaleString("fr-FR")} € HT) — ${rule.source}`,
    };
  });
}
