/**
 * VISITES-METRES-2 — Synthèse déterministe « prêt à chiffrer ».
 */
import { formatQuantityLabel } from "@/lib/site-visits/measurements";
import { buildQuoteImpactPoints } from "@/lib/site-visits/impact";
import {
  normalizeConstraints,
  type SiteVisitConstraints,
} from "@/lib/site-visits/types";
import {
  buildVisitCompleteness,
  hasVisitConstraints,
} from "@/lib/site-visits/completeness";

export type VisitMeasurementLite = {
  zone: string | null;
  label: string;
  unit: string;
  computedQuantity: number;
  quantityLabel: string;
  lot?: string | null;
};

export type VisitSummary = {
  title: string;
  completenessLabel: string;
  ready: boolean;
  missingOpenCount: number;
  totalsByUnit: { unit: string; total: number; label: string }[];
  totalsByLot: { lot: string; totals: { unit: string; total: number; label: string }[] }[];
  totalsByZone: { zone: string; totals: { unit: string; total: number; label: string }[] }[];
  measurementLines: string[];
  stateLines: string[];
  logisticsLines: string[];
  orgLines: string[];
  docsLines: string[];
  confirmLines: string[];
  impactLabels: string[];
};

function sumByUnit(
  measurements: VisitMeasurementLite[],
): { unit: string; total: number; label: string }[] {
  const map = new Map<string, number>();
  for (const m of measurements) {
    map.set(m.unit, (map.get(m.unit) ?? 0) + m.computedQuantity);
  }
  return [...map.entries()].map(([unit, total]) => ({
    unit,
    total,
    label: formatQuantityLabel(total, unit),
  }));
}

function groupTotals(
  measurements: VisitMeasurementLite[],
  keyOf: (m: VisitMeasurementLite) => string,
): { key: string; totals: { unit: string; total: number; label: string }[] }[] {
  const groups = new Map<string, VisitMeasurementLite[]>();
  for (const m of measurements) {
    const key = keyOf(m);
    if (!key) continue;
    const arr = groups.get(key) ?? [];
    arr.push(m);
    groups.set(key, arr);
  }
  return [...groups.entries()].map(([key, docs]) => ({
    key,
    totals: sumByUnit(docs),
  }));
}

export function buildVisitSummary(opts: {
  siteName?: string | null;
  clientName: string;
  siteAddress?: string | null;
  projectId?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
  scheduledAt?: string | Date | null;
  subject?: string | null;
  lots?: unknown;
  constraints?: SiteVisitConstraints | unknown | null;
  measurements: VisitMeasurementLite[];
  missingOpen: { label: string }[];
  photoCount: number;
  documentCount: number;
  estimatedCrewCount?: number | null;
  estimatedDuration?: string | null;
}): VisitSummary {
  const c = normalizeConstraints(opts.constraints);
  const missingOpenCount = opts.missingOpen.length;
  const completeness = buildVisitCompleteness({
    clientName: opts.clientName,
    siteAddress: opts.siteAddress,
    siteName: opts.siteName,
    projectId: opts.projectId,
    contactName: opts.contactName,
    contactPhone: opts.contactPhone,
    scheduledAt: opts.scheduledAt,
    subject: opts.subject,
    lots: opts.lots,
    measurementCount: opts.measurements.length,
    measurementLots: opts.measurements.map((m) => m.lot).filter((x): x is string => Boolean(x)),
    hasConstraints: hasVisitConstraints(c),
    missingOpenCount,
    photoCount: opts.photoCount,
    documentCount: opts.documentCount,
  });
  const ready = completeness.items.filter((i) => i.required).every((i) => i.done);
  const impact = buildQuoteImpactPoints({
    constraints: c,
    missingOpenLabels: opts.missingOpen.map((m) => m.label),
  });

  const stateLines: string[] = [];
  if (c.supportState) stateLines.push(`État : ${c.supportState}`);
  for (const o of c.supportObservations ?? []) stateLines.push(o);
  if (c.asbestosStatus) stateLines.push(c.asbestosStatus);

  const logisticsLines: string[] = [];
  if (c.accessLevel) logisticsLines.push(`Accès : ${c.accessLevel}`);
  for (const a of c.access ?? []) logisticsLines.push(a);
  for (const o of c.occupation ?? []) logisticsLines.push(o);
  for (const w of c.waste ?? []) {
    if (w !== "Non concerné") logisticsLines.push(w);
  }
  for (const m of c.means ?? []) logisticsLines.push(m);

  const orgLines: string[] = [];
  if (opts.estimatedCrewCount != null) {
    orgLines.push(`${opts.estimatedCrewCount} personne${opts.estimatedCrewCount > 1 ? "s" : ""}`);
  }
  if (opts.estimatedDuration) orgLines.push(opts.estimatedDuration);
  if (c.estimatedDifficulty) orgLines.push(`Difficulté : ${c.estimatedDifficulty}`);

  const docsLines: string[] = [];
  if (opts.photoCount > 0) {
    docsLines.push(
      `${opts.photoCount} photo${opts.photoCount > 1 ? "s" : ""}`,
    );
  }
  if (opts.documentCount > 0) {
    docsLines.push(
      `${opts.documentCount} document${opts.documentCount > 1 ? "s" : ""}`,
    );
  }

  return {
    title: opts.siteName?.trim() || opts.clientName,
    completenessLabel: completeness.label,
    ready,
    missingOpenCount,
    totalsByUnit: sumByUnit(opts.measurements),
    totalsByLot: groupTotals(opts.measurements, (m) => m.lot?.trim() || "").map((g) => ({
      lot: g.key,
      totals: g.totals,
    })),
    totalsByZone: groupTotals(opts.measurements, (m) => m.zone?.trim() || "").map((g) => ({
      zone: g.key,
      totals: g.totals,
    })),
    measurementLines: opts.measurements.map(
      (m) =>
        `${m.zone ? `${m.zone} — ` : ""}${m.label} : ${m.quantityLabel}`,
    ),
    stateLines,
    logisticsLines,
    orgLines,
    docsLines,
    confirmLines: opts.missingOpen.map((m) => m.label),
    impactLabels: impact.map((p) => p.label),
  };
}
