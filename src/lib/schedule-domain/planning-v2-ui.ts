/**
 * Helpers UI Planning V2 — testables sans React.
 * Séparation stricte des states ; classification d’erreurs.
 */
import { BEWORK_SCHEDULE_AI_FORMAT } from "./ai-contract";

export type PlanningV2Step = "context" | "json" | "preview" | "success";

export type PlanningV2IssueLike = {
  code?: string;
  path?: string;
  message?: string;
  severity?: string;
};

export type PlanningV2ErrorKind =
  | "SYNTAX_ERROR"
  | "CONTRACT_ERROR"
  | "BUSINESS_ERROR"
  | "SOURCE_STALE"
  | "PREVIEW_STALE"
  | "PLAN_STATE_STALE"
  | "UNKNOWN";

export type PlanningV2UiState = {
  contextJson: string;
  rawAiJson: string;
  sourcesFingerprint: string | null;
  studyId: string | null;
  draftHash: string | null;
  previewResult: unknown | null;
  commitState: "idle" | "pending" | "success" | "error";
  step: PlanningV2Step;
};

export function initialPlanningV2UiState(): PlanningV2UiState {
  return {
    contextJson: "",
    rawAiJson: "",
    sourcesFingerprint: null,
    studyId: null,
    draftHash: null,
    previewResult: null,
    commitState: "idle",
    step: "context",
  };
}

/**
 * Copier le contexte : met à jour contextJson + fingerprint uniquement.
 * Ne touche JAMAIS rawAiJson / preview / draftHash.
 */
export function applyCopiedContext(
  state: PlanningV2UiState,
  input: { text: string; sourcesFingerprint: string; studyId: string },
): PlanningV2UiState {
  return {
    ...state,
    contextJson: input.text,
    sourcesFingerprint: input.sourcesFingerprint,
    studyId: input.studyId,
    // rawAiJson / previewResult / draftHash inchangés volontairement
  };
}

export function clearRawAiJson(state: PlanningV2UiState): PlanningV2UiState {
  return {
    ...state,
    rawAiJson: "",
    previewResult: null,
    draftHash: null,
    commitState: "idle",
    step: state.step === "success" ? "json" : state.step === "preview" ? "json" : state.step,
  };
}

export function invalidatePreview(state: PlanningV2UiState): PlanningV2UiState {
  return {
    ...state,
    previewResult: null,
    draftHash: null,
    commitState: "idle",
    step: "json",
  };
}

export function classifyPlanningV2Error(
  code: string | null | undefined,
  issues?: PlanningV2IssueLike[] | null,
): PlanningV2ErrorKind {
  const c = (code ?? issues?.[0]?.code ?? "").toUpperCase();
  if (c === "SOURCE_STALE") return "SOURCE_STALE";
  if (c === "PREVIEW_STALE") return "PREVIEW_STALE";
  if (c === "FEATURE_COMMIT_DISABLED" || c === "FEATURE_DISABLED") {
    return "CONTRACT_ERROR";
  }
  if (c === "PLAN_STATE_STALE" || c === "PLAN_ALREADY_EXISTS") return "PLAN_STATE_STALE";
  if (c === "PARSE_ERROR" || c === "SYNTAX_ERROR" || c === "JSON_PARSE") {
    return "SYNTAX_ERROR";
  }
  if (
    c === "UNKNOWN_AI_FORMAT" ||
    c === "INVALID_AI_ROOT" ||
    c === "KIND_EXCLUDED_V1" ||
    c === "RELATION_EXCLUDED_V1" ||
    c.startsWith("invalid_type".toUpperCase()) ||
    c === "INVALID_TYPE"
  ) {
    return "CONTRACT_ERROR";
  }
  if (
    c === "DEPENDENCY_CYCLE" ||
    c === "WAIT_WITH_CREW" ||
    c === "TAKEOFF_LINE_NOT_EXECUTABLE" ||
    c === "TAKEOFF_LINE_MISSING" ||
    c === "ORPHAN_DEPENDENCY" ||
    c === "ACTIVITY_COUNT_MISMATCH"
  ) {
    return "BUSINESS_ERROR";
  }
  if (issues?.length) {
    const first = (issues[0]?.code ?? "").toUpperCase();
    if (first.includes("PARSE") || first === "JSON_PARSE") return "SYNTAX_ERROR";
    if (first.includes("FORMAT") || first.includes("EXCLUDED")) return "CONTRACT_ERROR";
    return "BUSINESS_ERROR";
  }
  return "UNKNOWN";
}

