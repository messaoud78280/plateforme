/**
 * Applique un bework_site_survey_v1 → SiteVisit (preview + commit).
 * Aucune invention de mesure. PLAN ≠ PHOTO ≠ MEASURE.
 * Données manuelles / MEASURE déjà présentes = protégées.
 */
import {
  BEWORK_SITE_SURVEY_FORMAT,
  parseCommercial,
  parseFindings,
  parseProposedWorks,
  type QuantitySource,
  type SiteVisitCommercialInfo,
  type SiteVisitFinding,
  type SiteVisitProposedWork,
} from "@/lib/site-visits/survey-types";
import { normalizeConstraints, parseVisitPrep } from "@/lib/site-visits/types";
import {
  mapProvenanceKind,
  evaluateSourceProtection,
  type ProjectContextProvenanceKind,
} from "@/lib/bework-context/provenance";

export type SurveyApplyFieldDiff = {
  field: string;
  label: string;
  before: string | null;
  after: string | null;
  protected: boolean;
  requiresConfirmation: boolean;
};

export type SurveyApplyMeasurementPreview = {
  action: "add" | "update" | "skip_protected";
  label: string;
  zone: string | null;
  unit: string;
  quantity: number | null;
  provenance_kind: ProjectContextProvenanceKind;
  source_ref: string | null;
  length_m: number | null;
  width_m: number | null;
  height_m: number | null;
  observation: string | null;
  existingId?: string | null;
};

export type SurveyApplyPreview = {
  format: typeof BEWORK_SITE_SURVEY_FORMAT;
  fieldDiffs: SurveyApplyFieldDiff[];
  measurements: SurveyApplyMeasurementPreview[];
  sourcesUsed: {
    plan: number;
    measure: number;
    manual: number;
    calculation: number;
    hypothesis: number;
    unknown: number;
  };
  toConfirm: string[];
  protectedConflicts: string[];
  proposedWorksCount: number;
  findingsCount: number;
};

export type SurveyApplyPayload = {
  subject?: string;
  clientNeed?: string | null;
  comments?: string | null;
  lots?: string[];
  zones?: string[];
  findings?: SiteVisitFinding[];
  proposedWorks?: SiteVisitProposedWork[];
  commercial?: SiteVisitCommercialInfo;
  constraints?: Record<string, unknown>;
  prep?: Record<string, unknown>;
  measurements: Array<{
    id?: string | null;
    zone: string | null;
    label: string;
    measureType: string;
    unit: string;
    lengthM: number | null;
    widthM: number | null;
    heightM: number | null;
    quantityValue: number | null;
    observation: string | null;
    lot: string | null;
    provenanceKind: ProjectContextProvenanceKind;
    sourceRef: string | null;
  }>;
};

function asObj(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null;
}

function str(v: unknown, max = 8000): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  if (!t) return null;
  return t.slice(0, max);
}

function num(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function qtySourceToProvenance(
  source: unknown,
  provenanceKindRaw: unknown,
): ProjectContextProvenanceKind {
  if (typeof provenanceKindRaw === "string" && provenanceKindRaw.trim()) {
    return mapProvenanceKind({ provenance: provenanceKindRaw });
  }
  const s = String(source ?? "").toLowerCase();
  if (s === "measured" || s === "measure") return "MEASURE";
  if (s === "plan") return "PLAN";
  if (s === "declared" || s === "manual") return "MANUAL";
  if (s === "calculated" || s === "calculation") return "CALCULATION";
  if (s === "estimated" || s === "proposed" || s === "hypothesis") return "HYPOTHESIS";
  if (s === "to_confirm" || s === "unknown") return "UNKNOWN";
  return "UNKNOWN";
}

function display(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === "string") return v.trim() || null;
  if (typeof v === "number") return String(v);
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function isProtectedExistingText(value: string | null | undefined): boolean {
  return Boolean(value && value.trim().length > 0);
}

export function parseSurveyJsonRaw(raw: string): {
  ok: true;
  survey: Record<string, unknown>;
} | { ok: false; error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: "JSON invalide." };
  }
  const obj = asObj(parsed);
  if (!obj) return { ok: false, error: "Le JSON doit être un objet." };
  const format = str(obj.type) || str(obj.format);
  if (format !== BEWORK_SITE_SURVEY_FORMAT) {
    return {
      ok: false,
      error: `Format attendu : ${BEWORK_SITE_SURVEY_FORMAT} (reçu : ${format ?? "inconnu"}).`,
    };
  }
  return { ok: true, survey: obj };
}

