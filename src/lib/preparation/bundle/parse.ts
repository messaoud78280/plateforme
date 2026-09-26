/**
 * Validation et normalisation d'un JSON bework_prep_bundle_v1 (ou ancien format adapté).
 * Fonction pure : aucune écriture, aucun accès réseau.
 */
import { adaptLegacyFoundationsBundle, isLegacyPrepBundle } from "@/lib/preparation/bundle/adapt-legacy";
import { computeStudy, quantitiesDiffer } from "@/lib/preparation/engine/compute";
import { LINE_CODE_RE, PARAM_KEY_RE } from "@/lib/preparation/engine/formula";
import { normalizePrepUnit } from "@/lib/preparation/units";
import {
  DEMO_WATERMARK,
  IMPORT_PROVENANCES,
  LINE_NATURES,
  LINE_ROLES,
  PREP_BUNDLE_FORMAT,
  type ImportProvenance,
  type LineNature,
  type LineRole,
  type PrepCheck,
  type PrepDecision,
  type PrepElement,
  type PrepHypothesis,
  type PrepIssue,
  type PrepLot,
  type PrepSource,
  type PrepTechnicalReference,
  type StoredProvenance,
  type StudyMode,
  type TechRefKind,
  TECH_REF_KINDS,
} from "@/lib/preparation/types";

export const PREP_LIMITS = {
  rawBytes: 2_000_000,
  parameters: 2000,
  lines: 5000,
  text: 4000,
  /** Descriptions techniques développées (CCTP / fiche poste). */
  techText: 8000,
};

export type BundleParam = {
  key: string;
  label: string;
  unit: string;
  value: number | null;
  formula: string | null;
  provenance: StoredProvenance | null;
  sourceRef: string | null;
  evidence: { kind?: string; location?: string; quote?: string } | null;
  hypothesisId: string | null;
  note: string | null;
  sortOrder: number;
};

export type BundleLine = {
  code: string;
  lot: string;
  subLot: string | null;
  designation: string;
  description: string | null;
  includedServices: string[];
  technicalReferences: PrepTechnicalReference[];
  executionNotes: string | null;
  qualityControls: string[];
  technicalReservations: string[];
  unit: string;
  elementIds: string[];
  formula: string | null;
  declaredQuantity: number | null;
  provenance: StoredProvenance | null;
  literalProvenance: StoredProvenance | null;
  justification: string | null;
  role: LineRole;
  nature: LineNature | null;
  dependsOnDecisions: string[];
  notes: string | null;
  sortOrder: number;
};

export type NormalizedPrepBundle = {
  sourceFormat: string;
  adapted: boolean;
  bundleId: string | null;
  schemaVersion: string | null;
  mode: StudyMode;
  study: { title: string; trade: string | null; description: string | null };
  sources: PrepSource[];
  parameters: BundleParam[];
  hypotheses: PrepHypothesis[];
  elements: PrepElement[];
  lots: PrepLot[];
  lines: BundleLine[];
  checks: PrepCheck[];
  decisions: PrepDecision[];
  resources: Record<string, unknown> | null;
  workflow: Record<string, unknown> | null;
  schedule: Record<string, unknown> | null;
  variants: Record<string, unknown>[];
  disclaimers: string[];
};

export type PrepParseResult =
  | { ok: true; bundle: NormalizedPrepBundle; issues: PrepIssue[]; canonical: Record<string, unknown> }
  | { ok: false; issues: PrepIssue[] };

type Obj = Record<string, unknown>;

const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);

function str(v: unknown, max = PREP_LIMITS.text): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t.slice(0, max) : null;
}

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function strList(v: unknown, max = 200): string[] {
  return Array.isArray(v) ? v.map((x) => str(x, max)).filter((x): x is string => !!x) : [];
}

function readStringList(v: unknown, maxItem = 500): string[] {
  if (typeof v === "string") {
    const t = v.trim();
    if (!t) return [];
    return t
      .split(/\n|;/)
      .map((x) => x.replace(/^[-•*]\s*/, "").trim())
      .filter(Boolean)
      .map((x) => x.slice(0, maxItem));
  }
  return strList(v, maxItem);
}