export function staleUserMessage(kind: PlanningV2ErrorKind): string | null {
  if (kind === "SOURCE_STALE") {
    return "Le métré a changé depuis la préparation du planning. Recopiez le contexte actualisé avant de générer un nouveau planning.";
  }
  if (kind === "PREVIEW_STALE") {
    return "Le planning collé ne correspond plus à la prévisualisation. Prévisualisez de nouveau.";
  }
  if (kind === "PLAN_STATE_STALE") {
    return "Un planning a été créé entre-temps. Rechargez le chantier.";
  }
  return null;
}

export function formatIssueLine(issue: PlanningV2IssueLike): string {
  const path = (issue.path ?? "").trim();
  const msg = (issue.message ?? "Erreur").trim();
  if (path && msg) return `${path}\n${msg}`;
  return msg || path || "Erreur";
}

/** Affiche « P02 ← FS P01 » (activityId = successeur). */
export function formatPredecessorEdge(
  successorId: string,
  pred: { activityId: string; relation: string; lagDays?: number },
): string {
  const lag =
    pred.lagDays && pred.lagDays !== 0 ? ` lag ${pred.lagDays} j` : "";
  return `${successorId} ← ${pred.relation} ${pred.activityId}${lag}`;
}

export function buildCommitPayload(input: {
  raw: string;
  draftHash: string;
  sourcesFingerprint: string;
  studyId: string | null;
}) {
  return {
    raw: input.raw,
    draftHash: input.draftHash,
    sourcesFingerprint: input.sourcesFingerprint,
    studyId: input.studyId,
  };
}

export function summarizePreviewForConfirm(stats: {
  calculatedActivities?: number;
  inputActivities?: number;
  totalDurationDays?: number;
}): string {
  const n = stats.calculatedActivities ?? stats.inputActivities ?? 0;
  const days = stats.totalDurationDays ?? 0;
  return `${n} activité${n > 1 ? "s" : ""} seront créées — durée prévisionnelle ${days} jour${days > 1 ? "s" : ""}`;
}

export const RAW_AI_PLACEHOLDER = `{
  "format": "bework_schedule_ai_v1",
  "activities": [...]
}`;

/**
 * Détecte un collage du contexte ChatGPT (ou du legacy) dans la zone prévue
 * pour bework_schedule_ai_v1 — erreur UX fréquente, message métier clair.
 */
export function detectWrongPlanningV2Paste(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(t);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
  const o = parsed as Record<string, unknown>;
  const format = String(o.format ?? "");
  const expected = String(o.expected_output ?? "");
  const type = String(o.type ?? "");

  if (
    type === "bework_chatgpt_context_v1" ||
    expected === "bework_schedule_ai_v1" ||
    expected === "bework_schedule_bundle_v1" ||
    o.instructions != null ||
    o.takeoff != null
  ) {
    return "Vous avez collé le CONTEXTE BeWork (brief pour ChatGPT), pas le planning. Dans ChatGPT, demandez le JSON puis collez uniquement un objet { \"format\": \"bework_schedule_ai_v1\", \"activities\": [...] }.";
  }
  if (format === "bework_schedule_bundle_v1") {
    return "Format legacy bework_schedule_bundle_v1 — ce flux V2 attend bework_schedule_ai_v1.";
  }
  return null;
}

/** Exemple minimal dérivé du contrat — pas de doc JSON manuscrite. */
export function buildMinimalAiScheduleExample(codes: string[]) {
  const c1 = codes[0] ?? "GO-00-01";
  const c2 = codes[1] ?? "GO-00-02";
  return {
    format: BEWORK_SCHEDULE_AI_FORMAT,
    activities: [
      {
        id: "P01",
        name: "Installation chantier",
        kind: "WORK" as const,
        duration_days: 1,
        takeoff_codes: [c1],
        after: [] as Array<{ id: string; type: string; lag_days: number }>,
      },
      {
        id: "P02",
        name: "Fouilles",
        kind: "WORK" as const,
        duration_days: 2,
        takeoff_codes: [c2],
        after: [{ id: "P01", type: "FS", lag_days: 0 }],
      },
    ],
  };
}
