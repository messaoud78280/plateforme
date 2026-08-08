/**
 * W3-C2B — Orchestration scheduler (pas de logique métier).
 * Déclenche uniquement processAttentionEscalations par tenant.
 */
import { prisma } from "@/lib/prisma";
import {
  releaseAttentionCronLock,
  tryAcquireAttentionCronLock,
} from "@/lib/follow-up/attention/cron-lock";
import {
  processAttentionEscalations,
  type ProcessEscalationsResult,
} from "@/lib/follow-up/attention/process-escalations";

export type AttentionSchedulerResult = {
  ok: boolean;
  skippedDueToLock: boolean;
  startedAt: string;
  finishedAt: string;
  tenantsProcessed: number;
  sheetsEvaluated: number;
  initialCreated: number;
  remindersCreated: number;
  escalationsCreated: number;
  duplicatesSkipped: number;
  errors: number;
  errorSamples: string[];
};

function merge(
  acc: ProcessEscalationsResult,
  part: ProcessEscalationsResult,
): void {
  acc.examined += part.examined;
  acc.reminded += part.reminded;
  acc.escalated += part.escalated;
  acc.skipped += part.skipped;
  acc.unchanged += part.unchanged;
  acc.initialCreated += part.initialCreated;
  acc.errors.push(...part.errors);
}

/**
 * Job horaire : now réel attendu (le cron ne passe jamais de date simulée).
 */
export async function runAttentionEscalationScheduler(opts?: {
  now?: Date;
  takePerTenant?: number;
}): Promise<AttentionSchedulerResult> {
  const started = new Date();
  const now = opts?.now ?? new Date();
  const takePerTenant = opts?.takePerTenant ?? 400;

  const lock = await tryAcquireAttentionCronLock();
  if (!lock.acquired) {
    const finished = new Date();
    console.info(
      JSON.stringify({
        tag: "Attention scheduler",
        skippedDueToLock: true,
        startedAt: started.toISOString(),
        finishedAt: finished.toISOString(),
      }),
    );
    return {
      ok: true,
      skippedDueToLock: true,
      startedAt: started.toISOString(),
      finishedAt: finished.toISOString(),
      tenantsProcessed: 0,
      sheetsEvaluated: 0,
      initialCreated: 0,
      remindersCreated: 0,
      escalationsCreated: 0,
      duplicatesSkipped: 0,
      errors: 0,
      errorSamples: [],
    };
  }

  const totals: ProcessEscalationsResult = {
    examined: 0,
    reminded: 0,
    escalated: 0,
    skipped: 0,
    unchanged: 0,
    initialCreated: 0,
    errors: [],
  };
  let tenantsProcessed = 0;

  try {
    const orgRows = await prisma.followUpSheet.groupBy({
      by: ["organizationId"],
      where: { status: { notIn: ["TERMINE", "ARCHIVE"] } },
    });

    for (const row of orgRows) {
      try {
        const part = await processAttentionEscalations({
          now,
          organizationId: row.organizationId,
          take: takePerTenant,
        });
        merge(totals, part);
        tenantsProcessed += 1;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        totals.errors.push(`tenant:${row.organizationId ?? "null"}`);
        console.error(
          `[Attention scheduler] tenant ${row.organizationId ?? "null"}`,
          msg,
        );
        tenantsProcessed += 1;
      }
    }
  } finally {
    await releaseAttentionCronLock();
  }

  const finished = new Date();
  const summary: AttentionSchedulerResult = {
    ok: totals.errors.length === 0,
    skippedDueToLock: false,
    startedAt: started.toISOString(),
    finishedAt: finished.toISOString(),
    tenantsProcessed,
    sheetsEvaluated: totals.examined,
    initialCreated: totals.initialCreated,
    remindersCreated: totals.reminded,
    escalationsCreated: totals.escalated,
    duplicatesSkipped: totals.unchanged,
    errors: totals.errors.length,
    errorSamples: totals.errors.slice(0, 10),
  };

  console.info(
    JSON.stringify({
      tag: "Attention scheduler",
      ...summary,
    }),
  );

  return summary;
}
