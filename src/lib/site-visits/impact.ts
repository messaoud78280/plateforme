/**
 * VISITES-METRES-2 — Points à intégrer au devis (déterministe, pas d’IA, pas de prix).
 */
import {
  normalizeConstraints,
  type SiteVisitConstraints,
} from "@/lib/site-visits/types";

export type QuoteImpactPoint = {
  id: string;
  label: string;
  severity: "info" | "warn";
};

export function buildQuoteImpactPoints(opts: {
  constraints?: SiteVisitConstraints | unknown | null;
  missingOpenLabels?: string[];
}): QuoteImpactPoint[] {
  const c = normalizeConstraints(opts.constraints);
  const quoteImpact = c.quoteImpact ?? [];
  if (quoteImpact.length > 0) {
    return quoteImpact.map((label, i) => ({
      id: `qi:${i}:${label.toLowerCase()}`,
      label,
      severity: "info" as const,
    }));
  }

  const out: QuoteImpactPoint[] = [];
  const push = (id: string, label: string, severity: "info" | "warn" = "info") => {
    if (out.some((p) => p.id === id)) return;
    out.push({ id, label, severity });
  };

  const access = c.access ?? [];
  const means = c.means ?? [];
  const waste = c.waste ?? [];
  const occ = c.occupation ?? [];
  const obs = c.supportObservations ?? [];

  if (c.accessLevel === "Difficile") {
    push("access_hard", "Accès chantier difficile");
  }
  if (access.includes("Accès nacelle") || means.includes("Nacelle")) {
    push("nacelle", "Nacelle à prévoir");
  }
  if (access.includes("Échafaudage") || means.includes("Échafaudage")) {
    push("echafaudage", "Échafaudage à prévoir");
  }
  if (access.includes("Grutage") || means.includes("Grue")) {
    push("grutage", "Grutage / grue à prévoir");
  }
  if (access.includes("Monte-charge") || means.includes("Monte-charge")) {
    push("monte_charge", "Monte-charge à prévoir");
  }
  if (access.includes("Stationnement difficile")) {
    push("parking", "Stationnement difficile");
  }
  if (access.includes("Stockage limité")) {
    push("stockage", "Stockage limité sur site");
  }
  if (access.includes("Zone piétonne")) {
    push("pieton", "Zone piétonne — logistique à anticiper");
  }

  if (
    waste.includes("Évacuation à prévoir") ||
    waste.includes("Benne nécessaire") ||
    waste.includes("Descente manuelle") ||
    waste.includes("Tri spécifique")
  ) {
    push("dechets", "Évacuation déchets à prévoir");
  }
  if (waste.includes("Benne nécessaire")) {
    push("benne", "Benne nécessaire");
  }

  if (means.includes("Protection des parties communes")) {
    push("parties_communes", "Protection des parties communes");
  }
  if (means.includes("Balisage")) push("balisage", "Balisage à prévoir");
  if (means.includes("Confinement")) push("confinement", "Confinement à prévoir");
  if (means.includes("Protection toiture")) {
    push("prot_toiture", "Protection toiture à prévoir");
  }

  if (
    c.supportState === "Dégradé" ||
    c.supportState === "Très dégradé" ||
    obs.includes("Support instable")
  ) {
    push("support", "Support dégradé à reprendre", "warn");
  }
  if (obs.includes("Infiltration")) {
    push("infiltration", "Infiltrations visibles — reprise à évaluer", "warn");
  }
  if (obs.includes("Décollement")) {
    push("decollement", "Décollement constaté — reprise à évaluer");
  }
  if (obs.includes("Fissures")) push("fissures", "Fissures constatées");
  if (obs.includes("Humidité")) push("humidite", "Humidité constatée");

  if (
    c.asbestosStatus === "Diagnostic à demander" ||
    c.asbestosStatus === "Présence potentielle à vérifier"
  ) {
    push("amiante", "Diagnostic amiante à obtenir", "warn");
  }

  if (occ.includes("Site occupé") || occ.includes("Bureaux occupés")) {
    push("occupe", "Site occupé — organisation à prévoir");
  }
  if (occ.includes("Intervention de nuit") || occ.includes("Horaires imposés")) {
    push("horaires", "Horaires / intervention contrainte");
  }
  if (occ.includes("Nuisances à limiter")) {
    push("nuisances", "Nuisances à limiter");
  }
  if (occ.includes("Copropriété")) {
    push("copro", "Copropriété — règles d’accès / parties communes");
  }

  for (const label of opts.missingOpenLabels ?? []) {
    const t = label.trim();
    if (!t) continue;
    push(`missing:${t.toLowerCase()}`, t, "warn");
  }

  return out;
}
