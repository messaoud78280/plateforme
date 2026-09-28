/**
 * Adapter bework_prep_bundle_v1 → bework_technical_bundle_v1.
 * Le chemin d’import prep legacy reste actif en parallèle.
 */
import { PREP_BUNDLE_FORMAT } from "@/lib/preparation/types";
import {
  TECHNICAL_BUNDLE_FORMAT,
  TECHNICAL_SCHEMA_VERSION,
  DEFAULT_PLANNING_WORKING_DAYS,
  type TechnicalBundleV1,
  type TechnicalWorkingDay,
} from "@/lib/technical-engine/schema";

type Obj = Record<string, unknown>;

const isObj = (v: unknown): v is Obj =>
  typeof v === "object" && v !== null && !Array.isArray(v);

function str(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t || null;
}

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

const PREP_DAY_TO_TECH: TechnicalWorkingDay[] = [
  "MON",
  "TUE",
  "WED",
  "THU",
  "FRI",
  "SAT",
  "SUN",
];

/**
 * Convertit un objet prep (ou résultat parse) en enveloppe technical.
 * Ne valide pas le contenu métier — à passer ensuite par parseTechnicalBundle.
 */
export function adaptPrepBundleToTechnical(input: unknown): TechnicalBundleV1 {
  if (!isObj(input)) {
    throw new Error("Bundle prep invalide");
  }
  const format = str(input.format ?? input.type);
  if (format !== PREP_BUNDLE_FORMAT && format !== "bework_foundations_demo_bundle_v1") {
    // Accepte aussi un objet déjà proche si format absent mais study+takeoff présents
    if (!(isObj(input.study) && isObj(input.takeoff))) {
      throw new Error(`Format prep attendu, reçu : ${format ?? "absent"}`);
    }
  }

  const study = isObj(input.study) ? input.study : {};
  const takeoff = isObj(input.takeoff) ? input.takeoff : {};
  const schedule = isObj(input.schedule) ? input.schedule : null;
  const workflow = isObj(input.workflow) ? input.workflow : null;

  const sources = Array.isArray(input.sources)
    ? input.sources.filter(isObj).map((s, i) => ({
        id: str(s.id) ?? `SRC-${i + 1}`,
        type: "plan" as const,
        label: str(s.title) ?? str(s.filename) ?? `Source ${i + 1}`,
        filename: str(s.filename),
        plan_number: str(s.plan_number),
        revision: str(s.revision),
        date: str(s.date),
        page: num(s.page),
        chantier_file_id: str(s.chantier_file_id ?? s.chantierFileId),
        note: str(s.note),
      }))
    : [];

  const parameters = Array.isArray(input.parameters)
    ? input.parameters.filter(isObj).map((p) => ({
        key: str(p.key) ?? "param",
        label: str(p.label) ?? str(p.key) ?? "Paramètre",
        unit: str(p.unit) ?? "u",
        value: num(p.value),
        formula: str(p.formula),
        provenance: {
          source:
            str(p.provenance) === "HYPOTHESE"
              ? ("assumption" as const)
              : str(p.provenance) === "RELEVE"
                ? ("plan" as const)
                : ("user_input" as const),
          source_ref: str(p.source_ref),
          confidence:
            str(p.provenance) === "RELEVE"
              ? ("confirmed" as const)
              : ("to_confirm" as const),
          classification:
            str(p.provenance) === "HYPOTHESE"
              ? ("ASSUMED" as const)
              : str(p.provenance) === "RELEVE"
                ? ("MEASURED" as const)
                : ("TO_CONFIRM" as const),
        },
        hypothesis_id: str(p.hypothesis_id),
        note: str(p.note),
      }))
    : [];

  const items = Array.isArray(takeoff.items)
    ? takeoff.items.filter(isObj).map((it) => {
        const prov = str(it.provenance);
        const role: "quote" | "indicator" | "logistics" =
          it.role === "indicator" || it.role === "logistics" || it.role === "quote"
            ? it.role
            : "quote";
        return {
          code: str(it.id) ?? str(it.code) ?? "GEN-01",
          lot: str(it.lot) ?? "GEN",
          sub_lot: str(it.sub_lot),
          designation: str(it.designation) ?? "Poste",
          description: str(it.technical_description ?? it.description),
          unit: str(it.unit) ?? "u",
          formula: str(it.formula),
          quantity: num(it.declared_quantity ?? it.quantity),
          role,
          provenance: {
            source:
              (prov === "HYPOTHESE"
                ? "assumption"
                : "plan") as "assumption" | "plan",
            confidence:
              (prov === "RELEVE" ? "confirmed" : "to_confirm") as
                | "confirmed"
                | "to_confirm",
            classification:
              (prov === "HYPOTHESE"
                ? "ASSUMED"
                : str(it.formula)
                  ? "CALCULATED"
                  : "TO_CONFIRM") as "ASSUMED" | "CALCULATED" | "TO_CONFIRM",
          },
          warnings: [] as string[],
        };
      })
    : [];

  const lots = Array.isArray(takeoff.lots)
    ? takeoff.lots.filter(isObj).map((l) => ({
        code: str(l.code) ?? "GEN",
        label: str(l.label) ?? str(l.code) ?? "Lot",
      }))
    : [];

  const assumptions = Array.isArray(input.hypotheses)
    ? input.hypotheses.filter(isObj).map((h, i) => ({
        id: str(h.id) ?? `H-${i + 1}`,
        text: str(h.statement) ?? str(h.text) ?? "Hypothèse",
        impact: str(h.reason),
        status: "open" as const,
      }))
    : [];

  const workflowSteps = workflow && Array.isArray(workflow.steps)
    ? workflow.steps.filter(isObj).map((st, i) => {
        const kind: "work" | "control" | "wait" =
          st.kind === "control" || st.kind === "wait" || st.kind === "work"
            ? st.kind
            : "work";
        return {
          id: str(st.id) ?? `P${String(i + 1).padStart(2, "0")}`,
          order: num(st.order) ?? i + 1,
          name: str(st.name) ?? `Étape ${i + 1}`,
          lot: str(st.lot),
          kind,
          description: str(st.description),
          takeoff_ids: Array.isArray(st.takeoff_ids)
            ? st.takeoff_ids.filter((x): x is string => typeof x === "string")
            : [],
          prerequisites: Array.isArray(st.preconditions)
            ? st.preconditions.filter((x): x is string => typeof x === "string")
            : [],
          controls: Array.isArray(st.controls_before_next)
            ? st.controls_before_next.filter((x): x is string => typeof x === "string")
            : [],
          duration: st.duration,
        };
      })
    : [];

  const scheduleTasks =
    schedule && Array.isArray(schedule.tasks)
      ? schedule.tasks
          .filter(isObj)
          .map((t) => {
            const depends_on = Array.isArray(t.depends_on)
              ? t.depends_on.filter(isObj).map((d) => {
                  const type: "FS" | "SS" | "FF" =
                    d.type === "SS" || d.type === "FF" || d.type === "FS"
                      ? d.type
                      : "FS";
                  return {
                    step_id: str(d.step_id) ?? "",
                    type,
                    lag_days: num(d.lag_days) ?? 0,
                  };
                })
              : [];
            return {
              step_id: str(t.step_id) ?? "",
              depends_on,
              include_in_base: t.include_in_base !== false,
            };
          })
          .filter((t) => t.step_id)
      : [];

  let workingDays = [...DEFAULT_PLANNING_WORKING_DAYS];
  if (schedule && isObj(schedule.calendar) && Array.isArray(schedule.calendar.working_days)) {
    workingDays = schedule.calendar.working_days
      .map((d) => (typeof d === "number" && d >= 1 && d <= 7 ? PREP_DAY_TO_TECH[d - 1] : null))
      .filter((x): x is TechnicalWorkingDay => !!x);
    if (!workingDays.length) workingDays = [...DEFAULT_PLANNING_WORKING_DAYS];
  }

  const startRaw = schedule ? str(schedule.start_date) : null;

  return {
    format: TECHNICAL_BUNDLE_FORMAT,
    schema_version: TECHNICAL_SCHEMA_VERSION,
    bundle_id: str(input.bundle_id) ?? `adapted-prep-${Date.now()}`,
    source_revision: 1,
    mode: input.mode === "demonstration" ? "demonstration" : "professional",
    meta: {
      language: "fr",
      generator: "adapt-prep-bundle-v1",
      title: str(study.title) ?? "Étude adaptée",
    },
    project: {
      title: str(study.title) ?? "Projet",
      trade_hints: str(study.trade) ? [str(study.trade)!] : [],
    },
    sources,
    assumptions,
    unknowns: [],
    lots,
    takeoff: { parameters, items },
    workflow: workflowSteps.length ? { steps: workflowSteps } : null,
    schedule: scheduleTasks.length
      ? { tasks: scheduleTasks, note: schedule ? str(schedule.note) : null }
      : null,
    planning_settings: {
      start_date: startRaw && startRaw > "1970-01-01" ? startRaw : null,
      desired_start_period: null,
      working_days: workingDays,
      calendar: "FR",
    },
    quote_transfer: { create_quote: false },
    warnings: [
      "Adapté depuis bework_prep_bundle_v1 — vérifier classifications et start_date",
    ],
    disclaimers: Array.isArray(input.disclaimers)
      ? input.disclaimers.filter((x): x is string => typeof x === "string")
      : [],
  };
}

/** Détecte si un JSON collé est un prep bundle (pour router l’UI). */
export function isPrepBundleShape(input: unknown): boolean {
  if (!isObj(input)) return false;
  const f = str(input.format ?? input.type);
  return (
    f === PREP_BUNDLE_FORMAT ||
    f === "bework_foundations_demo_bundle_v1" ||
    (isObj(input.study) && isObj(input.takeoff) && Array.isArray(input.parameters))
  );
}
