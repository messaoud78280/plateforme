/**
 * Parsing défensif des JSON resources / workflow / schedule PrepStudy.
 */
import type {
  PrepDependencyType,
  PrepDurationComputed,
  PrepDurationFixed,
  PrepEquipmentDTO,
  PrepLaborDTO,
  PrepRateDTO,
  PrepRatePer,
  PrepResourcesDTO,
  PrepScheduleCalendarDTO,
  PrepScheduleDTO,
  PrepScheduleDepDTO,
  PrepScheduleTaskDTO,
  PrepStepDuration,
  PrepStepKind,
  PrepSupplyDTO,
  PrepWorkflowStepDTO,
} from "@/lib/preparation/schedule/types";

function isObj(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function str(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t || null;
}

function num(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim()) {
    const n = Number(v.replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function strArr(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => str(x)).filter((x): x is string => !!x);
}

function parseRatePer(v: unknown): PrepRatePer {
  return v === "equipe" ? "equipe" : "engin";
}

function parseKind(v: unknown): PrepStepKind {
  if (v === "control" || v === "wait") return v;
  return "work";
}

function parseDuration(raw: unknown): PrepStepDuration | null {
  if (!isObj(raw)) return null;
  if (raw.mode === "computed") {
    const driver = str(raw.driver_item);
    const rateId = str(raw.rate_id);
    if (!driver || !rateId) return null;
    const out: PrepDurationComputed = {
      mode: "computed",
      driver_item: driver,
      rate_id: rateId,
      parallel_units: Math.max(1, num(raw.parallel_units) ?? 1),
      rounding:
        raw.rounding === "ceil_day" || raw.rounding === "none"
          ? raw.rounding
          : "ceil_half_day",
    };
    return out;
  }
  const days = num(raw.days);
  if (days == null || days < 0) return null;
  const fixed: PrepDurationFixed = {
    mode: "fixed",
    days,
    calendar: raw.calendar === "calendar" ? "calendar" : "working",
    provenance: str(raw.provenance),
  };
  return fixed;
}

function parseDepType(v: unknown): PrepDependencyType {
  if (v === "SS" || v === "FF") return v;
  return "FS";
}

export function parsePrepResources(raw: unknown): PrepResourcesDTO {
  const empty: PrepResourcesDTO = { labor: [], equipment: [], supplies: [], rates: [] };
  if (!isObj(raw)) return empty;

  const labor: PrepLaborDTO[] = [];
  if (Array.isArray(raw.labor)) {
    for (const item of raw.labor) {
      if (!isObj(item)) continue;
      const id = str(item.id);
      const role = str(item.role);
      if (!id || !role) continue;
      labor.push({ id, role, note: str(item.note) });
    }
  }

  const equipment: PrepEquipmentDTO[] = [];
  if (Array.isArray(raw.equipment)) {
    for (const item of raw.equipment) {
      if (!isObj(item)) continue;
      const id = str(item.id);
      const label = str(item.label);
      if (!id || !label) continue;
      equipment.push({
        id,
        category: str(item.category) ?? "autre",
        label,
        note: str(item.note),
      });
    }
  }

  const supplies: PrepSupplyDTO[] = [];
  if (Array.isArray(raw.supplies)) {
    for (const item of raw.supplies) {
      if (!isObj(item)) continue;
      const id = str(item.id);
      const label = str(item.label);
      if (!id || !label) continue;
      supplies.push({ id, label, note: str(item.note) });
    }
  }

  const rates: PrepRateDTO[] = [];
  if (Array.isArray(raw.rates)) {
    for (const item of raw.rates) {
      if (!isObj(item)) continue;
      const id = str(item.id);
      const label = str(item.label);
      const value = num(item.value);
      const unit = str(item.unit);
      if (!id || !label || value == null || !unit) continue;
      rates.push({
        id,
        label,
        value,
        unit,
        per: parseRatePer(item.per),
        provenance: str(item.provenance),
        note: str(item.note),
      });
    }
  }

  return { labor, equipment, supplies, rates };
}

export function parsePrepWorkflowSteps(raw: unknown): PrepWorkflowStepDTO[] {
  if (!isObj(raw) || !Array.isArray(raw.steps)) return [];
  const steps: PrepWorkflowStepDTO[] = [];
  for (const item of raw.steps) {
    if (!isObj(item)) continue;
    const id = str(item.id);
    const name = str(item.name);
    const duration = parseDuration(item.duration);
    if (!id || !name || !duration) continue;
    const order = num(item.order) ?? steps.length + 1;
    const crew: PrepWorkflowStepDTO["crew"] = [];
    if (Array.isArray(item.crew)) {
      for (const c of item.crew) {
        if (!isObj(c)) continue;
        const laborId = str(c.labor_id);
        const count = num(c.count) ?? 1;
        if (laborId) crew.push({ labor_id: laborId, count: Math.max(0, count) });
      }
    }
    const equipment: PrepWorkflowStepDTO["equipment"] = [];
    if (Array.isArray(item.equipment)) {
      for (const e of item.equipment) {
        if (!isObj(e)) continue;
        const equipmentId = str(e.equipment_id);
        const count = num(e.count) ?? 1;
        if (equipmentId) equipment.push({ equipment_id: equipmentId, count: Math.max(0, count) });
      }
    }
    let conditional: PrepWorkflowStepDTO["conditional"] = null;
    if (isObj(item.conditional)) {
      conditional = { conditions: strArr(item.conditional.conditions) };
    }
    steps.push({
      id,
      order,
      name,
      lot: str(item.lot),
      kind: parseKind(item.kind),
      description: str(item.description),
      takeoff_ids: strArr(item.takeoff_ids),
      duration,
      crew,
      equipment,
      supplies: strArr(item.supplies),
      preconditions: strArr(item.preconditions),
      controls_before_next: strArr(item.controls_before_next),
      constraints: strArr(item.constraints),
      safety: strArr(item.safety),
      proofs: strArr(item.proofs),
      hold_point: item.hold_point === true,
      conditional,
    });
  }
  return steps.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
}

export function parsePrepSchedule(raw: unknown): PrepScheduleDTO | null {
  if (!isObj(raw)) return null;
  const calRaw = isObj(raw.calendar) ? raw.calendar : {};
  const working = Array.isArray(calRaw.working_days)
    ? calRaw.working_days.map((d) => num(d)).filter((d): d is number => d != null && d >= 1 && d <= 7)
    : [1, 2, 3, 4, 5];
  const calendar: PrepScheduleCalendarDTO = {
    working_days: working.length ? working : [1, 2, 3, 4, 5],
    holidays:
      calRaw.holidays === "FR_METROPOLE"
        ? "FR_METROPOLE"
        : Array.isArray(calRaw.holidays)
          ? strArr(calRaw.holidays)
          : null,
    granularity_days: num(calRaw.granularity_days) ?? 0.5,
  };

  const tasks: PrepScheduleTaskDTO[] = [];
  if (Array.isArray(raw.tasks)) {
    for (const t of raw.tasks) {
      if (!isObj(t)) continue;
      const stepId = str(t.step_id);
      if (!stepId) continue;
      const depends_on: PrepScheduleDepDTO[] = [];
      if (Array.isArray(t.depends_on)) {
        for (const d of t.depends_on) {
          if (!isObj(d)) continue;
          const pred = str(d.step_id);
          if (!pred) continue;
          depends_on.push({
            step_id: pred,
            type: parseDepType(d.type),
            lag_days: num(d.lag_days) ?? 0,
            lag_calendar: d.lag_calendar === "calendar" ? "calendar" : "working",
          });
        }
      }
      tasks.push({
        step_id: stepId,
        depends_on,
        start_alignment: t.start_alignment === "day_start" ? "day_start" : null,
        include_in_base: t.include_in_base === false ? false : true,
      });
    }
  }

  return {
    start_date: str(raw.start_date),
    start_date_provenance: str(raw.start_date_provenance),
    calendar,
    tasks,
    note: str(raw.note),
  };
}
