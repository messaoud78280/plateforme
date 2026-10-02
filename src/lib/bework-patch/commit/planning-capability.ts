/**
 * Ops PLANNING réellement commitables (source de vérité contrat ChatGPT).
 * Toute op absente de cette liste ne doit PAS être exposée dans supported_operations.
 */
export const PLANNING_COMMIT_SUPPORTED_OPS = [
  "update_task",
  "update_duration",
  "update_crew",
  "update_productivity",
  "update_workload",
  "update_dependency",
] as const;

export type PlanningCommitSupportedOp =
  (typeof PLANNING_COMMIT_SUPPORTED_OPS)[number];

export const PLANNING_COMMIT_UNSUPPORTED_OPS = [
  "update_start_date",
  "add_task",
  "remove_task",
  "update_progress",
] as const;

export function isPlanningCommitSupportedOp(
  op: string,
): op is PlanningCommitSupportedOp {
  return (PLANNING_COMMIT_SUPPORTED_OPS as readonly string[]).includes(op);
}
