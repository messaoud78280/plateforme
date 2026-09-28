/**
 * Normalise bework_technical_bundle_v1 → forme consommable par le moteur Prep existant.
 * Ne crée ni devis ni planning civil.
 */
import { LINE_CODE_RE, PARAM_KEY_RE } from "@/lib/preparation/engine/formula";
import {
  parsePrepBundle,
  type NormalizedPrepBundle,
} from "@/lib/preparation/bundle/parse";
import { PREP_BUNDLE_FORMAT, type ImportProvenance, type LineRole } from "@/lib/preparation/types";
import { normalizeCivilStartDate } from "@/lib/preparation/schedule/calendar";
import {
  classificationToPrepProvenance,
  workingDayToPrep,
  type NormalizedTechnicalBundle,
} from "@/lib/technical-engine/parse";
import type { TechnicalProvenance } from "@/lib/technical-engine/schema";
import { TECHNICAL_BUNDLE_FORMAT } from "@/lib/technical-engine/schema";

function provenanceToImport(
  p: TechnicalProvenance | undefined,
): ImportProvenance | null {
  if (!p) return null;
  const fromClass = classificationToPrepProvenance(p.classification ?? null);
  if (fromClass === "RELEVE" || fromClass === "RELEVE_A_VERIFIER" || fromClass === "HYPOTHESE") {
    return fromClass;
  }
  if (p.source === "assumption") return "HYPOTHESE";
  if (p.source === "calculation") return "RELEVE_A_VERIFIER";
  if (p.confidence === "confirmed" && (p.source === "plan" || p.source === "field_measurement")) {
    return "RELEVE";
  }
  if (p.confidence === "to_confirm" || p.confidence === "indicative") {
    return "RELEVE_A_VERIFIER";
  }
  return "HYPOTHESE";
}

export function sanitizeParamKey(raw: string, index: number): string {
  let k = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_.]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^\.+|\.+$/g, "");
  if (!PARAM_KEY_RE.test(k)) {
    k = k.replace(/\./g, "_").replace(/[^a-z0-9_]/g, "");
    if (!/^[a-z]/.test(k)) k = `p_${k || index + 1}`;
  }
  return PARAM_KEY_RE.test(k) ? k : `param_${index + 1}`;
}

export function sanitizeLineCode(raw: string, index: number): string {
  const t = raw.trim().toUpperCase();
  if (LINE_CODE_RE.test(t)) return t;
  const m = t.match(/^([A-Z][A-Z0-9]*)[-_ ]?(\d{1,4})$/);
  if (m) {
    const code = `${m[1]}-${m[2]}`;
    if (LINE_CODE_RE.test(code)) return code;
  }
  const letters = t.replace(/[^A-Z]/g, "").slice(0, 4) || "GEN";
  return `${letters}-${String(index + 1).padStart(2, "0")}`;
}

/**
 * Produit un objet JSON bework_prep_bundle_v1 (pour parsePrepBundle / commit existant).
 */
