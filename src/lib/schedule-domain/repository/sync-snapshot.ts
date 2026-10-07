import type { Prisma } from "@prisma/client";
import { d } from "@/lib/commercial/decimal";
import { normalizeDependsOnJson } from "@/lib/bework-patch/operation-contracts";
import { parseCrewJson } from "@/lib/preparation/schedule/crew";
import { SCHEDULE_PLAN_SCHEMA_VERSION } from "../constants";
import {
  parseSchedulePlan,
  SchedulePlanV2Schema,
  type SchedulePlanV2,
} from "../schema";

function records(raw: unknown): Record<string, unknown>[] {
  return Array.isArray(raw)
    ? raw.filter(
        (item): item is Record<string, unknown> =>
          !!item && typeof item === "object" && !Array.isArray(item),
      )
    : [];
}

function strings(raw: unknown): string[] {
  return Array.isArray(raw)
    ? raw.filter((item): item is string => typeof item === "string")
    : [];
}

function byType(raw: unknown, type: string): Record<string, unknown>[] {
  return records(raw).filter((item) => item.type === type);
}

function nullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/**
 * Reconstruit le snapshot canonique depuis les lignes persistées après un patch.
 * Les plans legacy sans snapshot restent volontairement legacy.
 */
export async function syncScheduleDomainSnapshotInTx(
  tx: Prisma.TransactionClient,
  input: { orgId: string; planId: string },
): Promise<{ synced: boolean }> {
  const row = await tx.prepSchedulePlan.findFirst({
    where: { id: input.planId, organizationId: input.orgId },
    select: {
      id: true,
      startDate: true,
      domainSnapshotJson: true,
      tasks: {
        orderBy: { sortOrder: "asc" },
        select: {
          stepCode: true,
          name: true,
          kind: true,
          lot: true,
          description: true,
          holdPoint: true,
          durationDays: true,
          durationCalendar: true,
          takeoffCodesJson: true,
          crewJson: true,
          equipmentJson: true,
          suppliesJson: true,
          preconditionsJson: true,
          controlsJson: true,
          constraintsJson: true,
          safetyJson: true,
          proofsJson: true,
          dependsOnJson: true,
        },
      },
    },
  });
  if (!row?.domainSnapshotJson) return { synced: false };
  const previous = parseSchedulePlan(row.domainSnapshotJson);
  if (!previous.ok) return { synced: false };

  const labor = new Map(previous.plan.resources.labor.map((item) => [item.id, item]));
  const equipmentCatalog = new Map(
    previous.plan.resources.equipment.map((item) => [item.id, item]),
  );

  const activities: SchedulePlanV2["activities"] = row.tasks.map((task) => {
    const crew = parseCrewJson(task.crewJson);
    const equipment = records(task.equipmentJson).flatMap((item) => {
      const id = nullableString(item.equipment_id ?? item.id);
      if (!id) return [];
      const label = nullableString(item.label) ?? id;
      equipmentCatalog.set(id, {
        id,
        category: "chantier",
        label,
        note: nullableString(item.note),
      });
      return [{
        id,
        label,
        count: typeof item.count === "number" ? item.count : 1,
        note: nullableString(item.note),
      }];
    });
    const supplies = records(task.suppliesJson).flatMap((item) => {
      const id = nullableString(item.supply_id ?? item.id);
      if (!id) return [];
      return [{
        id,
        label: nullableString(item.label) ?? id,
        count: typeof item.count === "number" ? item.count : 1,
        note: nullableString(item.note),
      }];
    });
    const crewMembers = crew.members.map((member) => {
      const role = member.role ?? member.label ?? member.labor_id;
      labor.set(member.labor_id, {
        id: member.labor_id,
        role,
        note: null,
      });
      return {
        laborId: member.labor_id,
        role,
        count: member.count,
      };
    });
    const references = byType(
      task.proofsJson,
      "TECHNICAL_REFERENCE",
    ).flatMap((reference) => {
      const code = nullableString(reference.code);
      if (!code) return [];
      const applicability: "INDICATIVE" | "CONTRACTUAL" | "TO_CONFIRM" =
        reference.applicability === "CONTRACTUAL" ||
        reference.applicability === "TO_CONFIRM"
          ? reference.applicability
          : ("INDICATIVE" as const);
      return [{
        code,
        label: nullableString(reference.label),
        applicability,
        sourceUrl: nullableString(reference.sourceUrl ?? reference.source_url),
        note: nullableString(reference.note),
      }];
    });
    const basis = byType(task.constraintsJson, "DURATION_BASIS")[0];
    const provenance =
      basis?.provenance === "SOURCE_DATA" ||
      basis?.provenance === "USER_DECISION" ||
      basis?.provenance === "PRODUCTIVITY_RATE"
        ? basis.provenance
        : ("PLANNING_ASSUMPTION" as const);

    return {
      id: task.stepCode,
      name: task.name,
      kind:
        task.kind === "control"
          ? "CONTROL"
          : task.kind === "wait"
            ? "WAIT"
            : "WORK",
      sourceLinks: strings(task.takeoffCodesJson).map((code) => ({
        type: "TAKEOFF_LINE" as const,
        code,
      })),
      duration: {
        mode: "FIXED" as const,
        days: d(task.durationDays),
        calendar:
          task.durationCalendar === "calendar"
            ? ("calendar" as const)
            : ("working" as const),
      },
      resourceRequirements: {
        crewId: crew.crewId,
        crewSize: crew.crewSize,
        labor: crewMembers.map((member) => ({
          laborId: member.laborId,
          count: member.count,
        })),
        equipment: equipment.map((item) => ({
          equipmentId: item.id,
          count: item.count,
        })),
      },
      predecessors: normalizeDependsOnJson(task.dependsOnJson).map((dep) => ({
        activityId: dep.step_id,
        relation: dep.type ?? "FS",
        lagDays: dep.lag_days ?? 0,
      })),
      notes: task.description,
      lot: task.lot,
      phase: nullableString(byType(task.constraintsJson, "PHASE")[0]?.label),
      crewMembers,
      equipment,
      supplies,
      preconditions: strings(task.preconditionsJson),
      controls: strings(task.controlsJson),
      constraints: strings(task.constraintsJson),
      safety: strings(task.safetyJson),
      proofs: strings(task.proofsJson),
      technicalReferences: references,
      assumptions: byType(task.constraintsJson, "ASSUMPTION")
        .map((item) => nullableString(item.label))
        .filter((item): item is string => !!item),
      durationBasis: basis
        ? {
            provenance,
            minDays:
              typeof (basis.minDays ?? basis.min_days) === "number"
                ? Number(basis.minDays ?? basis.min_days)
                : null,
            maxDays:
              typeof (basis.maxDays ?? basis.max_days) === "number"
                ? Number(basis.maxDays ?? basis.max_days)
                : null,
            rationale: nullableString(basis.rationale),
            toValidate:
              typeof (basis.toValidate ?? basis.to_validate) === "boolean"
                ? Boolean(basis.toValidate ?? basis.to_validate)
                : true,
          }
        : null,
      holdPoint: task.holdPoint,
    };
  });

  const snapshot: SchedulePlanV2 = {
    schemaVersion: SCHEDULE_PLAN_SCHEMA_VERSION,
    sourceSnapshot: previous.plan.sourceSnapshot,
    calendar: {
      ...previous.plan.calendar,
      startDate: row.startDate?.toISOString().slice(0, 10) ?? null,
    },
    resources: {
      labor: [...labor.values()],
      equipment: [...equipmentCatalog.values()],
      rates: previous.plan.resources.rates,
    },
    activities,
  };
  const validated = SchedulePlanV2Schema.parse(snapshot);
  await tx.prepSchedulePlan.update({
    where: { id: row.id },
    data: {
      domainSnapshotJson: validated as unknown as Prisma.InputJsonValue,
    },
  });
  return { synced: true };
}
