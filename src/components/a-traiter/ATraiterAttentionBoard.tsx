"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ATTENTION_CATEGORY_LABELS,
  ATTENTION_URGENCY_ORDER,
  filterAttentionCards,
  groupAttentionCards,
  type ATraiterAttentionCard,
  type AttentionProblemCategory,
  type AttentionSubjectType,
} from "@/lib/a-traiter/attention-board";
import { URGENCY_LABELS, URGENCY_STYLES, type UrgencyLevel } from "@/lib/follow-up/types";
import { FollowUpInlineActions } from "@/components/follow-up/FollowUpInlineActions";
import { cn } from "@/lib/cn";

type Props = {
  cards: ATraiterAttentionCard[];
  currentUserId: string;
  canEdit: boolean;
};

export function ATraiterAttentionBoard({ cards, currentUserId, canEdit }: Props) {
  const [q, setQ] = useState("");
  const [mineOnly, setMineOnly] = useState(false);
  const [urgency, setUrgency] = useState<UrgencyLevel | "all">("all");
  const [assigneeId, setAssigneeId] = useState<string>("all");
  const [clientName, setClientName] = useState<string>("all");
  const [projectTitle, setProjectTitle] = useState<string>("all");
  const [category, setCategory] = useState<AttentionProblemCategory | "all">("all");
  const [subjectType, setSubjectType] = useState<AttentionSubjectType | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const assignees = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of cards) {
      if (c.assigneeId && c.assigneeName) map.set(c.assigneeId, c.assigneeName);
    }
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1], "fr"));
  }, [cards]);

  const clients = useMemo(() => {
    const set = new Set<string>();
    for (const c of cards) if (c.clientName?.trim()) set.add(c.clientName.trim());
    return [...set].sort((a, b) => a.localeCompare(b, "fr"));
  }, [cards]);

  const projects = useMemo(() => {
    const set = new Set<string>();
    for (const c of cards) {
      const t = c.projectTitle?.trim() || c.title.trim();
      if (t) set.add(t);
    }
    return [...set].sort((a, b) => a.localeCompare(b, "fr"));
  }, [cards]);

  const filtered = useMemo(
    () =>
      filterAttentionCards(cards, {
        q,
        mineOnly,
        currentUserId,
        urgency,
        assigneeId,
        clientName,
        projectTitle,
        category,
        subjectType,
      }),
    [
      cards,
      q,
      mineOnly,
      currentUserId,
      urgency,
      assigneeId,
      clientName,
      projectTitle,
      category,
      subjectType,
    ],
  );

  const groups = useMemo(() => groupAttentionCards(filtered), [filtered]);

  if (cards.length === 0) return null;

  return (
    <div className="space-y-4" data-demo-target="a-traiter-board">
      <div className="flex flex-wrap items-end gap-2 rounded-[var(--cc-radius-lg)] border border-[color:var(--cc-border)] bg-white p-3 shadow-[var(--cc-shadow)]">
        <label className="min-w-[140px] flex-1 text-[11px] font-semibold uppercase tracking-wide text-bework-muted">
          Recherche
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Chantier, BC, fournisseur, OS…"
            className="bw-search mt-1"
          />
        </label>
        <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
          Source
          <select
            value={subjectType}
            onChange={(e) => setSubjectType(e.target.value as AttentionSubjectType | "all")}
            className="mt-1 block rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
          >
            <option value="all">Tous</option>
            <option value="FOLLOW_UP">Fiches</option>
            <option value="PURCHASE_ORDER">Commandes</option>
          </select>
        </label>
        <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
          Urgence
          <select
            value={urgency}
            onChange={(e) => setUrgency(e.target.value as UrgencyLevel | "all")}
            className="mt-1 block rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
          >
            <option value="all">Toutes</option>
            {ATTENTION_URGENCY_ORDER.map((u) => (
              <option key={u} value={u}>
                {URGENCY_LABELS[u]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
          Responsable
          <select
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
            className="mt-1 block rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
          >
            <option value="all">Tous</option>
            {assignees.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
          Client
          <select
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            className="mt-1 block max-w-[140px] rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
          >
            <option value="all">Tous</option>
            {clients.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
          Chantier
          <select
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
            className="mt-1 block max-w-[160px] rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
          >
            <option value="all">Tous</option>
            {projects.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
          Type
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as AttentionProblemCategory | "all")}
            className="mt-1 block rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
          >
            <option value="all">Tous</option>
            {(Object.keys(ATTENTION_CATEGORY_LABELS) as AttentionProblemCategory[]).map((k) => (
              <option key={k} value={k}>
                {ATTENTION_CATEGORY_LABELS[k]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-1.5 pb-1.5 text-xs font-medium text-slate-700">
          <input
            type="checkbox"
            checked={mineOnly}
            onChange={(e) => setMineOnly(e.target.checked)}
            className="rounded border-slate-300"
          />
          Mes actions
        </label>
        <p className="ml-auto pb-1.5 text-xs text-slate-600">
          <span className="font-bold text-slate-900">{filtered.length}</span> élément
          {filtered.length === 1 ? "" : "s"}
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-8 text-center text-sm text-slate-600">
          Aucun élément ne correspond à ces filtres.
        </div>
      ) : (
        groups.map((g) => {
          const style = URGENCY_STYLES[g.urgency] ?? URGENCY_STYLES.NORMAL;
          return (
            <section key={g.urgency} className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={cn("h-2.5 w-2.5 rounded-full", style.dot)} aria-hidden />
                <h2 className="text-sm font-bold text-slate-900">{URGENCY_LABELS[g.urgency]}</h2>
                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", style.badge)}>
                  {g.items.length}
                </span>
              </div>
              <ul className="space-y-2">
                {g.items.map((card) => {
                  const key = `${card.subjectType}:${card.subjectId}`;
                  return (
                    <li key={key}>
                      <AttentionCard
                        card={card}
                        canEdit={canEdit}
                        expanded={expandedId === key}
                        onToggleReasons={() =>
                          setExpandedId((id) => (id === key ? null : key))
                        }
                      />
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })
      )}
    </div>
  );
}

function AttentionCard({
  card,
  canEdit,
  expanded,
  onToggleReasons,
}: {
  card: ATraiterAttentionCard;
  canEdit: boolean;
  expanded: boolean;
  onToggleReasons: () => void;
}) {
  const style = URGENCY_STYLES[card.effectiveUrgency] ?? URGENCY_STYLES.NORMAL;
  const ref = card.osNumber
    ? `OS-${card.osNumber}`
    : card.orderNumber
      ? card.orderNumber
      : null;

  return (
    <article
      className={cn(
        "rounded-xl border bg-white p-3.5 shadow-sm sm:p-4",
        style.border,
        "border-l-4",
        style.bar,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-bold", style.badge)}>
              {URGENCY_LABELS[card.effectiveUrgency]}
            </span>
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
              {card.categoryLabel}
            </span>
          </div>
          <h3 className="mt-1.5 text-sm font-bold uppercase tracking-wide text-slate-900">
            {card.title}
          </h3>
          {(ref || card.clientName) && (
            <p className="mt-0.5 text-[11px] text-slate-500">
              {[ref, card.clientName].filter(Boolean).join(" · ")}
            </p>
          )}
          {card.primaryReason ? (
            <p className="mt-2 text-sm font-medium text-slate-800">{card.primaryReason}</p>
          ) : null}
          {card.otherReasonsCount > 0 ? (
            <button
              type="button"
              onClick={onToggleReasons}
              className="mt-1 text-[11px] font-semibold text-[#1e3a5f] hover:underline"
            >
              {expanded
                ? "Masquer les autres points"
                : `+ ${card.otherReasonsCount} autre${card.otherReasonsCount > 1 ? "s" : ""} point${card.otherReasonsCount > 1 ? "s" : ""}`}
            </button>
          ) : null}
          {expanded ? (
            <ul className="mt-1.5 space-y-0.5 text-[11px] text-slate-600">
              {card.attentionItems.slice(1).map((it) => (
                <li key={it.code + it.reason}>· {it.reason}</li>
              ))}
            </ul>
          ) : null}

          <div className="mt-2.5 grid gap-1 text-[11px] text-slate-600 sm:grid-cols-3">
            <p>
              <span className="font-semibold text-slate-500">Prochaine action · </span>
              {card.nextActionDone ? "Terminée" : card.nextAction || "—"}
            </p>
            <p>
              <span className="font-semibold text-slate-500">Responsable · </span>
              {card.assigneeName || "—"}
            </p>
            <p>
              <span className="font-semibold text-slate-500">Échéance · </span>
              {card.dueLabel || "—"}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-2.5">
        <Link
          href={card.actionUrl}
          className="btn-cc-primary !min-h-8 !px-2.5 !text-[11px]"
        >
          {card.actionLabel}
        </Link>
        {card.subjectType === "FOLLOW_UP" ? (
          <Link
            href={`/dashboard/fiches-suivi?view=tableau`}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50"
          >
            Voir dans le tableau
          </Link>
        ) : null}
        {card.subjectType === "PURCHASE_ORDER" &&
        (card.category === "LIVRAISON" ||
          card.category === "RECEPTION" ||
          card.category === "BL") ? (
          <Link
            href={`/dashboard/commandes/${card.subjectId}/reception`}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50"
          >
            Réceptionner
          </Link>
        ) : null}
        {card.subjectType === "PURCHASE_ORDER" && card.supplierMessageUrl ? (
          <Link
            href={card.supplierMessageUrl}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50"
          >
            {card.clientName ? `Message ${card.clientName}` : "Message fournisseur"}
          </Link>
        ) : null}
        {card.relatedAgendaId ? (
          <Link
            href={`/dashboard/agenda?event=${encodeURIComponent(card.relatedAgendaId)}`}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50"
          >
            Voir l’agenda
          </Link>
        ) : null}
        {card.subjectType === "FOLLOW_UP" && card.relatedTaskId ? (
          <Link
            href={`/dashboard/taches/${card.relatedTaskId}`}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50"
          >
            Voir la mission
          </Link>
        ) : null}
        {card.subjectType === "FOLLOW_UP" &&
        canEdit &&
        !card.nextActionDone &&
        card.nextAction ? (
          <FollowUpInlineActions sheetId={card.sheetId} compact />
        ) : null}
      </div>
    </article>
  );
}
