/**
 * Parser bework_technical_bundle_v1 — validation + normalisation.
 * Aucune écriture DB. Aucune API IA.
 */
import { normalizeCivilStartDate } from "@/lib/preparation/schedule/calendar";
import { normalizePrepUnit } from "@/lib/preparation/units";
import type { PrepIssue } from "@/lib/preparation/types";
import { technicalBundleFingerprint } from "@/lib/technical-engine/fingerprint";
import {
  DEFAULT_PLANNING_WORKING_DAYS,
  TECHNICAL_BUNDLE_FORMAT,
  TECHNICAL_CLASSIFICATIONS,
  TECHNICAL_CONFIDENCES,
  TECHNICAL_MEDIA_ORIGINS,
  TECHNICAL_SCHEMA_VERSION,
  TECHNICAL_SOURCE_TYPES,
  TECHNICAL_WORKING_DAYS,
  classificationToPrepProvenance,
  type TechnicalAssumption,
  type TechnicalBundleV1,
  type TechnicalClassification,
  type TechnicalConfidence,
  type TechnicalFact,
  type TechnicalLot,
  type TechnicalMeasurement,
  type TechnicalMediaOrigin,
  type TechnicalMediaRef,
  type TechnicalParameter,
  type TechnicalPlanningSettings,
  type TechnicalProvenance,
  type TechnicalQuantities,
  type TechnicalQuoteTransferIntent,
  type TechnicalScheduleTask,
  type TechnicalSource,
  type TechnicalSourceType,
  type TechnicalTakeoffItem,
  type TechnicalUnknown,
  type TechnicalWorkingDay,
  type TechnicalWorkflowStep,
} from "@/lib/technical-engine/schema";

export const TECHNICAL_LIMITS = {
  rawBytes: 2_500_000,
  parameters: 2000,
  lines: 5000,
  text: 4000,
  techText: 8000,
};

export type TechnicalIssue = PrepIssue & {
  severity: "error" | "warn" | "info";
};

export type NormalizedTechnicalBundle = TechnicalBundleV1 & {
  fingerprint: string;
  canonical: Record<string, unknown>;
};

export type TechnicalParseResult =
  | {
      ok: true;
      bundle: NormalizedTechnicalBundle;
      issues: TechnicalIssue[];
    }
  | { ok: false; issues: TechnicalIssue[] };

type Obj = Record<string, unknown>;

const isObj = (v: unknown): v is Obj =>
  typeof v === "object" && v !== null && !Array.isArray(v);

function str(v: unknown, max = TECHNICAL_LIMITS.text): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t.slice(0, max) : null;
}

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function strList(v: unknown, max = 500): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => str(x, max)).filter((x): x is string => !!x);
}

function info(issues: TechnicalIssue[], path: string, message: string) {
  issues.push({ path, message, severity: "info" });
}

function warn(issues: TechnicalIssue[], path: string, message: string) {
  issues.push({ path, message, severity: "warn" });
}

function err(issues: TechnicalIssue[], path: string, message: string) {
  issues.push({ path, message, severity: "error" });
}

function asClassification(v: unknown): TechnicalClassification | null {
  const s = str(v, 40)?.toUpperCase().replace(/-/g, "_");
  if (!s) return null;
  return (TECHNICAL_CLASSIFICATIONS as readonly string[]).includes(s)
    ? (s as TechnicalClassification)
    : null;
}

function asConfidence(v: unknown): TechnicalConfidence | null {
  const s = str(v, 40)?.toLowerCase().replace(/-/g, "_");
  if (!s) return null;
  return (TECHNICAL_CONFIDENCES as readonly string[]).includes(s)
    ? (s as TechnicalConfidence)
    : null;
}

function asSourceType(v: unknown): TechnicalSourceType | null {
  const s = str(v, 40)?.toLowerCase().replace(/-/g, "_");
  if (!s) return null;
  return (TECHNICAL_SOURCE_TYPES as readonly string[]).includes(s)
    ? (s as TechnicalSourceType)
    : null;
}

