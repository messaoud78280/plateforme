/**
 * Adaptateur : ancien bundle de démonstration fondations (bework_foundations_demo_bundle_v1
 * et sous-bundles takeoff / workflow / resources / schedule) → bework_prep_bundle_v1.
 * Ne devine aucune donnée technique : les formules numériques restent non paramétrées.
 */
import { FormulaError, parseFormula } from "@/lib/preparation/engine/formula";
import { normalizePrepUnit } from "@/lib/preparation/units";
import {
  LEGACY_FOUNDATIONS_FORMAT,
  PREP_BUNDLE_FORMAT,
  DEMO_WATERMARK,
  type PrepIssue,
} from "@/lib/preparation/types";

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const s = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);
const n = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

export function isLegacyPrepBundle(input: Obj): boolean {
  if (input.format === PREP_BUNDLE_FORMAT || input.type === PREP_BUNDLE_FORMAT) return false;
  if (input.type === LEGACY_FOUNDATIONS_FORMAT) return true;
  return isObj(input.takeoff) && input.takeoff.type === "bework_takeoff_bundle_v1";
}

const INDICATOR_HINTS = [/indicateur/i, /non quantit[ée] retenue/i, /pas automatiquement/i];

function mapProvenance(p: string | null): "HYPOTHESE" | "RELEVE_A_VERIFIER" {
  if (p && /observ/i.test(p)) return "RELEVE_A_VERIFIER";
  return "HYPOTHESE";
}

function guessNature(text: string): string | null {
  if (/foisonn/i.test(text)) return "foisonne";
  if (/en place/i.test(text)) return "en_place";
  if (/th[ée]orique/i.test(text)) return "theorique";
  return null;
}

