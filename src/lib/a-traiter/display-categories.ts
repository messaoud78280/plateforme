/**
 * ATTENTION-UI-2 — Agrégation présentation « À traiter » (dashboard + filtres).
 * Ne modifie pas le moteur Attention : pure classification / synthèse UI.
 */
import type { ATraiterAttentionCard } from "@/lib/a-traiter/attention-board";
import { urgencyRank } from "@/lib/follow-up/urgency";
import type { UrgencyLevel } from "@/lib/follow-up/types";

export type AttentionDisplayCategoryId =
  | "annual_contract"
  | "purchase_order"
  | "billing"
  | "tasks_followup"
  | "other";

export type AttentionDisplayCategoryMeta = {
  id: AttentionDisplayCategoryId;
  label: string;
  /** Query ?type= */
  typeParam: string;
  shortHint: string;
};

export const ATTENTION_DISPLAY_CATEGORIES: Record<
  AttentionDisplayCategoryId,
  AttentionDisplayCategoryMeta
> = {
  annual_contract: {
    id: "annual_contract",
    label: "Contrats annuels",
    typeParam: "annual-contract",
    shortHint: "Interventions à préparer ou en retard",
  },
  purchase_order: {
    id: "purchase_order",
    label: "Commandes & livraisons",
    typeParam: "purchase-order",
    shortHint: "Confirmations et livraisons à suivre",
  },
  billing: {
    id: "billing",
    label: "Facturation",
    typeParam: "billing",
    shortHint: "Dossiers à préparer",
  },
  tasks_followup: {
    id: "tasks_followup",
    label: "Tâches & suivi",
    typeParam: "tasks-followup",
    shortHint: "Actions opérationnelles",
  },
  other: {
    id: "other",
    label: "Autres",
    typeParam: "other",
    shortHint: "Autres priorités",
  },
};

const TYPE_PARAM_TO_ID: Record<string, AttentionDisplayCategoryId> = {
  "annual-contract": "annual_contract",
  "purchase-order": "purchase_order",
  billing: "billing",
  "tasks-followup": "tasks_followup",
  other: "other",
};

export function parseAttentionDisplayTypeParam(
  raw: string | null | undefined,
): AttentionDisplayCategoryId | "all" {
  if (!raw) return "all";
  return TYPE_PARAM_TO_ID[raw] ?? "all";
}

/**
 * Une carte → une catégorie de présentation (pas de double comptage).
 * Priorité structurée : FACTURATION → ANNUAL_CONTRACT → PURCHASE_ORDER → FOLLOW_UP.
 */
export function getAttentionDisplayCategory(
  card: Pick<ATraiterAttentionCard, "subjectType" | "category">,
): AttentionDisplayCategoryId {
  if (card.category === "FACTURATION") return "billing";
  if (card.subjectType === "ANNUAL_CONTRACT") return "annual_contract";
  if (card.subjectType === "PURCHASE_ORDER") return "purchase_order";
  if (card.subjectType === "FOLLOW_UP") return "tasks_followup";
  return "other";
}

export type AttentionDisplayCategorySummary = {
  id: AttentionDisplayCategoryId;
  label: string;
  typeParam: string;
  count: number;
  maxUrgency: UrgencyLevel;
  critique: number;
  urgent: number;
  important: number;
  aSurveiller: number;
  overdue: number;
  earliestDueAt: string | null;
  gravitySummary: string;
  shortHint: string;
  href: string;
};

function formatGravitySummary(s: AttentionDisplayCategorySummary): string {
  const parts: string[] = [];
  if (s.critique > 0) {
    parts.push(`${s.critique} critique${s.critique > 1 ? "s" : ""}`);
  }
  if (s.urgent > 0) {
    parts.push(`${s.urgent} urgente${s.urgent > 1 ? "s" : ""}`);
  }
  if (s.important > 0 && parts.length < 2) {
    parts.push(`${s.important} importante${s.important > 1 ? "s" : ""}`);
  }
  if (s.overdue > 0 && parts.length < 2) {
    parts.push(`${s.overdue} en retard`);
  }
  if (parts.length === 0 && s.aSurveiller > 0) {
    parts.push(`${s.aSurveiller} à surveiller`);
  }
  return parts.join(" · ");
}