function readTechnicalReferences(v: unknown, path: string, warn: (p: string, m: string) => void): PrepTechnicalReference[] {
  if (!Array.isArray(v)) {
    if (v !== undefined && v !== null) warn(path, "technical_references doit être un tableau — ignoré");
    return [];
  }
  const out: PrepTechnicalReference[] = [];
  v.forEach((item, i) => {
    if (typeof item === "string") {
      const label = str(item, 200);
      if (label) out.push({ label, kind: "INDICATIVE", note: null });
      return;
    }
    if (!isObj(item)) {
      warn(`${path}[${i}]`, "référence technique invalide ignorée");
      return;
    }
    const label = str(item.label ?? item.name ?? item.ref, 200);
    if (!label) {
      warn(`${path}[${i}]`, "référence sans libellé ignorée");
      return;
    }
    let kind: TechRefKind = "INDICATIVE";
    const rawKind = str(item.kind ?? item.type, 40)?.toUpperCase().replace(/-/g, "_");
    if (rawKind && (TECH_REF_KINDS as string[]).includes(rawKind)) kind = rawKind as TechRefKind;
    else if (rawKind === "PRESCRIPTION" || rawKind === "EXECUTION") kind = "DOSSIER";
    else if (rawKind === "VERIFY" || rawKind === "A_VERIFIER") kind = "TO_VERIFY";
    else if (item.kind !== undefined && item.kind !== null) {
      warn(`${path}[${i}].kind`, `nature « ${String(item.kind)} » inconnue — indicative par défaut`);
    }
    out.push({
      label,
      kind,
      note: str(item.note ?? item.comment, PREP_LIMITS.techText),
    });
  });
  return out;
}

const ROOT_KEYS = new Set([
  "format",
  "type",
  "schema_version",
  "bundle_id",
  "mode",
  "study",
  "sources",
  "parameters",
  "hypotheses",
  "elements",
  "takeoff",
  "checks",
  "resources",
  "workflow",
  "schedule",
  "decisions",
  "variants",
  "disclaimers",
]);

/** Analyse le texte brut (JSON) collé ou téléversé. */
export function parsePrepJsonText(raw: string): PrepParseResult {
  if (typeof raw !== "string" || !raw.trim()) {
    return { ok: false, issues: [{ path: "$", message: "Aucun contenu JSON fourni", severity: "error" }] };
  }
  if (raw.length > PREP_LIMITS.rawBytes) {
    return {
      ok: false,
      issues: [{ path: "$", message: "Fichier trop volumineux (2 Mo maximum)", severity: "error" }],
    };
  }
  let data: unknown;
  try {
    data = JSON.parse(raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, ""));
  } catch (e) {
    return {
      ok: false,
      issues: [
        {
          path: "$",
          message: `JSON invalide : ${e instanceof Error ? e.message : "structure illisible"}`,
          severity: "error",
        },
      ],
    };
  }
  return parsePrepBundle(data);
}

