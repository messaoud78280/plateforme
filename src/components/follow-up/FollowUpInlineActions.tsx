"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { QUICK_STATUS_TRANSITIONS } from "@/lib/follow-up/types";

type Suggestion = { label: string; nextStatus?: string; dueInDays: number };

/** Actions immédiates sur une fiche depuis À traiter / notifications */
export function FollowUpInlineActions({
  sheetId,
  compact,
}: {
  sheetId: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function run(payload: Record<string, unknown>) {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/follow-up/${sheetId}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        if (payload.action === "done" && data.needsNextAction && Array.isArray(data.suggestions)) {
          setSuggestions(data.suggestions);
          setMsg("Choisir la suite");
        } else {
          setSuggestions(null);
          setMsg("OK");
          router.refresh();
        }
      } else {
        setMsg("Erreur");
      }
    } catch {
      setMsg("Erreur");
    } finally {
      setBusy(false);
      setOpen(false);
      setStatusOpen(false);
    }
  }

  async function pickSuggestion(s: Suggestion) {
    const due = new Date();
    due.setDate(due.getDate() + (s.dueInDays ?? 1));
    due.setHours(9, 0, 0, 0);
    setBusy(true);
    try {
      const res = await fetch(`/api/follow-up/${sheetId}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "set_next",
          nextAction: s.label,
          nextActionAt: due.toISOString(),
        }),
      });
      if (res.ok && s.nextStatus) {
        await fetch(`/api/follow-up/${sheetId}/actions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "quick_status", status: s.nextStatus }),
        });
      }
      if (res.ok) {
        setSuggestions(null);
        setMsg("OK");
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={`flex flex-wrap items-center gap-1.5 ${compact ? "" : "mt-2"}`}
      onClick={(e) => e.preventDefault()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        disabled={busy}
        onClick={() => void run({ action: "done" })}
        className="rounded-md bg-emerald-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        Fait
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => setOpen((v) => !v)}
        className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-slate-700 hover:bg-slate-50"
      >
        Reporter
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => setStatusOpen((v) => !v)}
        className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-slate-700 hover:bg-slate-50"
      >
        Statut
      </button>
      <Link
        href={`/dashboard/fiches-suivi/${sheetId}`}
        className="rounded-md px-2 py-1 text-[10px] font-bold text-[#1e3a5f] hover:underline"
      >
        Voir
      </Link>
      {open ? (
        <div className="flex w-full flex-wrap gap-1 pt-1">
          {(
            [
              ["tomorrow", "Demain"],
              ["2days", "2 jours"],
              ["1week", "1 semaine"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              disabled={busy}
              onClick={() => void run({ action: "postpone", postpone: k })}
              className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold"
            >
              {label}
            </button>
          ))}
        </div>
      ) : null}
      {statusOpen ? (
        <div className="flex w-full flex-wrap gap-1 pt-1">
          {QUICK_STATUS_TRANSITIONS.map((t) => (
            <button
              key={t.status}
              type="button"
              disabled={busy}
              onClick={() => void run({ action: "quick_status", status: t.status })}
              className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold"
            >
              {t.label}
            </button>
          ))}
        </div>
      ) : null}
      {suggestions ? (
        <div className="w-full space-y-1 rounded-lg border border-emerald-100 bg-emerald-50/50 p-2">
          <p className="text-[10px] font-bold text-emerald-900">Prochaine action ?</p>
          <div className="flex flex-wrap gap-1">
            {suggestions.map((s) => (
              <button
                key={s.label}
                type="button"
                disabled={busy}
                onClick={() => void pickSuggestion(s)}
                className="rounded-md bg-white px-2 py-1 text-[10px] font-semibold text-slate-800 shadow-sm ring-1 ring-slate-200"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {msg && !suggestions ? <span className="text-[10px] text-slate-500">{msg}</span> : null}
    </div>
  );
}