type CurrentVisit = {
  subject: string;
  clientNeed: string | null;
  comments: string | null;
  lots: string[];
  zones: string[];
  findings: unknown;
  proposedWorks: unknown;
  commercial: unknown;
  constraints: unknown;
  prep: unknown;
  measurements: Array<{
    id: string;
    zone: string | null;
    label: string;
    unit: string;
    lengthM: number | null;
    widthM: number | null;
    heightM: number | null;
    quantityValue: number | null;
    computedQuantity: number;
    observation: string | null;
    lot: string | null;
  }>;
};

function collectMeasurements(survey: Record<string, unknown>): Array<Record<string, unknown>> {
  const out: Array<Record<string, unknown>> = [];
  const zones = Array.isArray(survey.zones) ? survey.zones : [];
  for (const z of zones) {
    const zo = asObj(z);
    if (!zo) continue;
    const zoneName = str(zo.name);
    const ms = Array.isArray(zo.measurements) ? zo.measurements : [];
    for (const m of ms) {
      const mo = asObj(m);
      if (!mo) continue;
      out.push({ ...mo, zone: mo.zone ?? zoneName });
    }
  }
  const orphans = Array.isArray(survey.orphan_measurements)
    ? survey.orphan_measurements
    : [];
  for (const m of orphans) {
    const mo = asObj(m);
    if (mo) out.push(mo);
  }
  const top = Array.isArray(survey.measurements) ? survey.measurements : [];
  for (const m of top) {
    const mo = asObj(m);
    if (mo) out.push(mo);
  }
  return out;
}