export function parsePrepBundle(input: unknown): PrepParseResult {
  const issues: PrepIssue[] = [];
  const err = (path: string, message: string) => issues.push({ path, message, severity: "error" });
  const warn = (path: string, message: string) => issues.push({ path, message, severity: "warn" });

  if (!isObj(input)) {
    return { ok: false, issues: [{ path: "$", message: "Le JSON doit être un objet", severity: "error" }] };
  }

  let root: Obj = input;
  let sourceFormat = String(input.format ?? input.type ?? "");
  let adapted = false;
  if (isLegacyPrepBundle(input)) {
    const res = adaptLegacyFoundationsBundle(input);
    root = res.bundle;
    issues.push(...res.issues);
    sourceFormat = res.sourceFormat;
    adapted = true;
  }

  const format = root.format ?? root.type;
  if (format !== PREP_BUNDLE_FORMAT) {
    const known =
      typeof format === "string" && format.startsWith("bework_quote_")
        ? " Ce format relève de l'import de devis (Devis & Facturation)."
        : "";
    return {
      ok: false,
      issues: [
        {
          path: "format",
          message: `Format non reconnu : « ${String(format ?? "absent")} ». Attendu : ${PREP_BUNDLE_FORMAT}.${known}`,
          severity: "error",
        },
      ],
    };
  }
  if (!adapted) sourceFormat = PREP_BUNDLE_FORMAT;

  for (const k of Object.keys(root)) {
    if (!ROOT_KEYS.has(k)) warn(k, `Champ inconnu « ${k} » ignoré par les calculs`);
  }

  const schemaVersion = str(root.schema_version, 20);
  if (!schemaVersion) warn("schema_version", "Version de schéma absente (1.0 supposée)");

  const bundleId = str(root.bundle_id, 80);
  if (!bundleId) warn("bundle_id", "Identifiant de bundle absent");

  let mode: StudyMode = "PROFESSIONAL";
  if (root.mode === "demonstration") mode = "DEMONSTRATION";
  else if (root.mode !== "professional") {
    warn("mode", "Mode absent ou inconnu : dossier professionnel à valider par défaut");
  }

  const studyRaw = isObj(root.study) ? root.study : {};
  const title = str(studyRaw.title, 200);
  if (!title) err("study.title", "Titre de l'étude obligatoire");
  const study = {
    title: title ?? "Étude sans titre",
    trade: str(studyRaw.trade, 80),
    description: str(studyRaw.description),
  };

  // Sources
  const sources: PrepSource[] = [];
  if (!Array.isArray(root.sources) || root.sources.length === 0) {
    warn("sources", "Aucune source documentaire déclarée");
  } else {
    root.sources.forEach((s, i) => {
      if (!isObj(s)) return;
      const id = str(s.id, 60) ?? `SRC-${i + 1}`;
      const revision = str(s.revision, 40);
      sources.push({
        id,
        filename: str(s.filename, 200),
        planNumber: str(s.plan_number, 60),
        title: str(s.title, 200),
        revision,
        scale: str(s.scale, 40),
        page: num(s.page),
        isRaster: typeof s.is_raster === "boolean" ? s.is_raster : null,
        legibility: str(s.legibility, 40),
        note: str(s.note),
        chantierFileId:
          str(s.chantier_file_id, 60) ?? str(s.chantierFileId, 60) ?? null,
      });
      if (!revision) warn(`sources[${i}].revision`, `${id} : indice de révision non identifié — à vérifier`);
    });
  }
  const sourceIds = new Set(sources.map((s) => s.id));

  // Hypothèses
  const hypotheses: PrepHypothesis[] = [];
  if (Array.isArray(root.hypotheses)) {
    root.hypotheses.forEach((h, i) => {
      if (!isObj(h)) return;
      const id = str(h.id, 40);
      const statement = str(h.statement);
      if (!id || !statement) {
        warn(`hypotheses[${i}]`, "Hypothèse sans identifiant ou sans énoncé ignorée");
        return;
      }
      hypotheses.push({
        id,
        statement,
        reason: str(h.reason),
        toConfirmWith: str(h.to_confirm_with),
      });
    });
  }
  const hypothesisIds = new Set(hypotheses.map((h) => h.id));

  // Paramètres
  const parameters: BundleParam[] = [];
  const paramKeys = new Set<string>();
  const rawParams = Array.isArray(root.parameters) ? root.parameters : [];
  if (!Array.isArray(root.parameters)) warn("parameters", "Aucun paramètre déclaré");
  if (rawParams.length > PREP_LIMITS.parameters) {
    err("parameters", `Trop de paramètres (maximum ${PREP_LIMITS.parameters})`);
  }
  rawParams.slice(0, PREP_LIMITS.parameters).forEach((p, i) => {
    const path = `parameters[${i}]`;
    if (!isObj(p)) {
      err(path, "Paramètre invalide");
      return;
    }
    const key = str(p.key, 120);
    if (!key || !PARAM_KEY_RE.test(key)) {
      err(path, `Clé de paramètre invalide : « ${String(p.key ?? "")} » (minuscules, points, chiffres, _)`);
      return;
    }
    if (paramKeys.has(key)) {
      err(path, `Paramètre en double : ${key}`);
      return;
    }
    paramKeys.add(key);
    const hasValue = p.value !== undefined && p.value !== null;
    const formula = str(p.formula, 500);
    if (hasValue && formula) err(path, `${key} : « value » et « formula » ne peuvent pas coexister`);
    if (!hasValue && !formula) err(path, `${key} : ni valeur ni formule`);
    const value = hasValue ? num(p.value) : null;
    if (hasValue && value === null) err(path, `${key} : la valeur doit être un nombre (point décimal)`);

    const unitRaw = str(p.unit, 20);
    if (!unitRaw) warn(path, `${key} : unité absente`);
    const unit = unitRaw ? normalizePrepUnit(unitRaw).unit : "";

    let provenance: StoredProvenance | null = null;
    let evidence: BundleParam["evidence"] = null;
    const sourceRef = str(p.source_ref, 60);
    if (!formula) {
      provenance = readImportProvenance(p.provenance, `${path}.provenance`, key, warn);
      if (isObj(p.evidence)) {
        evidence = {
          kind: str(p.evidence.kind, 40) ?? undefined,
          location: str(p.evidence.location, 300) ?? undefined,
          quote: str(p.evidence.quote, 300) ?? undefined,
        };
      }
      if (sourceRef && !sourceIds.has(sourceRef)) {
        warn(`${path}.source_ref`, `${key} : source inconnue ${sourceRef}`);
      }
      if (provenance === "RELEVE") {
        const proven = !!sourceRef && sourceIds.has(sourceRef) && !!evidence?.location && !!evidence?.quote;
        if (!proven) {
          provenance = "RELEVE_A_VERIFIER";
          warn(
            path,
            `${key} : « relevé » sans preuve de lecture complète (source, emplacement, texte lu) — classé « relevé à vérifier »`,
          );
        }
      }
    } else if (p.provenance !== undefined) {
      warn(`${path}.provenance`, `${key} : provenance ignorée sur un paramètre calculé`);
    }
    const hypothesisId = str(p.hypothesis_id, 40);
    if (hypothesisId && !hypothesisIds.has(hypothesisId)) {
      warn(`${path}.hypothesis_id`, `${key} : hypothèse ${hypothesisId} non déclarée`);
    }
    parameters.push({
      key,
      label: str(p.label, 200) ?? key,
      unit,
      value: formula ? null : value,
      formula,
      provenance,
      sourceRef,
      evidence,
      hypothesisId,
      note: str(p.note),
      sortOrder: i,
    });
  });

  // Éléments
  const elements: PrepElement[] = [];
  if (Array.isArray(root.elements)) {
    root.elements.forEach((e, i) => {
      if (!isObj(e)) return;
      const id = str(e.id, 60);
      if (!id) {
        warn(`elements[${i}]`, "Élément sans identifiant ignoré");
        return;
      }
      elements.push({
        id,
        code: str(e.code, 40) ?? id,
        kind: str(e.kind, 60),
        label: str(e.label, 200) ?? id,
        parameterPrefix: str(e.parameter_prefix, 60),
        sourceRef: str(e.source_ref, 60),
      });
    });
  }
  const elementIds = new Set(elements.map((e) => e.id));

  // Décisions
  const decisions: PrepDecision[] = [];
  if (Array.isArray(root.decisions)) {
    root.decisions.forEach((d, i) => {
      if (!isObj(d)) return;
      const id = str(d.id, 40);
      const question = str(d.question);
      if (!id || !question) {
        warn(`decisions[${i}]`, "Décision sans identifiant ou sans question ignorée");
        return;
      }
      decisions.push({
        id,
        question,
        affects: strList(d.affects),
        blockingFor: strList(d.blocking_for),
      });
    });
  }
  const decisionIds = new Set(decisions.map((d) => d.id));

  // Métré
  const takeoff = isObj(root.takeoff) ? root.takeoff : null;
  if (!takeoff) err("takeoff", "Bloc « takeoff » (métré) obligatoire");
  const lots: PrepLot[] = [];
  const lotCodes = new Set<string>();
  if (takeoff && Array.isArray(takeoff.lots)) {
    takeoff.lots.forEach((l, i) => {
      if (!isObj(l)) return;
      const code = str(l.code, 20);
      if (!code) {
        warn(`takeoff.lots[${i}]`, "Lot sans code ignoré");
        return;
      }
      if (lotCodes.has(code)) {
        err(`takeoff.lots[${i}]`, `Lot en double : ${code}`);
        return;
      }
      lotCodes.add(code);
      lots.push({ code, label: str(l.label, 120) ?? code });
    });
  }
  const rawItems = takeoff && Array.isArray(takeoff.items) ? takeoff.items : [];
  if (takeoff && rawItems.length === 0) err("takeoff.items", "Aucune ligne de métré");
  if (rawItems.length > PREP_LIMITS.lines) err("takeoff.items", `Trop de lignes (maximum ${PREP_LIMITS.lines})`);

  const lines: BundleLine[] = [];
  const lineCodes = new Set<string>();
  rawItems.slice(0, PREP_LIMITS.lines).forEach((it, i) => {
    const path = `takeoff.items[${i}]`;
    if (!isObj(it)) {
      err(path, "Ligne de métré invalide");
      return;
    }
    const code = str(it.id, 20);
    if (!code || !LINE_CODE_RE.test(code)) {
      err(path, `Identifiant de ligne invalide : « ${String(it.id ?? "")} » (ex. TE-01)`);
      return;
    }
    if (lineCodes.has(code)) {
      err(path, `Ligne en double : ${code}`);
      return;
    }
    lineCodes.add(code);

    let lot = str(it.lot, 20);
    if (!lot) {
      err(path, `${code} : lot obligatoire`);
      lot = "?";
    } else if (!lotCodes.has(lot)) {
      if (lots.length === 0 || !takeoff || !Array.isArray(takeoff.lots)) {
        lotCodes.add(lot);
        lots.push({ code: lot, label: lot });
        warn(path, `${code} : lot « ${lot} » créé automatiquement`);
      } else {
        err(path, `${code} : lot inexistant « ${lot} »`);
      }
    }

    const designation = str(it.designation, 500);
    if (!designation) err(path, `${code} : désignation obligatoire`);

    const unitRaw = str(it.unit, 20);
    if (!unitRaw) err(path, `${code} : unité obligatoire`);
    const normalized = unitRaw ? normalizePrepUnit(unitRaw) : { unit: "", changed: false };
    if (normalized.changed) warn(path, `${code} : unité « ${unitRaw} » normalisée en « ${normalized.unit} »`);

    const formula = str(it.formula, 500);
    const declaredRaw = it.declared_quantity;
    const declaredQuantity = num(declaredRaw);
    if (declaredRaw !== undefined && declaredRaw !== null && declaredQuantity === null) {
      err(path, `${code} : quantité déclarée non numérique`);
    }
    let provenance: StoredProvenance | null = null;
    let literalProvenance: StoredProvenance | null = null;
    if (!formula) {
      if (declaredQuantity === null) err(path, `${code} : ni formule ni quantité déclarée`);
      provenance = readImportProvenance(it.provenance, `${path}.provenance`, code, warn);
    } else if (it.provenance !== undefined && it.provenance !== null) {
      const p = String(it.provenance);
      if ((IMPORT_PROVENANCES as readonly string[]).includes(p)) literalProvenance = p as ImportProvenance;
    }

    let role: LineRole = "quote";
    if (typeof it.role === "string" && (LINE_ROLES as string[]).includes(it.role)) role = it.role as LineRole;
    else warn(path, `${code} : rôle absent ou inconnu — « quantité devis » par défaut, à confirmer`);

    let nature: LineNature | null = null;
    if (typeof it.nature === "string") {
      if ((LINE_NATURES as string[]).includes(it.nature)) nature = it.nature as LineNature;
      else warn(path, `${code} : nature « ${it.nature} » inconnue ignorée`);
    }

    const els = strList(it.element_ids);
    for (const e of els) if (!elementIds.has(e)) warn(path, `${code} : ouvrage inconnu ${e}`);
    const deps = strList(it.depends_on_decisions);
    for (const d of deps) if (!decisionIds.has(d)) warn(path, `${code} : décision inconnue ${d}`);

    const technicalDescription =
      str(it.technical_description, PREP_LIMITS.techText) ?? str(it.description, PREP_LIMITS.techText);

    lines.push({
      code,
      lot: lot ?? "?",
      subLot: str(it.sub_lot, 120),
      designation: designation ?? code,
      description: technicalDescription,
      includedServices: readStringList(it.included_services ?? it.prestations_comprises, 500),
      technicalReferences: readTechnicalReferences(
        it.technical_references ?? it.references_techniques,
        `${path}.technical_references`,
        warn,
      ),
      executionNotes: str(it.execution_notes ?? it.notes_execution, PREP_LIMITS.techText),
      qualityControls: readStringList(it.quality_controls ?? it.controles, 500),
      technicalReservations: readStringList(it.technical_reservations ?? it.reservations_techniques, 500),
      unit: normalized.unit,
      elementIds: els,
      formula,
      declaredQuantity,
      provenance,
      literalProvenance,
      justification: str(it.justification),
      role,
      nature,
      dependsOnDecisions: deps,
      notes: str(it.notes),
      sortOrder: i,
    });
  });

  // Contrôles
  const checks: PrepCheck[] = [];
  if (Array.isArray(root.checks)) {
    root.checks.forEach((c, i) => {
      if (!isObj(c)) return;
      const expected = num(c.expected);
      const target = str(c.target, 20);
      if (expected === null) {
        warn(`checks[${i}]`, "Contrôle sans valeur attendue ignoré");
        return;
      }
      if (target && !lineCodes.has(target)) warn(`checks[${i}]`, `Contrôle sur une ligne inconnue : ${target}`);
      checks.push({
        id: str(c.id, 40) ?? `CHK-${i + 1}`,
        label: str(c.label, 200) ?? target ?? `Contrôle ${i + 1}`,
        target: target && lineCodes.has(target) ? target : null,
        expected,
      });
    });
  }

  // Blocs des phases suivantes : conservés, contrôles de cohérence légers.
  const workflow = isObj(root.workflow) ? root.workflow : null;
  const stepIds = new Set<string>();
  if (workflow && Array.isArray(workflow.steps)) {
    workflow.steps.forEach((s, i) => {
      if (!isObj(s)) return;
      const id = str(s.id, 20);
      if (!id) {
        err(`workflow.steps[${i}]`, "Intervention sans identifiant");
        return;
      }
      if (stepIds.has(id)) err(`workflow.steps[${i}]`, `Intervention en double : ${id}`);
      stepIds.add(id);
      for (const t of strList(s.takeoff_ids)) {
        if (!lineCodes.has(t)) warn(`workflow.steps[${i}]`, `${id} : ligne de métré inconnue ${t}`);
      }
    });
  }
  const schedule = isObj(root.schedule) ? root.schedule : null;
  if (schedule && Array.isArray(schedule.tasks)) {
    schedule.tasks.forEach((t, i) => {
      if (!isObj(t)) return;
      const id = str(t.step_id, 20);
      if (id && !stepIds.has(id)) {
        err(`schedule.tasks[${i}]`, `Tâche de planning absente du mode opératoire : ${id}`);
      }
    });
  }
  const resources = isObj(root.resources) ? root.resources : null;
  const variants = Array.isArray(root.variants) ? root.variants.filter(isObj) : [];
  variants.forEach((v, i) => {
    if (!isObj(v.overrides)) return;
    for (const k of Object.keys(v.overrides)) {
      if (!paramKeys.has(k)) warn(`variants[${i}]`, `Variante : paramètre inconnu ${k}`);
    }
  });

  const disclaimers = strList(root.disclaimers).slice(0, 20);
  if (mode === "DEMONSTRATION" && !disclaimers.includes(DEMO_WATERMARK)) disclaimers.unshift(DEMO_WATERMARK);

  // Moteur : références, cycles, formules invalides, divisions par zéro.
  const engine = computeStudy({ params: parameters, lines });
  issues.push(...engine.structural);
  for (const line of lines) {
    const node = engine.nodes.get(line.code);
    if (!node) continue;
    if (node.error && !engine.structural.some((s) => s.message.startsWith(line.code))) {
      warn(line.code, `${line.code} : ${node.error} — quantité à vérifier`);
    }
    if (!adapted && line.formula && node.bases.has(`#const:${line.code}`)) {
      warn(line.code, `${line.code} : constante numérique dans la formule — préférer un paramètre nommé`);
    }
    if (line.formula && line.declaredQuantity !== null && node.value !== null) {
      if (quantitiesDiffer(node.value, line.declaredQuantity)) {
        warn(
          line.code,
          `${line.code} : quantité déclarée ${line.declaredQuantity} ≠ recalcul ${round6(node.value)} — le recalcul prévaut`,
        );
      }
    }
  }
  for (const c of checks) {
    if (!c.target) continue;
    const v = engine.nodes.get(c.target)?.value;
    if (v !== null && v !== undefined && quantitiesDiffer(v, c.expected)) {
      warn(c.id, `${c.label} : attendu ${c.expected}, recalculé ${round6(v)} — le recalcul prévaut`);
    }
  }

  if (issues.some((i) => i.severity === "error")) return { ok: false, issues };

  return {
    ok: true,
    issues,
    canonical: root,
    bundle: {
      sourceFormat,
      adapted,
      bundleId,
      schemaVersion,
      mode,
      study,
      sources,
      parameters,
      hypotheses,
      elements,
      lots,
      lines,
      checks,
      decisions,
      resources,
      workflow,
      schedule,
      variants,
      disclaimers,
    },
  };
}

function readImportProvenance(
  v: unknown,
  path: string,
  id: string,
  warn: (path: string, message: string) => void,
): StoredProvenance {
  if (typeof v === "string" && (IMPORT_PROVENANCES as readonly string[]).includes(v)) {
    return v as ImportProvenance;
  }
  if (v === "CALCULE" || v === "SAISIE_MANUELLE") {
    warn(path, `${id} : provenance « ${v} » réservée à BeWork — classée « hypothèse »`);
  } else {
    warn(path, `${id} : provenance absente ou inconnue — classée « hypothèse »`);
  }
  return "HYPOTHESE";
}

function round6(v: number): number {
  return Math.round(v * 1e6) / 1e6;
}
