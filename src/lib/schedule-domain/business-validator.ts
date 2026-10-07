/**
 * Validateur métier SchedulePlan — au-delà du schéma structurel Zod.
 * Aucun throw pour erreur utilisateur prévisible ; issues structurées.
 * Aucun filtrage silencieux.
 */
import {
  buildDepsMapFromPredecessors,
  detectScheduleDependencyCycle,
} from "./cycle";
import type { DomainIssue, SchedulePlan } from "./schema";

export type ScheduleTakeoffLineContext = {
  code: string;
  /** false = non exécutable (indicator, etc.) */
  executable: boolean;
  role: string | null;
  quantity_for_planning: number | null;
  validated_quantity: number | null;
  declared_quantity: number | null;
  computed_quantity: number | null;
};

export type ScheduleSourceContext = {
  projectId: string;
  takeoffStudyId: string;
  takeoffVersion: number;
  takeoffFingerprint: string;
  lines: ScheduleTakeoffLineContext[];
  quoteId?: string | null;
  quoteVersion?: number | null;
};

export type BusinessValidationResult = {
  ok: boolean;
  issues: DomainIssue[];
  stats: {
    inputActivityCount: number;
    normalizedActivityCount: number;
    validatedActivityCount: number;
  };
};

function issue(
  code: string,
  path: string,
  value: unknown,
  message: string,
): DomainIssue {
  return { code, path, value, message, severity: "ERROR" };
}

function operationalQty(line: ScheduleTakeoffLineContext): number | null {
  if (line.quantity_for_planning != null && Number.isFinite(line.quantity_for_planning)) {
    return line.quantity_for_planning;
  }
  if (line.validated_quantity != null && Number.isFinite(line.validated_quantity)) {
    return line.validated_quantity;
  }
  if (line.declared_quantity != null && Number.isFinite(line.declared_quantity)) {
    return line.declared_quantity;
  }
  if (line.computed_quantity != null && Number.isFinite(line.computed_quantity)) {
    return line.computed_quantity;
  }
  return null;
}

/**
 * @param inputActivityCount — count avant adapter (invariant)
 * @param normalizedActivityCount — count après adapter
 */