function isOverdueCard(card: ATraiterAttentionCard): boolean {
  return card.attentionItems.some(
    (i) => i.code === "DUE_OVERDUE" || i.code === "DELIVERY_OVERDUE",
  );
}

/** Agrège les cartes visibles (déjà filtrées ACL) — max `limit` catégories non vides. */
export function buildAttentionDisplayCategories(
  cards: ATraiterAttentionCard[],
  opts?: { limit?: number; baseHref?: string },
): AttentionDisplayCategorySummary[] {
  const limit = opts?.limit ?? 4;
  const baseHref = opts?.baseHref ?? "/dashboard/a-traiter";

  const buckets = new Map<
    AttentionDisplayCategoryId,
    {
      cards: ATraiterAttentionCard[];
      critique: number;
      urgent: number;
      important: number;
      aSurveiller: number;
      overdue: number;
      earliestDueAt: string | null;
      maxUrgency: UrgencyLevel;
    }
  >();

  for (const card of cards) {
    const id = getAttentionDisplayCategory(card);
    let b = buckets.get(id);
    if (!b) {
      b = {
        cards: [],
        critique: 0,
        urgent: 0,
        important: 0,
        aSurveiller: 0,
        overdue: 0,
        earliestDueAt: null,
        maxUrgency: "A_SURVEILLER",
      };
      buckets.set(id, b);
    }
    b.cards.push(card);
    if (card.effectiveUrgency === "CRITIQUE") b.critique += 1;
    else if (card.effectiveUrgency === "URGENT") b.urgent += 1;
    else if (card.effectiveUrgency === "IMPORTANT") b.important += 1;
    else b.aSurveiller += 1;
    if (isOverdueCard(card)) b.overdue += 1;
    if (urgencyRank(card.effectiveUrgency) > urgencyRank(b.maxUrgency)) {
      b.maxUrgency = card.effectiveUrgency;
    }
    if (card.nextActionAt) {
      if (!b.earliestDueAt || card.nextActionAt < b.earliestDueAt) {
        b.earliestDueAt = card.nextActionAt;
      }
    }
  }

  const summaries: AttentionDisplayCategorySummary[] = [];
  for (const [id, b] of buckets) {
    if (b.cards.length === 0) continue;
    const meta = ATTENTION_DISPLAY_CATEGORIES[id];
    const summary: AttentionDisplayCategorySummary = {
      id,
      label: meta.label,
      typeParam: meta.typeParam,
      count: b.cards.length,
      maxUrgency: b.maxUrgency,
      critique: b.critique,
      urgent: b.urgent,
      important: b.important,
      aSurveiller: b.aSurveiller,
      overdue: b.overdue,
      earliestDueAt: b.earliestDueAt,
      gravitySummary: "",
      shortHint: meta.shortHint,
      href: `${baseHref}?type=${encodeURIComponent(meta.typeParam)}`,
    };
    summary.gravitySummary = formatGravitySummary(summary);
    summaries.push(summary);
  }

  summaries.sort((a, b) => {
    const ur = urgencyRank(b.maxUrgency) - urgencyRank(a.maxUrgency);
    if (ur !== 0) return ur;
    if (a.overdue !== b.overdue) return b.overdue - a.overdue;
    const da = a.earliestDueAt ? new Date(a.earliestDueAt).getTime() : Number.POSITIVE_INFINITY;
    const db = b.earliestDueAt ? new Date(b.earliestDueAt).getTime() : Number.POSITIVE_INFINITY;
    if (da !== db) return da - db;
    return b.count - a.count;
  });

  return summaries.slice(0, limit);
}

export function filterCardsByDisplayCategory(
  cards: ATraiterAttentionCard[],
  displayCategory: AttentionDisplayCategoryId | "all",
): ATraiterAttentionCard[] {
  if (displayCategory === "all") return cards;
  return cards.filter((c) => getAttentionDisplayCategory(c) === displayCategory);
}