function parseProvenance(
  raw: unknown,
  path: string,
  issues: TechnicalIssue[],
): TechnicalProvenance | undefined {
  if (!isObj(raw)) return undefined;
  const source = asSourceType(raw.source) ?? "assumption";
  if (!asSourceType(raw.source)) {
    warn(issues, `${path}.source`, `Type de source inconnu — « assumption » par défaut`);
  }
  const confidence =
    asConfidence(raw.confidence) ??
    (source === "assumption" ? "to_confirm" : "to_confirm");
  const classification = asClassification(raw.classification);
  if (classification === "UNKNOWN") {
    warn(
      issues,
      path,
      "Classification UNKNOWN sur une provenance de valeur — préférer unknowns[] sans inventer de chiffre",
    );
  }
  if (classification === "ASSUMED" && confidence === "confirmed") {
    warn(
      issues,
      path,
      "Hypothèse marquée « confirmed » — confiance rétrogradée en to_confirm",
    );
  }
  return {
    source,
    source_ref: str(raw.source_ref ?? raw.sourceRef, 80),
    confidence:
      classification === "ASSUMED" && confidence === "confirmed"
        ? "to_confirm"
        : confidence,
    classification: classification ?? undefined,
    note: str(raw.note, TECHNICAL_LIMITS.techText),
  };
}

function workingDayToPrep(day: TechnicalWorkingDay): number {
  const map: Record<TechnicalWorkingDay, number> = {
    MON: 1,
    TUE: 2,
    WED: 3,
    THU: 4,
    FRI: 5,
    SAT: 6,
    SUN: 7,
  };
  return map[day];
}

function parseWorkingDays(
  raw: unknown,
  issues: TechnicalIssue[],
): TechnicalWorkingDay[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return [...DEFAULT_PLANNING_WORKING_DAYS];
  }
  const out: TechnicalWorkingDay[] = [];
  for (const d of raw) {
    if (typeof d === "number" && d >= 1 && d <= 7) {
      const names = TECHNICAL_WORKING_DAYS;
      out.push(names[d - 1]!);
      continue;
    }
    const s = str(d, 8)?.toUpperCase();
    if (s && (TECHNICAL_WORKING_DAYS as readonly string[]).includes(s)) {
      out.push(s as TechnicalWorkingDay);
    } else {
      warn(issues, "planning_settings.working_days", `Jour ignoré : ${String(d)}`);
    }
  }
  return out.length ? out : [...DEFAULT_PLANNING_WORKING_DAYS];
}

function parseQuantities(raw: unknown): TechnicalQuantities | undefined {
  if (!isObj(raw)) return undefined;
  return {
    geometric: num(raw.geometric),
    technical: num(raw.technical),
    procurement: num(raw.procurement),
    quote: num(raw.quote),
    planning: num(raw.planning),
  };
}

/** Extrait un objet JSON technique depuis un collage ChatGPT éventuel. */
export function extractTechnicalJsonText(raw: string): string {
  const t = raw.trim();
  if (!t) return t;
  if (t.startsWith("{")) return t;
  const marker = `"${TECHNICAL_BUNDLE_FORMAT}"`;
  const idx = t.indexOf(marker);
  if (idx < 0) return t;
  const start = t.lastIndexOf("{", idx);
  if (start < 0) return t;
  let depth = 0;
  for (let i = start; i < t.length; i++) {
    const c = t[i];
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) return t.slice(start, i + 1);
    }
  }
  return t;
}

export function parseTechnicalJsonText(raw: string): TechnicalParseResult {
  if (raw.length > TECHNICAL_LIMITS.rawBytes) {
    return {
      ok: false,
      issues: [
        {
          path: "$",
          severity: "error",
          message: `JSON trop volumineux (> ${TECHNICAL_LIMITS.rawBytes} octets)`,
        },
      ],
    };
  }
  let data: unknown;
  try {
    data = JSON.parse(extractTechnicalJsonText(raw));
  } catch {
    return {
      ok: false,
      issues: [
        {
          path: "$",
          severity: "error",
          message:
            "JSON illisible. Collez uniquement le JSON bework_technical_bundle_v1 produit par ChatGPT.",
        },
      ],
    };
  }
  return parseTechnicalBundle(data);
}

