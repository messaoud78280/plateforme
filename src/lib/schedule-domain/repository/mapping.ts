/**
 * Mapping pur SchedulePlan / CalculatedSchedule → structures Prisma Input.
 * Aucune logique métier ; aucune requête BDD.
 */
import type { Prisma } from "@prisma/client";
import type { CalculatedSchedule } from "../calculate";
import type { SchedulePlanV1 } from "../schema";
import { toDomainSnapshotJson } from "../versioning";

export function mapActivityKindToPrisma(
  kind: SchedulePlanV1["activities"][number]["kind"],
): "work" | "control" | "wait" {
  if (kind === "CONTROL") return "control";
  if (kind === "WAIT") return "wait";
  return "work";
}

export function mapDurationModeToPrisma(
  mode: "FIXED" | "PRODUCTIVITY",
): "fixed" | "computed" {
  return mode === "PRODUCTIVITY" ? "computed" : "fixed";
}

export function mapCrewJson(
  activity: SchedulePlanV1["activities"][number],
): Prisma.InputJsonValue {
  const req = activity.resourceRequirements;
  return {
    crew_id: req.crewId ?? null,
    crew_size: req.crewSize ?? null,
    members: req.labor.map((l) => ({
      labor_id: l.laborId,
      count: l.count,
    })),
  };
}

export function mapEquipmentJson(
  activity: SchedulePlanV1["activities"][number],
): Prisma.InputJsonValue {
  return activity.resourceRequirements.equipment.map((e) => ({
    equipment_id: e.equipmentId,
    count: e.count,
  }));
}

export function takeoffCodesOf(
  activity: SchedulePlanV1["activities"][number],
): string[] {
  return activity.sourceLinks
    .filter((l) => l.type === "TAKEOFF_LINE")
    .map((l) => l.code);
}

export function driverTakeoffCodeOf(
  activity: SchedulePlanV1["activities"][number],
): string | null {
  if (activity.duration.mode === "PRODUCTIVITY") {
    return activity.duration.sourceCode;
  }
  return takeoffCodesOf(activity)[0] ?? null;
}

export type MappedTaskRow = {
  stepCode: string;
  name: string;
  kind: "work" | "control" | "wait";
  sortOrder: number;
  description: string | null;
  startDate: Date | null;
  endDate: Date | null;
  durationMode: "fixed" | "computed";
  durationDays: number;
  durationCalendar: "working" | "calendar";
  computedDurationDays: number;
  driverTakeoffCode: string | null;
  takeoffCodesJson: Prisma.InputJsonValue;
  crewJson: Prisma.InputJsonValue;
  equipmentJson: Prisma.InputJsonValue;
  dependsOnJson: Prisma.InputJsonValue;
  quantitySnapshot: number | null;
  rateId: string | null;
  rateValue: number | null;
  rateUnit: string | null;
  parallelUnits: number;
};

export function mapPlanTasksForPersistence(
  plan: SchedulePlanV1,
  calculated: CalculatedSchedule,
  quantityByCode: Map<string, number | null>,
): MappedTaskRow[] {
  const calcById = new Map(calculated.activities.map((a) => [a.id, a]));
  return plan.activities.map((act, index) => {
    const calc = calcById.get(act.id);
    const codes = takeoffCodesOf(act);
    const driver = driverTakeoffCodeOf(act);
    const qty = driver ? (quantityByCode.get(driver) ?? null) : null;
    return {
      stepCode: act.id,
      name: act.name,
      kind: mapActivityKindToPrisma(act.kind),
      sortOrder: index,
      description: act.notes ?? null,
      startDate: calc?.startDate ? new Date(calc.startDate) : null,
      endDate: calc?.endDate ? new Date(calc.endDate) : null,
      durationMode: mapDurationModeToPrisma(
        calc?.durationMode ??
          (act.duration.mode === "PRODUCTIVITY" ? "PRODUCTIVITY" : "FIXED"),
      ),
      durationDays: calc?.durationDays ?? (
        act.duration.mode === "FIXED" ? act.duration.days : 0
      ),
      durationCalendar:
        calc?.calendar ??
        (act.duration.mode === "FIXED" ? act.duration.calendar : "working"),
      computedDurationDays: calc?.durationDays ?? 0,
      driverTakeoffCode: driver,
      takeoffCodesJson: codes,
      crewJson: mapCrewJson(act),
      equipmentJson: mapEquipmentJson(act),
      dependsOnJson: act.predecessors.map((p) => ({
        stepId: p.activityId,
        type: p.relation,
        lagDays: p.lagDays ?? 0,
      })),
      quantitySnapshot: qty,
      rateId:
        act.duration.mode === "PRODUCTIVITY"
          ? (act.duration.rateId ?? null)
          : null,
      rateValue:
        act.duration.mode === "PRODUCTIVITY" ? act.duration.rate : null,
      rateUnit:
        act.duration.mode === "PRODUCTIVITY" ? act.duration.rateUnit : null,
      parallelUnits:
        act.duration.mode === "PRODUCTIVITY"
          ? (act.duration.parallelUnits ?? 1)
          : 1,
    };
  });
}

export function expectedDependencyCount(plan: SchedulePlanV1): number {
  return plan.activities.reduce((n, a) => n + a.predecessors.length, 0);
}

export function expectedTakeoffLinkCount(plan: SchedulePlanV1): number {
  return plan.activities.reduce((n, a) => n + takeoffCodesOf(a).length, 0);
}

export function domainSnapshotForPersist(
  plan: SchedulePlanV1,
): Prisma.InputJsonValue {
  return toDomainSnapshotJson(plan) as unknown as Prisma.InputJsonValue;
}
