/**
 * Fault injector Schedule V2 — UNIQUEMENT pour tests.
 *
 * Solution retenue (préférée) :
 * - pas de SCHEDULE_V2_TEST_FAIL_AFTER_TASK / variable d’env
 * - hook module-local armé uniquement depuis commit.test.ts via setScheduleV2TestFailAfterTask
 * - en production NODE_ENV=production : armement impossible (throw)
 * - commit.ts appelle maybeThrowScheduleV2TestFault qui no-op si non armé
 *
 * Chemin prod : failAfterTaskIndex reste null → branche morte.
 */

let failAfterTaskIndex: number | null = null;

export function setScheduleV2TestFailAfterTask(index: number | null): void {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Schedule V2 fault injector interdit en production");
  }
  failAfterTaskIndex = index == null ? null : index;
}

/** Appelé dans la TX commit — no-op sauf si un test a armé le hook. */
export function maybeThrowScheduleV2TestFault(taskIndex: number): void {
  if (failAfterTaskIndex == null) return;
  if (process.env.NODE_ENV === "production") return;
  if (failAfterTaskIndex !== taskIndex) return;
  failAfterTaskIndex = null;
  throw Object.assign(new Error("TEST_FORCE_FAIL_AFTER_TASK"), {
    code: "TEST_FORCE_FAIL",
    status: 500,
  });
}