export function parseTechnicalBundle(input: unknown): TechnicalParseResult {
  const issues: TechnicalIssue[] = [];

  if (!isObj(input)) {
    return {
      ok: false,
      issues: [{ path: "$", message: "Le JSON doit être un objet", severity: "error" }],
    };
  }

  const format = str(input.format ?? input.type, 80);
  if (format !== TECHNICAL_BUNDLE_FORMAT) {
    const hint =
      format === "bework_prep_bundle_v1"
        ? " Utilisez l’adapter prep→technical, ou l’import métré existant."
        : format?.startsWith("bework_quote_")
          ? " Ce format relève de l’import devis."
          : "";
    return {
      ok: false,
      issues: [
        {
          path: "format",
          severity: "error",
          message: `Format non reconnu : « ${format ?? "absent"} ». Attendu : ${TECHNICAL_BUNDLE_FORMAT}.${hint}`,
        },
      ],
    };
  }

  const schemaVersion = str(input.schema_version, 20) ?? TECHNICAL_SCHEMA_VERSION;
  if (schemaVersion !== TECHNICAL_SCHEMA_VERSION) {
    warn(
      issues,
      "schema_version",
      `Version « ${schemaVersion} » — moteur V1 appliqué (attendu ${TECHNICAL_SCHEMA_VERSION})`,
    );
  }

  const bundleId = str(input.bundle_id, 80);
  if (!bundleId) err(issues, "bundle_id", "bundle_id obligatoire (identifiant stable)");

  let sourceRevision: number | undefined;
  const revRaw = input.source_revision ?? input.sourceRevision;
  if (typeof revRaw === "number" && Number.isFinite(revRaw) && revRaw >= 1) {
    sourceRevision = Math.trunc(revRaw);
  } else if (revRaw != null) {
    warn(issues, "source_revision", "source_revision invalide — ignoré");
  } else {
    info(issues, "source_revision", "source_revision absent — traité comme 1 à l’import");
    sourceRevision = 1;
  }

  let mode: "demonstration" | "professional" = "professional";
  if (input.mode === "demonstration") mode = "demonstration";
  else if (input.mode != null && input.mode !== "professional") {
    warn(issues, "mode", "Mode inconnu — professional par défaut");
  }

  const metaRaw = isObj(input.meta) ? input.meta : {};
  const projectRaw = isObj(input.project) ? input.project : {};
  const title =
    str(metaRaw.title, 200) ??
    str(projectRaw.title, 200) ??
    null;
  if (!title) err(issues, "meta.title", "Titre obligatoire (meta.title ou project.title)");

  const meta = {
    language: str(metaRaw.language, 10) ?? "fr",
    generated_at: str(metaRaw.generated_at, 40),
    generator: str(metaRaw.generator, 80),
    title: title ?? "Étude technique sans titre",
  };

  const project = {
    external_ref: str(projectRaw.external_ref, 80),
    title: str(projectRaw.title, 200) ?? meta.title,
    address: str(projectRaw.address, 300),
    trade_hints: strList(projectRaw.trade_hints, 80),
    client_name: str(projectRaw.client_name, 120),
  };

  // Sources
  const sources: TechnicalSource[] = [];
  if (Array.isArray(input.sources)) {
    input.sources.forEach((s, i) => {
      if (!isObj(s)) return;
      const type = asSourceType(s.type) ?? "technical_document";
      if (!asSourceType(s.type)) {
        warn(issues, `sources[${i}].type`, "Type de source inconnu — technical_document");
      }
      const id = str(s.id, 60) ?? `SRC-${i + 1}`;
      sources.push({
        id,
        type,
        label: str(s.label ?? s.title ?? s.filename, 200) ?? id,
        filename: str(s.filename, 200),
        plan_number: str(s.plan_number ?? s.planNumber, 60),
        revision: str(s.revision, 40),
        date: str(s.date, 40),
        page: num(s.page),
        chantier_file_id: str(s.chantier_file_id ?? s.chantierFileId, 60),
        site_document_id: str(s.site_document_id ?? s.siteDocumentId, 60),
        site_visit_id: str(s.site_visit_id ?? s.siteVisitId, 60),
        media_id: str(s.media_id ?? s.mediaId, 60),
        note: str(s.note, TECHNICAL_LIMITS.techText),
      });
    });
  }
  if (!sources.length) {
    warn(issues, "sources", "Aucune source déclarée — provenance à contrôler");
  }

  const facts: TechnicalFact[] = [];
  if (Array.isArray(input.facts)) {
    input.facts.forEach((f, i) => {
      if (!isObj(f)) return;
      const text = str(f.text, TECHNICAL_LIMITS.techText);
      if (!text) return;
      facts.push({
        id: str(f.id, 60) ?? `F-${i + 1}`,
        text,
        provenance: parseProvenance(f.provenance ?? f, `facts[${i}]`, issues) ?? {
          source: "user_input",
          confidence: "to_confirm",
        },
      });
    });
  }

  const measurements: TechnicalMeasurement[] = [];
  if (Array.isArray(input.measurements)) {
    input.measurements.forEach((m, i) => {
      if (!isObj(m)) return;
      const label = str(m.label, 200);
      if (!label) return;
      const classification =
        asClassification(m.classification) ??
        asClassification(isObj(m.provenance) ? m.provenance.classification : null);
      const value = num(m.value);
      if (classification === "UNKNOWN" && value != null) {
        warn(
          issues,
          `measurements[${i}]`,
          `${label} : UNKNOWN avec valeur numérique — la valeur sera ignorée (unknowns)`,
        );
      }
      measurements.push({
        id: str(m.id, 60) ?? `M-${i + 1}`,
        label,
        value: classification === "UNKNOWN" ? null : value,
        unit: str(m.unit, 40),
        formula: str(m.formula, 500),
        provenance: parseProvenance(m.provenance ?? m, `measurements[${i}]`, issues) ?? {
          source: "field_measurement",
          confidence: "to_confirm",
          classification: classification ?? undefined,
        },
      });
    });
  }

  const assumptions: TechnicalAssumption[] = [];
  if (Array.isArray(input.assumptions)) {
    input.assumptions.forEach((a, i) => {
      if (!isObj(a)) return;
      const text = str(a.text ?? a.label, TECHNICAL_LIMITS.techText);
      if (!text) return;
      assumptions.push({
        id: str(a.id, 60) ?? `H-${i + 1}`,
        text,
        impact: str(a.impact, TECHNICAL_LIMITS.techText),
        status:
          a.status === "accepted" || a.status === "rejected" || a.status === "open"
            ? a.status
            : "open",
      });
    });
  }

  const unknowns: TechnicalUnknown[] = [];
  if (Array.isArray(input.unknowns)) {
    input.unknowns.forEach((u, i) => {
      if (!isObj(u)) return;
      const text = str(u.text, TECHNICAL_LIMITS.techText);
      if (!text) return;
      unknowns.push({
        id: str(u.id, 60) ?? `U-${i + 1}`,
        text,
        blocks: Array.isArray(u.blocks)
          ? (u.blocks.filter((b) =>
              ["takeoff", "quote", "schedule", "execution"].includes(String(b)),
            ) as TechnicalUnknown["blocks"])
          : undefined,
      });
    });
  }

  const lots: TechnicalLot[] = [];
  if (Array.isArray(input.lots)) {
    input.lots.forEach((l) => {
      if (!isObj(l)) return;
      const code = str(l.code, 40);
      const label = str(l.label, 120);
      if (code && label) lots.push({ code, label });
    });
  }

  const takeoffRaw = isObj(input.takeoff) ? input.takeoff : {};
  const parameters: TechnicalParameter[] = [];
  if (Array.isArray(takeoffRaw.parameters)) {
    takeoffRaw.parameters.forEach((p, i) => {
      if (!isObj(p)) return;
      const key = str(p.key, 120);
      const label = str(p.label, 200);
      if (!key || !label) {
        warn(issues, `takeoff.parameters[${i}]`, "Paramètre sans key/label — ignoré");
        return;
      }
      const value = num(p.value);
      const formula = str(p.formula, 500);
      if (value == null && !formula) {
        warn(issues, `takeoff.parameters[${i}]`, `${key} : ni value ni formula`);
      }
      const unitRaw = str(p.unit, 40) ?? "u";
      const unitNorm = normalizePrepUnit(unitRaw);
      parameters.push({
        key,
        label,
        unit: unitNorm.unit || unitRaw,
        value: formula ? null : value,
        formula,
        provenance: parseProvenance(p.provenance, `takeoff.parameters[${i}]`, issues),
        hypothesis_id: str(p.hypothesis_id ?? p.hypothesisId, 60),
        note: str(p.note, TECHNICAL_LIMITS.techText),
      });
      if (parameters.length > TECHNICAL_LIMITS.parameters) {
        err(issues, "takeoff.parameters", `Trop de paramètres (> ${TECHNICAL_LIMITS.parameters})`);
      }
    });
  }

  const items: TechnicalTakeoffItem[] = [];
  if (Array.isArray(takeoffRaw.items)) {
    takeoffRaw.items.forEach((it, i) => {
      if (!isObj(it)) return;
      const code = str(it.code, 40);
      const designation = str(it.designation ?? it.label, 300);
      if (!code || !designation) {
        warn(issues, `takeoff.items[${i}]`, "Ligne sans code/désignation — ignorée");
        return;
      }
      const unitRaw = str(it.unit, 40) ?? "u";
      const unitNorm = normalizePrepUnit(unitRaw);
      const quantities = parseQuantities(it.quantities);
      const quantity =
        num(it.quantity) ??
        quantities?.technical ??
        quantities?.quote ??
        quantities?.geometric ??
        null;
      const provenance = parseProvenance(
        it.provenance,
        `takeoff.items[${i}]`,
        issues,
      );
      const classification =
        provenance?.classification ?? asClassification(it.classification);
      if (classification === "UNKNOWN" && quantity != null) {
        warn(
          issues,
          `takeoff.items[${i}]`,
          `${code} : UNKNOWN avec quantité — quantité non retenue (à confirmer)`,
        );
      }
      if (
        classification === "ASSUMED" ||
        provenance?.source === "assumption" ||
        provenance?.confidence === "to_confirm"
      ) {
        // volontairement silencieux — compté en preview
      }
      items.push({
        code,
        lot: str(it.lot, 40) ?? "GEN",
        sub_lot: str(it.sub_lot ?? it.subLot, 40),
        location: str(it.location, 120),
        designation,
        description: str(it.description, TECHNICAL_LIMITS.techText),
        unit: unitNorm.unit || unitRaw,
        formula: str(it.formula, 500),
        quantity: classification === "UNKNOWN" ? null : quantity,
        quantities,
        role:
          it.role === "indicator" || it.role === "logistics" || it.role === "quote"
            ? it.role
            : "quote",
        provenance,
        assumptions: strList(it.assumptions),
        to_confirm: strList(it.to_confirm ?? it.toConfirm),
        media_refs: strList(it.media_refs ?? it.mediaRefs, 80),
        plan_refs: strList(it.plan_refs ?? it.planRefs, 80),
        warnings: strList(it.warnings, 500),
      });
      if (items.length > TECHNICAL_LIMITS.lines) {
        err(issues, "takeoff.items", `Trop de lignes (> ${TECHNICAL_LIMITS.lines})`);
      }
    });
  }

  if (!items.length) {
    warn(issues, "takeoff.items", "Aucun poste de métré — étude vide côté quantités");
  }

  // Workflow
  let workflow: { steps: TechnicalWorkflowStep[] } | null = null;
  if (isObj(input.workflow) && Array.isArray(input.workflow.steps)) {
    const steps: TechnicalWorkflowStep[] = [];
    input.workflow.steps.forEach((st, i) => {
      if (!isObj(st)) return;
      const id = str(st.id ?? st.code, 40);
      const name = str(st.name ?? st.designation, 200);
      if (!id || !name) {
        warn(issues, `workflow.steps[${i}]`, "Étape sans id/name — ignorée");
        return;
      }
      steps.push({
        id,
        code: str(st.code, 40),
        lot: str(st.lot, 40),
        order: num(st.order) ?? i + 1,
        name,
        description: str(st.description, TECHNICAL_LIMITS.techText),
        kind:
          st.kind === "control" || st.kind === "wait" || st.kind === "work"
            ? st.kind
            : "work",
        prerequisites: strList(st.prerequisites),
        depends_on: strList(st.depends_on ?? st.dependsOn),
        takeoff_ids: strList(st.takeoff_ids ?? st.takeoffIds, 40),
        controls: strList(st.controls),
        crew: strList(st.crew),
        equipment: strList(st.equipment),
        duration: st.duration ?? undefined,
      });
    });
    workflow = { steps };
  }

  // Schedule
  let schedule: { tasks: TechnicalScheduleTask[]; note: string | null } | null = null;
  if (isObj(input.schedule)) {
    const tasks: TechnicalScheduleTask[] = [];
    if (Array.isArray(input.schedule.tasks)) {
      input.schedule.tasks.forEach((t, i) => {
        if (!isObj(t)) return;
        const stepId = str(t.step_id ?? t.stepId, 40);
        if (!stepId) {
          warn(issues, `schedule.tasks[${i}]`, "Tâche sans step_id — ignorée");
          return;
        }
        const depends_on: TechnicalScheduleTask["depends_on"] = [];
        if (Array.isArray(t.depends_on)) {
          for (const d of t.depends_on) {
            if (!isObj(d)) continue;
            const pred = str(d.step_id ?? d.stepId, 40);
            if (!pred) continue;
            depends_on.push({
              step_id: pred,
              type:
                d.type === "SS" || d.type === "FF" || d.type === "FS" ? d.type : "FS",
              lag_days: num(d.lag_days ?? d.lagDays) ?? 0,
            });
          }
        }
        tasks.push({
          step_id: stepId,
          depends_on,
          include_in_base: t.include_in_base === false ? false : true,
        });
      });
    }
    schedule = { tasks, note: str(input.schedule.note, TECHNICAL_LIMITS.techText) };
  }

  // Planning settings
  let planning_settings: TechnicalPlanningSettings | null = null;
  const psRaw = isObj(input.planning_settings)
    ? input.planning_settings
    : isObj(input.schedule)
      ? input.schedule
      : null;
  if (psRaw) {
    const rawStart = str(psRaw.start_date ?? psRaw.startDate, 20);
    const startDate = normalizeCivilStartDate(rawStart);
    if (rawStart && !startDate) {
      warn(
        issues,
        "planning_settings.start_date",
        `Date de démarrage invalide ou sentinelle (« ${rawStart} ») — traitée comme null (à définir)`,
      );
    }
    const desired = str(
      psRaw.desired_start_period ?? psRaw.desiredStartPeriod,
      20,
    );
    if (desired && startDate) {
      info(
        issues,
        "planning_settings",
        "start_date et desired_start_period présents — start_date prime",
      );
    }
    if (desired && !startDate) {
      info(
        issues,
        "planning_settings.desired_start_period",
        `Période souhaitée « ${desired} » — date civile à définir`,
      );
    }
    planning_settings = {
      start_date: startDate,
      desired_start_period: desired,
      start_date_confidence: asConfidence(psRaw.start_date_confidence),
      start_date_source: asSourceType(psRaw.start_date_source),
      working_days: parseWorkingDays(psRaw.working_days ?? psRaw.workingDays, issues),
      calendar: str(psRaw.calendar, 40) ?? "FR",
    };
  } else if (schedule) {
    planning_settings = {
      start_date: null,
      working_days: [...DEFAULT_PLANNING_WORKING_DAYS],
      calendar: "FR",
    };
    info(
      issues,
      "planning_settings",
      "Absent — start_date = null, calendrier FR lun–ven par défaut",
    );
  }

  let quote_transfer: TechnicalQuoteTransferIntent | null = null;
  if (isObj(input.quote_transfer)) {
    quote_transfer = {
      create_quote: input.quote_transfer.create_quote === true,
      selected_codes: Array.isArray(input.quote_transfer.selected_codes)
        ? strList(input.quote_transfer.selected_codes, 40)
        : null,
      note: str(input.quote_transfer.note, TECHNICAL_LIMITS.techText),
    };
    if (quote_transfer.create_quote) {
      warn(
        issues,
        "quote_transfer.create_quote",
        "create_quote=true ignoré à l’import technique — le devis reste une action séparée",
      );
      quote_transfer.create_quote = false;
    }
  } else {
    quote_transfer = { create_quote: false, selected_codes: null, note: null };
  }

  const media: TechnicalMediaRef[] = [];
  if (Array.isArray(input.media)) {
    input.media.forEach((m, i) => {
      if (!isObj(m)) return;
      const id = str(m.id, 60) ?? `MED-${i + 1}`;
      const originRaw = str(m.origin, 40)?.toLowerCase();
      const origin: TechnicalMediaOrigin =
        originRaw && (TECHNICAL_MEDIA_ORIGINS as readonly string[]).includes(originRaw)
          ? (originRaw as TechnicalMediaOrigin)
          : "document";
      if (origin === "illustration_demonstration") {
        info(
          issues,
          `media[${i}]`,
          `${id} : illustration de démonstration — ne pas présenter comme preuve terrain`,
        );
      }
      media.push({
        id,
        origin,
        chantier_file_id: str(m.chantier_file_id ?? m.chantierFileId, 60),
        site_visit_media_id: str(m.site_visit_media_id ?? m.siteVisitMediaId, 60),
        caption: str(m.caption, 300),
      });
    });
  }

  const controls: Array<{ id: string; text: string; step_id?: string | null }> = [];
  if (Array.isArray(input.controls)) {
    input.controls.forEach((c, i) => {
      if (!isObj(c)) return;
      const text = str(c.text, TECHNICAL_LIMITS.techText);
      if (!text) return;
      controls.push({
        id: str(c.id, 60) ?? `CTL-${i + 1}`,
        text,
        step_id: str(c.step_id ?? c.stepId, 40),
      });
    });
  }

  const warnings = strList(input.warnings, 800);
  const disclaimers = strList(input.disclaimers, 800);

  const documents = isObj(input.documents)
    ? {
        plan_refs: strList(input.documents.plan_refs ?? input.documents.planRefs, 80),
        file_refs: strList(input.documents.file_refs ?? input.documents.fileRefs, 80),
      }
    : null;

  // Cohérence workflow / schedule
  if (schedule?.tasks.length && !workflow?.steps.length) {
    warn(
      issues,
      "schedule",
      "Tâches planning sans workflow — durées / moyens peuvent manquer",
    );
  }
  if (workflow?.steps.length && schedule && !schedule.tasks.length) {
    warn(
      issues,
      "schedule.tasks",
      "Workflow présent mais aucune tâche schedule — planning non générable tant que schedule manque",
    );
  }

  const assumedLines = items.filter(
    (it) =>
      it.provenance?.classification === "ASSUMED" ||
      it.provenance?.source === "assumption" ||
      (it.assumptions?.length ?? 0) > 0,
  );
  if (assumedLines.length) {
    info(
      issues,
      "takeoff.items",
      `${assumedLines.length} poste(s) liés à des hypothèses — validation humaine requise`,
    );
  }

  const hasBlocking = issues.some((i) => i.severity === "error");
  if (hasBlocking) return { ok: false, issues };

  const bundleCore: TechnicalBundleV1 = {
    format: TECHNICAL_BUNDLE_FORMAT,
    schema_version: TECHNICAL_SCHEMA_VERSION,
    bundle_id: bundleId!,
    source_revision: sourceRevision,
    mode,
    meta,
    project,
    sources,
    facts,
    measurements,
    assumptions,
    unknowns,
    lots,
    takeoff: { parameters, items },
    workflow,
    schedule,
    planning_settings,
    quote_transfer,
    documents,
    media,
    controls,
    warnings,
    disclaimers,
  };

  const canonical = JSON.parse(JSON.stringify(bundleCore)) as Record<string, unknown>;
  const fingerprint = technicalBundleFingerprint(canonical);

  return {
    ok: true,
    bundle: { ...bundleCore, fingerprint, canonical },
    issues,
  };
}

export { workingDayToPrep, classificationToPrepProvenance };
