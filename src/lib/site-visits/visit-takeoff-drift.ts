/**
 * Visite → métré : détection en lecture seule.
 * Ne modifie aucune quantité, devis, planning ni commande.
 *
 * Empreinte limitée aux données techniques (relevés, zones, lots,
 * constats, prestations, besoin). Statut, planning, contacts, commentaires
 * et médias ne déclenchent pas l’alerte.
 */

export type VisitTakeoffChange = {
  id: string;
  label: string;
  detail: string;
};

export type VisitTakeoffDriftResult = {
  stale: boolean;
  summary: string | null;
  changes: VisitTakeoffChange[];
};

export type VisitTechnicalMeasurement = {
  id: string;
  zone: string | null;
  label: string;
  measureType: string | null;
  unit: string | null;
  lengthM: number | null;
  widthM: number | null;
  heightM: number | null;
  quantityValue: number | null;
  computedQuantity: number | null;
  grossQuantity: number | null;
  multiplier: number | null;
  coefficient: number | null;
  wastePercent: number | null;
  deductions: unknown;
  lot: string | null;
};

export type VisitTechnicalSnapshot = {
  visitId: string;
  clientNeed: string | null;
  zones: unknown;
  lots: unknown;
  findings: unknown;
  proposedWorks: unknown;
  measurements: VisitTechnicalMeasurement[];
};

export type VisitTechnicalMeasurementInput = {
  id: string;
  zone?: string | null;
  label?: string | null;
  measureType?: string | null;
  unit?: string | null;
  lengthM?: unknown;
  widthM?: unknown;
  heightM?: unknown;
  quantityValue?: unknown;
  computedQuantity?: unknown;
  grossQuantity?: unknown;
  multiplier?: unknown;
  coefficient?: unknown;
  wastePercent?: unknown;
  deductionsJson?: unknown;
  deductions?: unknown;
  lot?: string | null;
  updatedAt?: Date | string | null;
};

export type VisitTechnicalSource = {
  id: string;
  clientNeed?: string | null;
  zonesJson?: unknown;
  lotsJson?: unknown;
  findingsJson?: unknown;
  proposedWorksJson?: unknown;
  measurements: VisitTechnicalMeasurementInput[];
};

export type VisitMeasurementTouch = {
  id: string;
  label: string;
  detail: string;
  updatedAt: Date | string;
};

const TOUCH_AFTER_MS = 1500;
const MAX_CHANGES = 8;

const MEASURE_FIELDS: Array<{
  key: keyof VisitTechnicalMeasurement;
  label: string;
}> = [
  { key: "label", label: "Libellé" },
  { key: "zone", label: "Zone" },
  { key: "measureType", label: "Type" },
  { key: "unit", label: "Unité" },
  { key: "lengthM", label: "Longueur" },
  { key: "widthM", label: "Largeur" },
  { key: "heightM", label: "Hauteur" },
  { key: "quantityValue", label: "Quantité" },
  { key: "computedQuantity", label: "Quantité calculée" },
  { key: "grossQuantity", label: "Quantité brute" },
  { key: "multiplier", label: "Multiplicateur" },
  { key: "coefficient", label: "Coefficient" },
  { key: "wastePercent", label: "Chute" },
  { key: "lot", label: "Lot" },
  { key: "deductions", label: "Déductions" },
];

export function isVisitExplicitlyLinked(input: {
  projectId: string;
  visit: { projectId: string | null; commercialQuoteId: string | null } | null;
  quoteIds: readonly string[];
}): boolean {
  const visit = input.visit;
  if (!visit) return false;
  if (visit.projectId && visit.projectId === input.projectId) return true;
  if (
    visit.commercialQuoteId &&
    input.quoteIds.includes(visit.commercialQuoteId)
  ) {
    return true;
  }
  return false;
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

export function technicalNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? round4(value) : null;
  if (typeof value === "string") {
    const n = Number(value.trim().replace(",", "."));
    return Number.isFinite(n) ? round4(n) : null;
  }
  if (
    typeof value === "object" &&
    value &&
    "toNumber" in value &&
    typeof (value as { toNumber: () => number }).toNumber === "function"
  ) {
    const n = (value as { toNumber: () => number }).toNumber();
    return Number.isFinite(n) ? round4(n) : null;
  }
  return null;
}

function text(value: string | null | undefined): string | null {
  const t = value?.trim();
  return t ? t : null;
}

function normalizeJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalizeJson);
  if (value && typeof value === "object") {
    if (
      "toNumber" in value &&
      typeof (value as { toNumber?: unknown }).toNumber === "function"
    ) {
      return technicalNumber(value);
    }
    const obj = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(obj).sort()) {
      out[key] = normalizeJson(obj[key]);
    }
    return out;
  }
  if (typeof value === "number") return round4(value);
  if (typeof value === "string" && /^-?\d+([.,]\d+)?$/.test(value.trim())) {
    return technicalNumber(value);
  }
  return value ?? null;
}