export function buildSurveyApplyPreview(input: {
  survey: Record<string, unknown>;
  current: CurrentVisit;
  confirmProtected?: boolean;
}): SurveyApplyPreview {
  const visit = asObj(input.survey.visit) ?? {};
  const chantier = asObj(input.survey.chantier) ?? asObj(input.survey.project) ?? {};
  const commercial = parseCommercial(input.survey.commercial);
  const findings = parseFindings(input.survey.findings);
  const proposedWorks = parseProposedWorks(input.survey.proposed_works);
  const fieldNotes = str(input.survey.field_notes);
  const clientNeed =
    str(visit.client_need) ||
    str(chantier.description) ||
    str(input.survey.client_need);
  const subject = str(visit.purpose, 200) || str(visit.subject, 200);
  const comments = str(input.survey.comments) || str(visit.comments);
  const lots = Array.isArray(chantier.lots)
    ? (chantier.lots as unknown[]).filter((x): x is string => typeof x === "string")
    : Array.isArray(input.survey.lots)
      ? (input.survey.lots as unknown[]).filter((x): x is string => typeof x === "string")
      : [];
  const zonesFromSurvey = Array.isArray(input.survey.zones)
    ? (input.survey.zones as unknown[])
        .map((z) => {
          if (typeof z === "string") return z;
          const zo = asObj(z);
          return zo ? str(zo.name) : null;
        })
        .filter((x): x is string => Boolean(x))
    : [];

  const fieldDiffs: SurveyApplyFieldDiff[] = [];
  const pushDiff = (
    field: string,
    label: string,
    before: unknown,
    after: unknown,
    protectedFlag: boolean,
  ) => {
    const b = display(before);
    const a = display(after);
    if (a == null) return;
    if (b === a) return;
    fieldDiffs.push({
      field,
      label,
      before: b,
      after: a,
      protected: protectedFlag,
      requiresConfirmation: protectedFlag && Boolean(b),
    });
  };

  pushDiff(
    "subject",
    "Objet / travaux demandés",
    input.current.subject,
    subject,
    isProtectedExistingText(input.current.subject),
  );
  pushDiff(
    "client_need",
    "Besoin client / travaux",
    input.current.clientNeed,
    clientNeed,
    isProtectedExistingText(input.current.clientNeed),
  );
  pushDiff(
    "comments",
    "Observations",
    input.current.comments,
    comments,
    isProtectedExistingText(input.current.comments),
  );
  pushDiff(
    "field_notes",
    "Relevés (texte)",
    parseVisitPrep(input.current.prep).fieldNotes,
    fieldNotes,
    isProtectedExistingText(parseVisitPrep(input.current.prep).fieldNotes),
  );
  if (lots.length) {
    pushDiff("lots", "Lots", input.current.lots.join(", "), lots.join(", "), false);
  }
  if (zonesFromSurvey.length) {
    pushDiff(
      "zones",
      "Zones",
      input.current.zones.join(", "),
      zonesFromSurvey.join(", "),
      false,
    );
  }
  if (findings.length) {
    pushDiff(
      "findings",
      "Constats",
      Array.isArray(input.current.findings)
        ? `${(input.current.findings as unknown[]).length} constat(s)`
        : null,
      `${findings.length} constat(s)`,
      Array.isArray(input.current.findings) &&
        (input.current.findings as unknown[]).length > 0,
    );
  }
  if (proposedWorks.length) {
    pushDiff(
      "proposed_works",
      "Travaux proposés",
      Array.isArray(input.current.proposedWorks)
        ? `${(input.current.proposedWorks as unknown[]).length} poste(s)`
        : null,
      `${proposedWorks.length} poste(s)`,
      Array.isArray(input.current.proposedWorks) &&
        (input.current.proposedWorks as unknown[]).length > 0,
    );
  }
  if (commercial && Object.values(commercial).some((v) => v != null && v !== "")) {
    pushDiff(
      "commercial",
      "Budget / délai",
      display(input.current.commercial),
      display(commercial),
      Boolean(input.current.commercial),
    );
  }

  const sourcesUsed = {
    plan: 0,
    measure: 0,
    manual: 0,
    calculation: 0,
    hypothesis: 0,
    unknown: 0,
  };
  const toConfirm: string[] = [];
  const measurements: SurveyApplyMeasurementPreview[] = [];

  for (const raw of collectMeasurements(input.survey)) {
    const label = str(raw.name) || str(raw.label) || "Mesure";
    const unit = str(raw.unit, 40) || "u";
    const provenance = qtySourceToProvenance(raw.source ?? raw.quantity_source, raw.provenance_kind);
    const sourceRef = str(raw.source_ref) || str(raw.document_id) || null;
    const lengthM = num(raw.length_m ?? raw.lengthM);
    const widthM = num(raw.width_m ?? raw.widthM);
    const heightM = num(raw.height_m ?? raw.heightM);
    const quantity = num(raw.value ?? raw.quantity_value ?? raw.quantityValue ?? raw.computed_quantity);
    const observation = str(raw.observation);
    const zone = str(raw.zone);

    if (provenance === "PLAN") sourcesUsed.plan += 1;
    else if (provenance === "MEASURE") sourcesUsed.measure += 1;
    else if (provenance === "MANUAL") sourcesUsed.manual += 1;
    else if (provenance === "CALCULATION") sourcesUsed.calculation += 1;
    else if (provenance === "HYPOTHESIS") sourcesUsed.hypothesis += 1;
    else sourcesUsed.unknown += 1;

    if (
      quantity == null &&
      lengthM == null &&
      widthM == null &&
      heightM == null
    ) {
      toConfirm.push(`${label} — cote non lisible / absente (null, à confirmer)`);
    }
    if (provenance === "HYPOTHESIS" || provenance === "UNKNOWN") {
      toConfirm.push(`${label} — ${provenance} (ne pas traiter comme mesure certaine)`);
    }
    // Interdit : inventer une dimension si source PHOTO seule
    const sourceRaw = String(raw.source ?? "").toLowerCase();
    if (
      (sourceRaw === "photo" || sourceRaw === "image") &&
      (quantity != null || lengthM != null || widthM != null || heightM != null)
    ) {
      toConfirm.push(
        `${label} — cote issue d’une photo refusée (PHOTO ≠ MEASURE) ; à confirmer sur terrain/plan`,
      );
      continue;
    }

    const existing = input.current.measurements.find(
      (m) =>
        m.id === str(raw.measurement_id) ||
        (m.label.trim().toLowerCase() === label.toLowerCase() &&
          (m.zone || "") === (zone || "")),
    );

    if (existing) {
      const protection = evaluateSourceProtection({
        currentKind: "MEASURE",
        proposalKind: provenance,
        currentValue: existing.computedQuantity,
        proposalValue: quantity,
        hasValidatedQuantity: existing.computedQuantity > 0,
        intent: "FIELD_UPDATE",
        fieldLabel: label,
      });
      if (protection.status === "BLOCKED" && !input.confirmProtected) {
        measurements.push({
          action: "skip_protected",
          label,
          zone,
          unit,
          quantity,
          provenance_kind: provenance,
          source_ref: sourceRef,
          length_m: lengthM,
          width_m: widthM,
          height_m: heightM,
          observation,
          existingId: existing.id,
        });
        continue;
      }
      measurements.push({
        action: "update",
        label,
        zone,
        unit,
        quantity,
        provenance_kind: provenance,
        source_ref: sourceRef,
        length_m: lengthM,
        width_m: widthM,
        height_m: heightM,
        observation,
        existingId: existing.id,
      });
    } else {
      measurements.push({
        action: "add",
        label,
        zone,
        unit,
        quantity,
        provenance_kind: provenance,
        source_ref: sourceRef,
        length_m: lengthM,
        width_m: widthM,
        height_m: heightM,
        observation,
      });
    }
  }

  const missing = Array.isArray(input.survey.missing_information)
    ? input.survey.missing_information
    : [];
  for (const mi of missing) {
    const mo = asObj(mi);
    if (!mo) continue;
    const label = str(mo.label);
    if (label) toConfirm.push(label);
  }

  const protectedConflicts = [
    ...fieldDiffs.filter((d) => d.requiresConfirmation).map((d) => d.label),
    ...measurements
      .filter((m) => m.action === "skip_protected")
      .map((m) => `Mesure protégée : ${m.label}`),
  ];

  return {
    format: BEWORK_SITE_SURVEY_FORMAT,
    fieldDiffs,
    measurements,
    sourcesUsed,
    toConfirm: [...new Set(toConfirm)].slice(0, 40),
    protectedConflicts,
    proposedWorksCount: proposedWorks.length,
    findingsCount: findings.length,
  };
}

