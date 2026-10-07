/**
 * Mapping pur SchedulePlan / CalculatedSchedule → structures Prisma Input.
 * Aucune logique métier ; aucune requête BDD.
 */
import type { Prisma } from "@prisma/client";
import type { CalculatedSchedule } from "../calculate";
import type { ScheduleActivity, SchedulePlan } from "../schema";
import { toDomainSnapshotJson } from "../versioning";

export function mapActivityKindToPrisma(
  kind: ScheduleActivity["kind"],
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
  activity: ScheduleActivity,
): Prisma.InputJsonValue {
  const req = activity.resourceRequirements;
  const members = "crewMembers" in activity
    ? activity.crewMembers.map((member) => ({
        labor_id: member.laborId,
        role: member.role,
        count: member.count,
      }))
    : req.labor.map((member) => ({
        labor_id: member.laborId,
        count: member.count,
      }));
  return {
    crew_id: req.crewId ?? null,
    crew_size: req.crewSize ?? null,
    members,
  };
}

export function mapEquipmentJson(
  activity: ScheduleActivity,
): Prisma.InputJsonValue {
  if ("equipment" in activity) {
    return activity.equipment.map((item) => ({
      equipment_id: item.id,
      label: item.label,
      count: item.count,
      note: item.note ?? null,
    }));
  }
  return activity.resourceRequirements.equipment.map((item) => ({
    equipment_id: item.equipmentId,
    count: item.count,
  }));
}

export function takeoffCodesOf(
  activity: ScheduleActivity,
): string[] {
  return activity.sourceLinks
    .filter((l) => l.type === "TAKEOFF_LINE")
    .map((l) => l.code);
}

export function driverTakeoffCodeOf(
  activity: ScheduleActivity,
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
  lot: string | null;
  holdPoint: boolean;
  suppliesJson: Prisma.InputJsonValue;
  preconditionsJson: Prisma.InputJsonValue;
  controlsJson: Prisma.InputJsonValue;
  constraintsJson: Prisma.InputJsonValue;
  safetyJson: Prisma.InputJsonValue;
  proofsJson: Prisma.InputJsonValue;
};

export function mapPlanTasksForPersistence(
  plan: SchedulePlan,
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
      lot: "lot" in act ? (act.lot ?? null) : null,
      holdPoint: "holdPoint" in act ? act.holdPoint : false,
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
      suppliesJson:
        "supplies" in act
          ? act.supplies.map((item) => ({
              supply_id: item.id,
              label: item.label,
              count: item.count,
              note: item.note ?? null,
            }))
          : [],
      preconditionsJson: "preconditions" in act ? act.preconditions : [],
      controlsJson: "controls" in act ? act.controls : [],
      constraintsJson:
        "constraints" in act
          ? [
              ...act.constraints,
              ...(act.phase
                ? [{ type: "PHASE", label: act.phase }]
                : []),
              ...act.assumptions.map((label) => ({
                type: "ASSUMPTION",
                label,
              })),
              ...(act.durationBasis
                ? [{ type: "DURATION_BASIS", ...act.durationBasis }]
                : []),
            ]
          : [],
      safetyJson: "safety" in act ? act.safety : [],
      proofsJson:
        "proofs" in act
          ? [
              ...act.proofs,
              ...act.technicalReferences.map((reference) => ({
                type: "TECHNICAL_REFERENCE",
                ...reference,
              })),
            ]
          : [],
    };
  });
}

export function expectedDependencyCount(plan: SchedulePlan): number {
  return plan.activities.reduce((n, a) => n + a.predecessors.length, 0);
}

export function expectedTakeoffLinkCount(plan: SchedulePlan): number {
  return plan.activities.reduce((n, a) => n + takeoffCodesOf(a).length, 0);
}

export function domainSnapshotForPersist(
  plan: SchedulePlan,
): Prisma.InputJsonValue {
  return toDomainSnapshotJson(plan) as unknown as Prisma.InputJsonValue;
}