export function adaptLegacyFoundationsBundle(input: Obj): {
  bundle: Obj;
  issues: PrepIssue[];
  sourceFormat: string;
} {
  const issues: PrepIssue[] = [];
  const warn = (path: string, message: string) => issues.push({ path, message, severity: "warn" });
  const sourceFormat = s(input.type) ?? "bework_takeoff_bundle_v1";
  warn("$", `Ancien format « ${sourceFormat} » converti en ${PREP_BUNDLE_FORMAT}`);

  const demo = /DEMONSTRATION/i.test(String(input.status ?? "")) || sourceFormat.includes("demo");
  const src = isObj(input.source_document) ? input.source_document : {};
  const planNumber = s(src.plan_number);

  const sources = [
    {
      id: "SRC-01",
      filename: s(src.filename),
      plan_number: planNumber,
      title: s(src.title),
      revision: null,
      scale: s(src.scale_on_drawing),
      page: n(src.pdf_page),
      is_raster: typeof src.source_is_raster === "boolean" ? src.source_is_raster : null,
      legibility: null,
      note: null,
    },
  ];

  const policy = isObj(input.data_policy) ? input.data_policy : {};
  const hypotheses: Obj[] = [];
  (Array.isArray(policy.assumed) ? policy.assumed : []).forEach((a, i) => {
    const statement = s(a);
    if (statement) {
      hypotheses.push({
        id: `H-${String(i + 1).padStart(2, "0")}`,
        statement,
        reason: "Hypothèse déclarée dans le document d'analyse d'origine",
        to_confirm_with: null,
      });
    }
  });
  const observed = (Array.isArray(policy.observed) ? policy.observed : []).map(s).filter(Boolean);
  if (observed.length) {
    warn(
      "data_policy.observed",
      "Observations d'origine sans preuve de lecture structurée : conservées comme hypothèses « à vérifier »",
    );
    observed.forEach((o, i) =>
      hypotheses.push({
        id: `H-OBS-${i + 1}`,
        statement: `Observation à vérifier : ${o}`,
        reason: "Observation déclarée sans preuve de lecture",
        to_confirm_with: "Plan original",
      }),
    );
  }

  // Métré
  const takeoff = isObj(input.takeoff) ? input.takeoff : {};
  const rawItems = Array.isArray(takeoff.items) ? takeoff.items : [];
  const lotMap = new Map<string, string>();
  const lotCode = (label: string) => {
    const key = label.toLowerCase();
    if (!lotMap.has(key)) lotMap.set(key, `L${String(lotMap.size + 1).padStart(2, "0")}`);
    return lotMap.get(key)!;
  };
  const lotLabels = new Map<string, string>();
  let unparametrized = 0;

  const items = rawItems.filter(isObj).map((it, i) => {
    const id = s(it.id) ?? `X-${i + 1}`;
    const lotLabel = s(it.lot) ?? "Divers";
    const code = lotCode(lotLabel);
    lotLabels.set(code, lotLabel.charAt(0).toUpperCase() + lotLabel.slice(1));
    const unitRaw = s(it.unit) ?? "u";
    const unit = normalizePrepUnit(unitRaw).unit;
    const quantity = n(it.quantity);
    const provenance = mapProvenance(s(it.provenance));
    const rawFormula = s(it.formula);
    let formula: string | null = null;
    let justification: string | null = null;
    if (rawFormula) {
      try {
        parseFormula(rawFormula);
        formula = rawFormula;
        if (/[0-9]/.test(rawFormula.replace(/[A-Z][A-Z0-9]*-[0-9]+/g, ""))) {
          unparametrized++;
          warn(
            `takeoff.items[${i}]`,
            `${id} : formule non paramétrée (« ${rawFormula} ») — recalcul automatique impossible sur cette ligne`,
          );
        }
      } catch (e) {
        if (!(e instanceof FormulaError)) throw e;
        justification = rawFormula;
      }
    }
    const notes = s(it.notes);
    const text = `${s(it.designation) ?? ""} ${notes ?? ""}`;
    const indicator = INDICATOR_HINTS.some((re) => re.test(notes ?? ""));
    if (indicator) {
      warn(`takeoff.items[${i}]`, `${id} : classée « indicateur » d'après ses notes — à confirmer`);
    }
    const nature = guessNature(text);
    return {
      id,
      lot: code,
      designation: s(it.designation) ?? id,
      unit,
      formula,
      declared_quantity: quantity,
      provenance,
      justification,
      role: indicator ? "indicator" : "quote",
      ...(nature ? { nature } : {}),
      notes,
    };
  });
  if (unparametrized > 0) {
    warn(
      "takeoff",
      `${unparametrized} ligne(s) non paramétrée(s) : importer la version ${PREP_BUNDLE_FORMAT} pour un recalcul complet`,
    );
  }

  const checks: Obj[] = [];
  if (isObj(takeoff.totals)) {
    for (const [k, v] of Object.entries(takeoff.totals)) {
      const expected = n(v);
      if (expected !== null) checks.push({ id: `CHK-${k}`, label: k, target: null, expected });
    }
    if (checks.length) {
      warn("takeoff.totals", "Totaux d'origine conservés pour information (non rattachés à une ligne)");
    }
  }

  // Mode opératoire + planning
  const wfSteps = isObj(input.workflow) && Array.isArray(input.workflow.steps) ? input.workflow.steps : [];
  const schedTasks = isObj(input.schedule) && Array.isArray(input.schedule.tasks) ? input.schedule.tasks : [];
  const steps = wfSteps.filter(isObj).map((st, i) => {
    const name = s(st.name) ?? `Étape ${i + 1}`;
    const days = n(st.duration_work_days_demo) ?? 1;
    if (/cure/i.test(name)) {
      warn(`workflow.steps[${i}]`, `${s(st.id)} : attente de cure — conversion en jours calendaires à confirmer`);
    }
    return {
      id: s(st.id) ?? `P${String(i + 1).padStart(2, "0")}`,
      order: i + 1,
      name,
      kind: /contr[ôo]le/i.test(name) ? "control" : "work",
      description: s(st.method_notes),
      takeoff_ids: Array.isArray(st.takeoff_item_ids) ? st.takeoff_item_ids.map(s).filter(Boolean) : [],
      duration: { mode: "fixed", days, calendar: "working", provenance: "HYPOTHESE" },
    };
  });
  const byId = new Map(wfSteps.filter(isObj).map((st) => [s(st.id), st]));
  let divergent = 0;
  for (const t of schedTasks.filter(isObj)) {
    const w = byId.get(s(t.id));
    if (
      !w ||
      n(w.duration_work_days_demo) !== n(t.duration_work_days_demo) ||
      JSON.stringify(w.after ?? []) !== JSON.stringify(t.after ?? [])
    ) {
      divergent++;
    }
  }
  if (schedTasks.length) {
    warn(
      "schedule",
      divergent
        ? `Planning d'origine : ${divergent} tâche(s) divergente(s) du mode opératoire — le mode opératoire prévaut`
        : "Étapes dupliquées entre mode opératoire et planning fusionnées",
    );
  }
  const schedule = {
    start_date: isObj(input.schedule) ? s(input.schedule.start_date) : null,
    calendar: { working_days: [1, 2, 3, 4, 5], holidays: "FR_METROPOLE", granularity_days: 0.5 },
    tasks: wfSteps.filter(isObj).map((st) => ({
      step_id: s(st.id),
      depends_on: (Array.isArray(st.after) ? st.after : [])
        .map(s)
        .filter(Boolean)
        .map((id) => ({ step_id: id, type: "FS" })),
    })),
  };

  // Ressources
  const res = isObj(input.resources) ? input.resources : {};
  const demoAssumptions = isObj(res.demo_assumptions) ? res.demo_assumptions : {};
  const rates: Obj[] = [];
  const notes: string[] = [];
  for (const [k, v] of Object.entries(demoAssumptions)) {
    const value = n(v);
    if (value !== null && /per_workday/.test(k)) {
      const unit = /kg/.test(k) ? "kg/j" : /m2/.test(k) ? "m2/j" : "m3/j";
      rates.push({
        id: `R-${String(rates.length + 1).padStart(2, "0")}`,
        label: k,
        value,
        unit,
        per: "equipe",
        provenance: "HYPOTHESE",
      });
    } else if (typeof v === "string") {
      notes.push(`${k} : ${v}`);
    }
  }

  const decisions: Obj[] = [];
  (Array.isArray(input.open_decisions) ? input.open_decisions : []).forEach((d, i) => {
    const q = s(d);
    if (q) decisions.push({ id: `D-${String(i + 1).padStart(2, "0")}`, question: q, affects: [], blocking_for: ["validation"] });
  });
  (Array.isArray(res.technical_checks) ? res.technical_checks : []).forEach((d, i) => {
    const q = s(d);
    if (q) decisions.push({ id: `D-TC-${i + 1}`, question: q, affects: [], blocking_for: ["execution"] });
  });

  const disclaimers = demo ? [DEMO_WATERMARK] : [];
  const note = s(policy.note);
  if (note) disclaimers.push(note);

  const title = [s(src.title), planNumber].filter(Boolean).join(" — ") || "Étude importée";

  const bundle: Obj = {
    format: PREP_BUNDLE_FORMAT,
    schema_version: "1.0",
    bundle_id: `legacy-${(planNumber ?? "import").toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    mode: demo ? "demonstration" : "professional",
    study: {
      title: demo ? `${title} (démonstration — ancien format)` : title,
      trade: /foundation/i.test(sourceFormat) ? "fondations" : null,
      description: notes.length ? notes.join(" · ") : null,
    },
    sources,
    parameters: [],
    hypotheses,
    elements: [],
    takeoff: {
      lots: [...lotLabels].map(([code, label]) => ({ code, label })),
      items,
    },
    checks,
    resources: {
      labor: [],
      equipment: [],
      supplies: [],
      rates,
    },
    workflow: { steps },
    schedule,
    decisions,
    variants: [],
    disclaimers,
  };
  return { bundle, issues, sourceFormat };
}