export function buildSurveyApplyPayload(input: {
  survey: Record<string, unknown>;
  current: CurrentVisit;
  confirmProtected?: boolean;
}): SurveyApplyPayload {
  const preview = buildSurveyApplyPreview(input);
  const visit = asObj(input.survey.visit) ?? {};
  const chantier = asObj(input.survey.chantier) ?? asObj(input.survey.project) ?? {};
  const prepCurrent = parseVisitPrep(input.current.prep);
  const fieldNotes = str(input.survey.field_notes);

  const payload: SurveyApplyPayload = {
    measurements: [],
  };

  for (const d of preview.fieldDiffs) {
    if (d.requiresConfirmation && !input.confirmProtected) continue;
    if (d.field === "subject" && d.after) payload.subject = d.after;
    if (d.field === "client_need") payload.clientNeed = d.after;
    if (d.field === "comments") payload.comments = d.after;
    if (d.field === "lots" && d.after) {
      payload.lots = d.after.split(",").map((s) => s.trim()).filter(Boolean);
    }
    if (d.field === "zones" && d.after) {
      payload.zones = d.after.split(",").map((s) => s.trim()).filter(Boolean);
    }
  }

  const findings = parseFindings(input.survey.findings);
  const proposedWorks = parseProposedWorks(input.survey.proposed_works);
  const commercial = parseCommercial(input.survey.commercial);
  const constraints = input.survey.constraints
    ? normalizeConstraints(input.survey.constraints)
    : undefined;

  if (findings.length && (!Array.isArray(input.current.findings) || input.confirmProtected || !(input.current.findings as unknown[]).length)) {
    payload.findings = findings;
  } else if (findings.length && input.confirmProtected) {
    payload.findings = findings;
  }

  if (
    proposedWorks.length &&
    (input.confirmProtected ||
      !Array.isArray(input.current.proposedWorks) ||
      !(input.current.proposedWorks as unknown[]).length)
  ) {
    payload.proposedWorks = proposedWorks;
  }

  if (commercial && Object.values(commercial).some((v) => v != null && v !== "")) {
    if (input.confirmProtected || !input.current.commercial) {
      payload.commercial = commercial;
    }
  }

  if (constraints) payload.constraints = constraints as Record<string, unknown>;

  if (fieldNotes && (input.confirmProtected || !prepCurrent.fieldNotes?.trim())) {
    payload.prep = { ...prepCurrent, fieldNotes };
  }

  // Fallback subject/clientNeed from survey even without diff if empty current
  if (!payload.subject && !input.current.subject.trim()) {
    payload.subject = str(visit.purpose, 200) || undefined;
  }
  if (payload.clientNeed === undefined && !input.current.clientNeed) {
    payload.clientNeed =
      str(visit.client_need) || str(chantier.description) || null;
  }

  for (const m of preview.measurements) {
    if (m.action === "skip_protected") continue;
    payload.measurements.push({
      id: m.existingId ?? null,
      zone: m.zone,
      label: m.label,
      measureType: "FREE",
      unit: m.unit,
      lengthM: m.length_m,
      widthM: m.width_m,
      heightM: m.height_m,
      quantityValue: m.quantity,
      observation: m.observation
        ? `${m.observation}${m.provenance_kind === "PLAN" ? " [PLAN]" : m.provenance_kind === "HYPOTHESIS" ? " [HYPOTHÈSE]" : ""}`
        : m.provenance_kind === "PLAN"
          ? `[PLAN${m.source_ref ? ` · ${m.source_ref}` : ""}]`
          : m.provenance_kind === "HYPOTHESIS"
            ? "[HYPOTHÈSE — à confirmer]"
            : null,
      lot: null,
      provenanceKind: m.provenance_kind,
      sourceRef: m.source_ref,
    });
  }

  return payload;
}