export function validateSchedulePlanBusinessRules(
  plan: SchedulePlan,
  sourceContext: ScheduleSourceContext,
  counts?: {
    inputActivityCount?: number;
    normalizedActivityCount?: number;
  },
): BusinessValidationResult {
  const issues: DomainIssue[] = [];
  const inputActivityCount =
    counts?.inputActivityCount ?? plan.activities.length;
  const normalizedActivityCount =
    counts?.normalizedActivityCount ?? plan.activities.length;

  if (inputActivityCount !== normalizedActivityCount) {
    issues.push(
      issue(
        "ACTIVITY_COUNT_MISMATCH",
        "activities",
        { inputActivityCount, normalizedActivityCount },
        `Invariant cassé : input=${inputActivityCount} ≠ normalized=${normalizedActivityCount} — activité disparue (BUG)`,
      ),
    );
  }

  // Source snapshot cohérent
  if (plan.sourceSnapshot.projectId !== sourceContext.projectId) {
    issues.push(
      issue(
        "SOURCE_MISMATCH",
        "sourceSnapshot.projectId",
        plan.sourceSnapshot.projectId,
        "projectId du plan ≠ sourceContext",
      ),
    );
  }
  if (plan.sourceSnapshot.takeoffStudyId !== sourceContext.takeoffStudyId) {
    issues.push(
      issue(
        "SOURCE_MISMATCH",
        "sourceSnapshot.takeoffStudyId",
        plan.sourceSnapshot.takeoffStudyId,
        "takeoffStudyId du plan ≠ sourceContext",
      ),
    );
  }
  if (plan.sourceSnapshot.takeoffVersion !== sourceContext.takeoffVersion) {
    issues.push(
      issue(
        "SOURCE_STALE",
        "sourceSnapshot.takeoffVersion",
        plan.sourceSnapshot.takeoffVersion,
        `Version métré plan=${plan.sourceSnapshot.takeoffVersion} ≠ context=${sourceContext.takeoffVersion}`,
      ),
    );
  }
  if (plan.sourceSnapshot.takeoffFingerprint !== sourceContext.takeoffFingerprint) {
    issues.push(
      issue(
        "SOURCE_STALE",
        "sourceSnapshot.takeoffFingerprint",
        plan.sourceSnapshot.takeoffFingerprint,
        "Empreinte métré divergente (SOURCE_STALE)",
      ),
    );
  }

  const lineByCode = new Map(sourceContext.lines.map((l) => [l.code, l]));
  const ids = new Set(plan.activities.map((a) => a.id));

  for (let i = 0; i < plan.activities.length; i++) {
    const act = plan.activities[i]!;
    const base = `activities[${i}]`;

    // Resources WAIT
    if (act.kind === "WAIT") {
      const req = act.resourceRequirements;
      const hasCrew =
        Boolean(req.crewId) ||
        (req.crewSize != null && req.crewSize > 0) ||
        req.labor.some((l) => l.count > 0) ||
        req.equipment.some((e) => e.count > 0);
      if (hasCrew) {
        issues.push(
          issue(
            "WAIT_WITH_RESOURCES",
            `${base}.resourceRequirements`,
            req,
            `WAIT ${act.id} ne doit pas avoir de ressource active`,
          ),
        );
      }
    }

    // crewSize
    if (act.resourceRequirements.crewSize != null) {
      if (!(act.resourceRequirements.crewSize > 0)) {
        issues.push(
          issue(
            "INVALID_CREW_SIZE",
            `${base}.resourceRequirements.crewSize`,
            act.resourceRequirements.crewSize,
            `crewSize doit être > 0 (activité ${act.id})`,
          ),
        );
      }
    }

    // Predecessors
    for (let j = 0; j < act.predecessors.length; j++) {
      const pred = act.predecessors[j]!;
      if (pred.activityId === act.id) {
        issues.push(
          issue(
            "SELF_DEPENDENCY",
            `${base}.predecessors[${j}].activityId`,
            pred.activityId,
            `Auto-dépendance interdite sur ${act.id}`,
          ),
        );
      }
      if (!ids.has(pred.activityId)) {
        issues.push(
          issue(
            "UNKNOWN_PREDECESSOR",
            `${base}.predecessors[${j}].activityId`,
            pred.activityId,
            `Prédécesseur inconnu : ${pred.activityId}`,
          ),
        );
      }
    }

    // Takeoff links
    for (let j = 0; j < act.sourceLinks.length; j++) {
      const link = act.sourceLinks[j]!;
      if (link.type !== "TAKEOFF_LINE") continue;
      const line = lineByCode.get(link.code);
      if (!line) {
        issues.push(
          issue(
            "TAKEOFF_LINE_NOT_FOUND",
            `${base}.sourceLinks[${j}].code`,
            link.code,
            `Ligne métré introuvable : ${link.code}`,
          ),
        );
        continue;
      }
      const role = (line.role ?? "").toLowerCase();
      if (role === "indicator" || !line.executable) {
        issues.push(
          issue(
            "TAKEOFF_LINE_NOT_EXECUTABLE",
            `${base}.sourceLinks[${j}].code`,
            link.code,
            `Ligne ${link.code} non exécutable (role=${line.role ?? "null"})`,
          ),
        );
      }

      if (act.duration.mode === "PRODUCTIVITY") {
        const qty = operationalQty(line);
        if (qty == null) {
          issues.push(
            issue(
              "TAKEOFF_QUANTITY_MISSING",
              `${base}.duration`,
              link.code,
              `Quantité opérationnelle absente pour ${link.code} (PRODUCTIVITY)`,
            ),
          );
        }
      }
    }

    if (act.duration.mode === "PRODUCTIVITY") {
      const code = act.duration.sourceCode;
      const line = lineByCode.get(code);
      if (!line) {
        issues.push(
          issue(
            "TAKEOFF_LINE_NOT_FOUND",
            `${base}.duration.sourceCode`,
            code,
            `driver PRODUCTIVITY introuvable : ${code}`,
          ),
        );
      } else if (!line.executable || (line.role ?? "").toLowerCase() === "indicator") {
        issues.push(
          issue(
            "TAKEOFF_LINE_NOT_EXECUTABLE",
            `${base}.duration.sourceCode`,
            code,
            `driver PRODUCTIVITY non exécutable : ${code}`,
          ),
        );
      }
    }
  }

  // Cycles — bloque tout calcul
  const depsMap = buildDepsMapFromPredecessors(plan.activities);
  const cycle = detectScheduleDependencyCycle(depsMap);
  if (cycle.hasCycle) {
    issues.push(
      issue(
        "DEPENDENCY_CYCLE",
        "activities",
        cycle.path,
        `Cycle de dépendances détecté : ${cycle.path.join(" → ")}`,
      ),
    );
  }

  const hasBlocking = issues.some((i) => i.severity === "ERROR");
  const validatedActivityCount = hasBlocking ? 0 : plan.activities.length;

  if (
    !hasBlocking &&
    (validatedActivityCount !== normalizedActivityCount ||
      validatedActivityCount !== inputActivityCount)
  ) {
    issues.push(
      issue(
        "ACTIVITY_COUNT_MISMATCH",
        "activities",
        {
          inputActivityCount,
          normalizedActivityCount,
          validatedActivityCount,
        },
        "Invariant input = normalized = validated cassé",
      ),
    );
  }

  return {
    ok: !issues.some((i) => i.severity === "ERROR"),
    issues,
    stats: {
      inputActivityCount,
      normalizedActivityCount,
      validatedActivityCount: !issues.some((i) => i.severity === "ERROR")
        ? plan.activities.length
        : 0,
    },
  };
}
