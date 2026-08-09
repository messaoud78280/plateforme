/**
 * W3-C2B — Orchestration scheduler (pas de logique métier).
 * Déclenche processAttentionEscalations (FollowUp) + processPurchaseOrderAttentionEscalations (CDE-3B2).
 * Un seul lock / un seul cron Railway.
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
import { processPurchaseOrderAttentionEscalations } from "@/lib/purchase-orders/attention/process-escalations";

export type AttentionSchedulerResult = {
  ok: boolean;
  skippedDueToLock: boolean;
  startedAt: string;
  finishedAt: string;
  tenantsProcessed: number;
  sheetsEvaluated: number;
  purchaseOrdersEvaluated: number;
  initialCreated: number;
  remindersCreated: number;
  escalationsCreated: number;
  duplicatesSkipped: number;
  errors: number;
  errorSamples: string[];
};

function merge(acc: ProcessEscalationsResult, part: ProcessEscalationsResult): void {
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
      purchaseOrdersEvaluated: 0,
      initialCreated: 0,
      remindersCreated: 0,
      escalationsCreated: 0,
      duplicatesSkipped: 0,
      errors: 0,
      errorSamples: [],
    };
  }

  const followUpTotals: ProcessEscalationsResult = {
    examined: 0,
    reminded: 0,
    escalated: 0,
    skipped: 0,
    unchanged: 0,
    initialCreated: 0,
    errors: [],
  };
  const poTotals: ProcessEscalationsResult = {
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
    const orgIds = new Set<string | null>();

    const fuOrgs = await prisma.followUpSheet.groupBy({
      by: ["organizationId"],
      where: { status: { notIn: ["TERMINE", "ARCHIVE"] } },
    });
    for (const row of fuOrgs) orgIds.add(row.organizationId);

    const poOrgs = await prisma.purchaseOrder.groupBy({
      by: ["organizationId"],
      where: {
        status: {
          in: [
            "A_VALIDER",
            "VALIDEE",
            "ENVOYEE_FOURNISSEUR",
            "A_CONFIRMER",
            "CONFIRMEE",
            "LIVRAISON_PROGRAMMEE",
            "PARTIELLEMENT_RECUE",
            "REFUSEE",
            "RECUE",
          ],
        },
      },
    });
    for (const row of poOrgs) orgIds.add(row.organizationId);

    for (const organizationId of orgIds) {
      try {
        const fu = await processAttentionEscalations({
          now,
          organizationId,
          take: takePerTenant,
        });
        merge(followUpTotals, fu);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        followUpTotals.errors.push(`tenant-fu:${organizationId ?? "null"}`);
        console.error(`[Attention scheduler] FU tenant ${organizationId ?? "null"}`, msg);
      }

      if (organizationId) {
        try {
          const po = await processPurchaseOrderAttentionEscalations({
            now,
            organizationId,
            take: takePerTenant,
          });
          merge(poTotals, po);
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          poTotals.errors.push(`tenant-po:${organizationId}`);
          console.error(`[Attention scheduler] PO tenant ${organizationId}`, msg);
        }
      }

      tenantsProcessed += 1;
    }
  } finally {
    await releaseAttentionCronLock();
  }

  const finished = new Date();
  const allErrors = [...followUpTotals.errors, ...poTotals.errors];
  const summary: AttentionSchedulerResult = {
    ok: allErrors.length === 0,
    skippedDueToLock: false,
    startedAt: started.toISOString(),
    finishedAt: finished.toISOString(),
    tenantsProcessed,
    sheetsEvaluated: followUpTotals.examined,
    purchaseOrdersEvaluated: poTotals.examined,
    initialCreated: followUpTotals.initialCreated + poTotals.initialCreated,
    remindersCreated: followUpTotals.reminded + poTotals.reminded,
    escalationsCreated: followUpTotals.escalated + poTotals.escalated,
    duplicatesSkipped: followUpTotals.unchanged + poTotals.unchanged,
    errors: allErrors.length,
    errorSamples: allErrors.slice(0, 10),
  };

  console.info(
    JSON.stringify({
      tag: "Attention scheduler",
      followUpsEvaluated: summary.sheetsEvaluated,
      purchaseOrdersEvaluated: summary.purchaseOrdersEvaluated,
      notificationsCreated: summary.initialCreated,
      remindersCreated: summary.remindersCreated,
      escalationsCreated: summary.escalationsCreated,
      skipped: summary.duplicatesSkipped,
      errors: summary.errors,
      ok: summary.ok,
      skippedDueToLock: summary.skippedDueToLock,
      startedAt: summary.startedAt,
      finishedAt: summary.finishedAt,
      tenantsProcessed: summary.tenantsProcessed,
      errorSamples: summary.errorSamples,
    }),
  );

  return summary;
}