function sameJson(a: unknown, b: unknown): boolean {
  return JSON.stringify(normalizeJson(a)) === JSON.stringify(normalizeJson(b));
}

function fmtNum(value: number | null): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 4 }).format(value);
}

function clip(value: string, max = 80): string {
  const t = value.trim();
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

export function describeMeasurementNow(input: {
  unit?: string | null;
  lengthM?: unknown;
  widthM?: unknown;
  heightM?: unknown;
  quantityValue?: unknown;
  computedQuantity?: unknown;
}): string {
  const bits: string[] = [];
  const lengthM = technicalNumber(input.lengthM);
  const widthM = technicalNumber(input.widthM);
  const heightM = technicalNumber(input.heightM);
  const quantity = technicalNumber(input.quantityValue);
  const computed = technicalNumber(input.computedQuantity);
  const unit = text(input.unit);
  if (lengthM != null) bits.push(`L ${fmtNum(lengthM)} m`);
  if (widthM != null) bits.push(`l ${fmtNum(widthM)} m`);
  if (heightM != null) bits.push(`H ${fmtNum(heightM)} m`);
  const qty = quantity ?? computed;
  if (qty != null) bits.push(`qté ${fmtNum(qty)}${unit ? ` ${unit}` : ""}`);
  return bits.join(" · ");
}

export function buildVisitTechnicalSnapshot(
  source: VisitTechnicalSource,
): VisitTechnicalSnapshot {
  const measurements = source.measurements
    .filter((m) => m.id)
    .map((m) => ({
      id: m.id,
      zone: text(m.zone),
      label: text(m.label) ?? "Relevé",
      measureType: text(m.measureType),
      unit: text(m.unit),
      lengthM: technicalNumber(m.lengthM),
      widthM: technicalNumber(m.widthM),
      heightM: technicalNumber(m.heightM),
      quantityValue: technicalNumber(m.quantityValue),
      computedQuantity: technicalNumber(m.computedQuantity),
      grossQuantity: technicalNumber(m.grossQuantity),
      multiplier: technicalNumber(m.multiplier),
      coefficient: technicalNumber(m.coefficient),
      wastePercent: technicalNumber(m.wastePercent),
      deductions: normalizeJson(m.deductionsJson ?? m.deductions ?? null),
      lot: text(m.lot),
    }))
    .sort((a, b) => a.id.localeCompare(b.id));

  return {
    visitId: source.id,
    clientNeed: text(source.clientNeed),
    zones: normalizeJson(source.zonesJson ?? null),
    lots: normalizeJson(source.lotsJson ?? null),
    findings: normalizeJson(source.findingsJson ?? null),
    proposedWorks: normalizeJson(source.proposedWorksJson ?? null),
    measurements,
  };
}

export function readVisitTechnicalBaseline(detail: unknown): VisitTechnicalSnapshot | null {
  if (!detail || typeof detail !== "object" || Array.isArray(detail)) return null;
  const raw = (detail as { visitTechnicalBaseline?: unknown }).visitTechnicalBaseline;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const snap = raw as Partial<VisitTechnicalSnapshot>;
  if (typeof snap.visitId !== "string" || !snap.visitId) return null;
  if (!Array.isArray(snap.measurements)) return null;
  return buildVisitTechnicalSnapshot({
    id: snap.visitId,
    clientNeed: snap.clientNeed ?? null,
    zonesJson: snap.zones ?? null,
    lotsJson: snap.lots ?? null,
    findingsJson: snap.findings ?? null,
    proposedWorksJson: snap.proposedWorks ?? null,
    measurements: snap.measurements.map((m) => ({
      ...m,
      deductionsJson: m.deductions,
    })),
  });
}

function epoch(value: Date | string | null | undefined): number | null {
  if (value == null) return null;
  const ms = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(ms) ? ms : null;
}

function measurementTitle(m: { label: string; zone: string | null }): string {
  return m.zone ? `${m.label} — ${m.zone}` : m.label;
}

function formatValue(value: unknown): string {
  if (typeof value === "number") return fmtNum(value);
  if (value == null || value === "") return "—";
  if (typeof value === "string") return clip(value, 40);
  return "modifié";
}

function diffMeasurements(
  before: VisitTechnicalMeasurement[],
  after: VisitTechnicalMeasurement[],
): VisitTakeoffChange[] {
  const prev = new Map(before.map((m) => [m.id, m]));
  const next = new Map(after.map((m) => [m.id, m]));
  const changes: VisitTakeoffChange[] = [];

  for (const m of after) {
    const old = prev.get(m.id);
    if (!old) {
      const now = describeMeasurementNow(m);
      changes.push({
        id: m.id,
        label: measurementTitle(m),
        detail: now ? `Relevé ajouté · ${now}` : "Relevé ajouté",
      });
      continue;
    }
    const parts: string[] = [];
    for (const field of MEASURE_FIELDS) {
      const a = old[field.key];
      const b = m[field.key];
      if (field.key === "deductions") {
        if (!sameJson(a, b)) parts.push("Déductions modifiées");
        continue;
      }
      const left = typeof a === "number" ? technicalNumber(a) : a;
      const right = typeof b === "number" ? technicalNumber(b) : b;
      if (left === right) continue;
      parts.push(`${field.label} ${formatValue(a)} → ${formatValue(b)}`);
    }
    if (parts.length > 0) {
      changes.push({
        id: m.id,
        label: measurementTitle(m),
        detail: parts.join(" · "),
      });
    }
  }

  for (const m of before) {
    if (next.has(m.id)) continue;
    changes.push({
      id: m.id,
      label: measurementTitle(m),
      detail: "Relevé retiré",
    });
  }
  return changes;
}

function diffScope(
  before: VisitTechnicalSnapshot,
  after: VisitTechnicalSnapshot,
): VisitTakeoffChange[] {
  const changes: VisitTakeoffChange[] = [];
  if (before.clientNeed !== after.clientNeed) {
    changes.push({
      id: "scope:clientNeed",
      label: "Besoin client",
      detail: `${formatValue(before.clientNeed)} → ${formatValue(after.clientNeed)}`,
    });
  }
  const scopes: Array<[keyof VisitTechnicalSnapshot, string, string]> = [
    ["zones", "scope:zones", "Zones"],
    ["lots", "scope:lots", "Lots"],
    ["findings", "scope:findings", "Constats terrain"],
    ["proposedWorks", "scope:proposedWorks", "Prestations proposées"],
  ];
  for (const [key, id, label] of scopes) {
    if (!sameJson(before[key], after[key])) {
      changes.push({ id, label, detail: "Modifié depuis le métré" });
    }
  }
  return changes;
}

function pack(changes: VisitTakeoffChange[]): VisitTakeoffDriftResult {
  if (changes.length === 0) {
    return { stale: false, summary: null, changes: [] };
  }
  const summary =
    changes.length === 1
      ? changes[0]!.label
      : `${changes.length} modifications techniques sur la visite`;
  const shown = changes.slice(0, MAX_CHANGES);
  const extra = changes.length - shown.length;
  if (extra > 0) {
    shown.push({
      id: "more",
      label: `+ ${extra} autre${extra > 1 ? "s" : ""}`,
      detail: "Ouvrez la visite pour le détail.",
    });
  }
  return { stale: true, summary, changes: shown };
}

function touchesAfterAck(
  touches: VisitMeasurementTouch[],
  studyCreatedAt: Date | string | null | undefined,
  studyValidatedAt: Date | string | null | undefined,
): VisitTakeoffChange[] {
  const created = epoch(studyCreatedAt);
  const validated = epoch(studyValidatedAt);
  const ack = Math.max(created ?? 0, validated ?? 0);
  if (created == null && validated == null) return [];
  const changes: VisitTakeoffChange[] = [];
  for (const touch of touches) {
    const at = epoch(touch.updatedAt);
    if (at == null || at <= ack + TOUCH_AFTER_MS) continue;
    changes.push({
      id: touch.id,
      label: touch.label,
      detail: touch.detail,
    });
  }
  return changes;
}

/**
 * Compare la visite liée au métré déjà créé.
 * Avec une empreinte enregistrée : écart champ par champ.
 * Sinon : relevés modifiés après la création ou la dernière validation.
 */
export function evaluateVisitTakeoffDrift(input: {
  hasStudy: boolean;
  visitLinked: boolean;
  studyCreatedAt?: Date | string | null;
  studyValidatedAt?: Date | string | null;
  baseline?: VisitTechnicalSnapshot | null;
  current?: VisitTechnicalSnapshot | null;
  measurementTouches?: VisitMeasurementTouch[];
}): VisitTakeoffDriftResult {
  if (!input.hasStudy || !input.visitLinked) {
    return { stale: false, summary: null, changes: [] };
  }

  const baseline = input.baseline ?? null;
  const current = input.current ?? null;
  if (baseline && current) {
    if (baseline.visitId !== current.visitId) {
      return pack([
        {
          id: "visit-link",
          label: "Visite liée",
          detail: "La visite rattachée au métré a changé.",
        },
      ]);
    }
    return pack([
      ...diffScope(baseline, current),
      ...diffMeasurements(baseline.measurements, current.measurements),
    ]);
  }

  return pack(
    touchesAfterAck(
      input.measurementTouches ?? [],
      input.studyCreatedAt,
      input.studyValidatedAt,
    ),
  );
}
