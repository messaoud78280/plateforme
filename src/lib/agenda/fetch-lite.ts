/**
 * Chargement agenda sans troncature silencieuse (vue Année / lite).
 * Pagination interne par lots — une seule plage from/to, pas 12 requêtes mois.
 */

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { agendaEventLiteInclude } from "@/lib/agenda/access";

/** Lot raisonnable pour projection lite (marqueurs + résumé). */
export const AGENDA_LITE_BATCH = 1000;

/**
 * Garde-fou anti-abus / timeout — au-delà, on signale incomplete.
 * Une PME BTP dépasse rarement ce volume annuel.
 */
export const AGENDA_LITE_HARD_CAP = 20_000;

export type LiteFetchResult<T> = {
  rows: T[];
  complete: boolean;
  fetched: number;
};

type LiteRow = Prisma.AgendaEventGetPayload<{ include: typeof agendaEventLiteInclude }>;

/**
 * Charge tous les AgendaEvent de la plage (projection lite), par lots.
 * Curseur sur id + orderBy startAt/id — pas de skip offset coûteux, pas de plafond 800.
 */
export async function fetchAllAgendaEventsLite(
  where: Prisma.AgendaEventWhereInput,
): Promise<LiteFetchResult<LiteRow>> {
  const rows: LiteRow[] = [];
  let cursorId: string | undefined;

  while (rows.length < AGENDA_LITE_HARD_CAP) {
    const batch = await prisma.agendaEvent.findMany({
      where,
      include: agendaEventLiteInclude,
      orderBy: [{ startAt: "asc" }, { id: "asc" }],
      take: AGENDA_LITE_BATCH,
      ...(cursorId
        ? {
            skip: 1,
            cursor: { id: cursorId },
          }
        : {}),
    });
    if (batch.length === 0) {
      return { rows, complete: true, fetched: rows.length };
    }
    rows.push(...batch);
    cursorId = batch[batch.length - 1]!.id;
    if (batch.length < AGENDA_LITE_BATCH) {
      return { rows, complete: true, fetched: rows.length };
    }
    if (rows.length >= AGENDA_LITE_HARD_CAP) {
      return {
        rows: rows.slice(0, AGENDA_LITE_HARD_CAP),
        complete: false,
        fetched: AGENDA_LITE_HARD_CAP,
      };
    }
  }

  return { rows, complete: false, fetched: rows.length };
}

/** Décide si un résumé période peut être affiché comme complet. */
export function canTrustPeriodSummary(meta: { complete?: boolean } | null | undefined): boolean {
  return meta?.complete !== false;
}