export function technicalToPrepBundleJson(
  tech: NormalizedTechnicalBundle,
): Record<string, unknown> {
  const startDate = normalizeCivilStartDate(tech.planning_settings?.start_date);
  const workingDays = (tech.planning_settings?.working_days ?? []).map(workingDayToPrep);
  const calendar =
    tech.planning_settings?.calendar === "FR" || !tech.planning_settings?.calendar
      ? "FR_METROPOLE"
      : tech.planning_settings.calendar;

  const sources = tech.sources.map((s) => ({
    id: s.id,
    filename: s.filename,
    plan_number: s.plan_number,
    title: s.label,
    revision: s.revision,
    date: s.date,
    page: s.page,
    note: [s.note, `type=${s.type}`].filter(Boolean).join(" — "),
    chantier_file_id: s.chantier_file_id,
  }));

  const hypotheses = (tech.assumptions ?? []).map((a) => ({
    id: a.id,
    statement: a.text,
    reason: a.impact ?? null,
    to_confirm_with: null,
  }));

  const decisions = [
    ...(tech.unknowns ?? []).map((u) => ({
      id: u.id,
      question: u.text,
      affects: [],
      blocking_for: u.blocks ?? [],
    })),
    ...(tech.controls ?? []).map((c) => ({
      id: c.id,
      question: c.text,
      affects: c.step_id ? [c.step_id] : [],
      blocking_for: [],
    })),
  ];

  const parameters = tech.takeoff.parameters.map((p, i) => ({
    key: sanitizeParamKey(p.key, i),
    label: p.label,
    unit: p.unit,
    value: p.formula ? undefined : p.value,
    formula: p.formula ?? undefined,
    provenance: provenanceToImport(p.provenance) ?? undefined,
    source_ref: p.provenance?.source_ref ?? undefined,
    hypothesis_id: p.hypothesis_id ?? undefined,
    note: p.note ?? undefined,
    sort_order: i,
  }));

  const lots =
    tech.lots && tech.lots.length
      ? tech.lots
      : [
          ...new Map(
            tech.takeoff.items.map((it) => [it.lot, { code: it.lot, label: it.lot }]),
          ).values(),
        ];

  const items = tech.takeoff.items.map((it, i) => {
    const prov = provenanceToImport(it.provenance);
    const notes = [
      it.location ? `Localisation : ${it.location}` : null,
      ...(it.to_confirm ?? []).map((t) => `À confirmer : ${t}`),
      ...(it.assumptions ?? []).map((a) => `Hypothèse : ${a}`),
      ...(it.warnings ?? []),
      it.quantities
        ? `Quantités multi-rôles : ${JSON.stringify(it.quantities)}`
        : null,
      it.code !== sanitizeLineCode(it.code, i)
        ? `Code d'origine : ${it.code}`
        : null,
    ]
      .filter(Boolean)
      .join("\n");

    return {
      id: sanitizeLineCode(it.code, i),
      code: sanitizeLineCode(it.code, i),
      lot: it.lot,
      sub_lot: it.sub_lot,
      designation: it.designation,
      technical_description: it.description,
      unit: it.unit,
      formula: it.formula ?? undefined,
      declared_quantity: it.formula ? undefined : it.quantity,
      provenance: it.formula ? undefined : prov ?? undefined,
      role: (it.role ?? "quote") as LineRole,
      notes: notes || undefined,
      sort_order: i,
    };
  });

  const workflowSteps = (tech.workflow?.steps ?? []).map((st) => {
    const hasDuration =
      st.duration &&
      typeof st.duration === "object" &&
      !Array.isArray(st.duration);
    const duration = hasDuration
      ? st.duration
      : { mode: "fixed", days: 0, calendar: "working", provenance: "ABSENT" };
    return {
      id: st.id,
      order: st.order,
      name: st.name,
      lot: st.lot,
      kind: st.kind ?? "work",
      description: [
        st.description,
        !hasDuration ? "Durée absente dans le bundle — à confirmer (0 j provisoire)" : null,
      ]
        .filter(Boolean)
        .join("\n"),
      takeoff_ids: (st.takeoff_ids ?? []).map((c, j) => sanitizeLineCode(c, j)),
      duration,
      crew: Array.isArray(st.crew)
        ? st.crew.map((c) =>
            typeof c === "string" ? { labor_id: c, count: 1 } : c,
          )
        : [],
      crew_id: st.crew_id ?? null,
      crew_size: st.crew_size ?? null,
      workload_person_days: st.workload_person_days ?? null,
      parallelizable: st.parallelizable === true,
      equipment: Array.isArray(st.equipment)
        ? st.equipment.map((e) =>
            typeof e === "string" ? { equipment_id: e, count: 1 } : e,
          )
        : [],
      supplies: [],
      preconditions: st.prerequisites ?? [],
      controls_before_next: st.controls ?? [],
      constraints: [],
      safety: [],
      proofs: [],
    };
  });

  const scheduleTasks = (tech.schedule?.tasks ?? []).map((t) => ({
    step_id: t.step_id,
    depends_on: (t.depends_on ?? []).map((d) => ({
      step_id: d.step_id,
      type: d.type ?? "FS",
      lag_days: d.lag_days ?? 0,
    })),
    include_in_base: t.include_in_base !== false,
    crew_id: t.crew_id ?? null,
    parallelizable: t.parallelizable === true,
  }));

  const disclaimers = [
    ...(tech.disclaimers ?? []),
    ...(tech.warnings ?? []),
    tech.planning_settings?.desired_start_period && !startDate
      ? `Période de démarrage souhaitée : ${tech.planning_settings.desired_start_period} — date civile à définir`
      : null,
    !startDate && scheduleTasks.length
      ? "Date de démarrage à définir — planning relatif uniquement"
      : null,
  ].filter((x): x is string => !!x);

  return {
    format: PREP_BUNDLE_FORMAT,
    schema_version: "1.0",
    bundle_id: tech.bundle_id,
    mode: tech.mode === "demonstration" ? "demonstration" : "professional",
    study: {
      title: tech.meta.title,
      trade: tech.project.trade_hints?.[0] ?? null,
      description: [
        tech.project.address ? `Adresse : ${tech.project.address}` : null,
        tech.project.client_name ? `Client : ${tech.project.client_name}` : null,
        `Import technique ${TECHNICAL_BUNDLE_FORMAT}`,
        tech.source_revision != null ? `source_revision=${tech.source_revision}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
    },
    sources,
    parameters,
    hypotheses,
    elements: [],
    takeoff: { lots, items },
    checks: [],
    resources: { labor: [], equipment: [], supplies: [], rates: [] },
    workflow: workflowSteps.length ? { steps: workflowSteps } : null,
    schedule: scheduleTasks.length
      ? {
          start_date: startDate,
          start_date_provenance: startDate
            ? tech.planning_settings?.start_date_confidence ?? null
            : null,
          calendar: {
            working_days: workingDays.length ? workingDays : [1, 2, 3, 4, 5],
            holidays: calendar,
            granularity_days: 0.5,
          },
          tasks: scheduleTasks,
          note: tech.schedule?.note ?? null,
        }
      : null,
    decisions,
    variants: [],
    disclaimers,
  };
}

/**
 * Passe par parsePrepBundle pour obtenir NormalizedPrepBundle + issues prep.
 */
export function technicalToNormalizedPrep(tech: NormalizedTechnicalBundle): {
  prepJson: Record<string, unknown>;
  prep: NormalizedPrepBundle | null;
  prepIssues: import("@/lib/preparation/types").PrepIssue[];
} {
  const prepJson = technicalToPrepBundleJson(tech);
  const result = parsePrepBundle(prepJson);
  if (!result.ok) {
    return { prepJson, prep: null, prepIssues: result.issues };
  }
  return {
    prepJson,
    prep: {
      ...result.bundle,
      sourceFormat: TECHNICAL_BUNDLE_FORMAT,
      adapted: false,
    },
    prepIssues: result.issues,
  };
}
