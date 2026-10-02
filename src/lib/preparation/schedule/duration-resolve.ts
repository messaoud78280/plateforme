/**
 * Résolution canonique de durée d'une tâche planning.
 * Modes :
 * - fixed / manual → durationDays imposée
 * - computed → qty / (rate × parallelUnits)
 * - computed_workload → workloadPersonDays / crewSize
 *
 * Ne mélange pas les modes. Pas de division automatique crewSize en mode fixed.
 */
import { ceilDay, ceilHalfDay } from "@/lib/preparation/schedule/duration-math";

export type DurationModeResolved =
  | "fixed"
  | "manual"
  | "computed"
  | "computed_workload";

export type ResolveDurationInput = {
  durationMode: string | null | undefined;
  durationDays: number;
  durationLockedByUser?: boolean;
  quantitySnapshot?: number | null;
  rateValue?: number | null;
  parallelUnits?: number | null;
  workloadPersonDays?: number | null;
  crewSize?: number | null;
  rounding?: "ceil_half_day" | "ceil_day" | "none";
};

export type ResolveDurationResult = {
  durationDays: number;
  modeUsed: DurationModeResolved | "unchanged";
  rawDays: number | null;
  warning: string | null;
};

function normalizeMode(raw: string | null | undefined): DurationModeResolved {
  const m = (raw ?? "fixed").toLowerCase();
  if (m === "computed") return "computed";
  if (m === "computed_workload" || m === "workload") return "computed_workload";
  if (m === "manual") return "manual";
  return "fixed";
}

export function resolveTaskDurationDays(
  input: ResolveDurationInput,
): ResolveDurationResult {
  const mode = normalizeMode(input.durationMode);
  const rounding = input.rounding ?? "ceil_half_day";
  const round = (raw: number) =>
    rounding === "none"
      ? raw
      : rounding === "ceil_day"
        ? ceilDay(raw)
        : ceilHalfDay(raw);

  if (input.durationLockedByUser || mode === "fixed" || mode === "manual") {
    return {
      durationDays: input.durationDays,
      modeUsed: mode === "manual" ? "manual" : "fixed",
      rawDays: null,
      warning: null,
    };
  }

  if (mode === "computed") {
    const qty = input.quantitySnapshot;
    const rate = input.rateValue;
    const parallel = Math.max(1, input.parallelUnits ?? 1);
    if (qty == null || qty < 0 || rate == null || rate <= 0) {
      return {
        durationDays: input.durationDays,
        modeUsed: "unchanged",
        rawDays: null,
        warning: "Productivité incomplete — durée conservée",
      };
    }
    const raw = qty / (rate * parallel);
    return {
      durationDays: round(raw),
      modeUsed: "computed",
      rawDays: raw,
      warning: null,
    };
  }

  if (mode === "computed_workload") {
    const wl = input.workloadPersonDays;
    const crew = input.crewSize;
    if (wl == null || wl < 0 || crew == null || crew <= 0) {
      return {
        durationDays: input.durationDays,
        modeUsed: "unchanged",
        rawDays: null,
        warning: "Charge / effectif incomplets — durée conservée",
      };
    }
    const raw = wl / crew;
    return {
      durationDays: round(raw),
      modeUsed: "computed_workload",
      rawDays: raw,
      warning: null,
    };
  }

  return {
    durationDays: input.durationDays,
    modeUsed: "fixed",
    rawDays: null,
    warning: null,
  };
}
