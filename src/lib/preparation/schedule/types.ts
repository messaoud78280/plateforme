/**
 * Types mode opératoire / ressources / planning (bework_prep_bundle_v1).
 */

export type PrepRatePer = "engin" | "equipe";

export type PrepRateDTO = {
  id: string;
  label: string;
  value: number;
  unit: string;
  per: PrepRatePer;
  provenance?: string | null;
  note?: string | null;
};

export type PrepLaborDTO = { id: string; role: string; note?: string | null };
export type PrepEquipmentDTO = {
  id: string;
  category: string;
  label: string;
  note?: string | null;
};
export type PrepSupplyDTO = { id: string; label: string; note?: string | null };

export type PrepResourcesDTO = {
  labor: PrepLaborDTO[];
  equipment: PrepEquipmentDTO[];
  supplies: PrepSupplyDTO[];
  rates: PrepRateDTO[];
};

export type PrepStepKind = "work" | "control" | "wait";

export type PrepDurationFixed = {
  mode: "fixed";
  days: number;
  calendar: "working" | "calendar";
  provenance?: string | null;
};

export type PrepDurationComputed = {
  mode: "computed";
  driver_item: string;
  rate_id: string;
  parallel_units?: number;
  rounding?: "ceil_half_day" | "ceil_day" | "none";
};

export type PrepStepDuration = PrepDurationFixed | PrepDurationComputed;

export type PrepWorkflowStepDTO = {
  id: string;
  order: number;
  name: string;
  lot?: string | null;
  kind: PrepStepKind;
  description?: string | null;
  takeoff_ids: string[];
  duration: PrepStepDuration;
  crew: Array<{ labor_id: string; count: number }>;
  equipment: Array<{ equipment_id: string; count: number }>;
  supplies: string[];
  preconditions: string[];
  controls_before_next: string[];
  constraints: string[];
  safety: string[];
  proofs: string[];
  hold_point?: boolean;
  conditional?: { conditions: string[] } | null;
};

export type PrepDependencyType = "FS" | "SS" | "FF";

export type PrepScheduleDepDTO = {
  step_id: string;
  type: PrepDependencyType;
  lag_days?: number;
  lag_calendar?: "working" | "calendar";
};

export type PrepScheduleTaskDTO = {
  step_id: string;
  depends_on: PrepScheduleDepDTO[];
  start_alignment?: "day_start" | null;
  include_in_base?: boolean;
};

export type PrepScheduleCalendarDTO = {
  working_days: number[]; // 1=lun … 7=dim
  holidays: "FR_METROPOLE" | string[] | null;
  granularity_days: number;
};

export type PrepScheduleDTO = {
  start_date: string | null;
  start_date_provenance?: string | null;
  calendar: PrepScheduleCalendarDTO;
  tasks: PrepScheduleTaskDTO[];
  note?: string | null;
};

export const STEP_KIND_LABELS: Record<PrepStepKind, string> = {
  work: "Travaux",
  control: "Contrôle",
  wait: "Attente technique",
};

export const RATE_PER_LABELS: Record<PrepRatePer, string> = {
  engin: "Par engin",
  equipe: "Par équipe",
};
