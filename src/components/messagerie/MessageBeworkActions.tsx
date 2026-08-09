"use client";

import { useEffect, useMemo, useState } from "react";
import type { BeworkActionId, BeworkActionSuggestion } from "@/lib/messagerie/bework-actions";

type Props = {
  messageId: string;
  messageKind: "TASK" | "DIRECT";
  content: string;
  isMe?: boolean;
  agents?: { id: string; name: string }[];
  initialBadges?: string[];
  onLinked?: (badge: string) => void;
};

export function MessageBeworkActions({
  messageId,
  messageKind,
  content,
  isMe,
  agents = [],
  initialBadges = [],
  onLinked,
}: Props) {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<BeworkActionSuggestion[]>([]);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<{
    action: BeworkActionId;
    title: string;
    startAt: string;
    endAt: string;
    allDay: boolean;
    projectTitle: string | null;
    sourceExcerpt: string;
  } | null>(null);
  const [rappelOpen, setRappelOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assigneeId, setAssigneeId] = useState(agents[0]?.id ?? "");
  const [msg, setMsg] = useState<string | null>(
    initialBadges[0] ? `✓ ${initialBadges[0]}` : null,
  );

  useEffect(() => {
    if (!open) return;
    void fetch(`/api/messages/actions?content=${encodeURIComponent(content)}`)
      .then((r) => r.json())
      .then((d) => setSuggestions(Array.isArray(d.suggestions) ? d.suggestions : []));
  }, [open, content]);

  const preferred = useMemo(
    () => suggestions.filter((s) => s.preferred).slice(0, 3),
    [suggestions],
  );
  const others = useMemo(
    () => suggestions.filter((s) => !s.preferred),
    [suggestions],
  );

  async function run(action: BeworkActionId, extra?: Record<string, unknown>) {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/messages/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          sourceMessageKind: messageKind,
          sourceMessageId: messageId,
          ...extra,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "Erreur");
        return;
      }
      if (data.preview) {
        setPreview({
          action,
          title: data.title,
          startAt: data.startAt,
          endAt: data.endAt,
          allDay: data.allDay,
          projectTitle: data.projectTitle,
          sourceExcerpt: data.sourceExcerpt,
        });
        return;
      }
      setOpen(false);
      setPreview(null);
      setRappelOpen(false);
      setAssignOpen(false);
      setMsg(data.badge ? `✓ ${data.badge}` : "OK");
      onLinked?.(data.badge || "Traité");
    } catch {
      setMsg("Erreur réseau");
    } finally {
      setBusy(false);
    }
  }

  function toLocal(iso: string) {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  return (
    <div className={`relative mt-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100 ${open ? "opacity-100" : ""}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
          isMe
            ? "bg-black/5 text-[#008069] hover:bg-black/10"
            : "bg-white/70 text-[#54656f] hover:bg-white"
        }`}
        title="Action BeWork"
      >
        ⚡ Action BeWork
      </button>
      {msg ? (
        <span className={`ml-1 text-[10px] font-semibold ${isMe ? "text-[#008069]" : "text-[#008069]"}`}>
          {msg}
        </span>
      ) : null}

      {open ? (
        <div className="absolute left-0 z-30 mt-1 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
          {preferred.length > 0 ? (
            <div className="mb-1 space-y-0.5">
              <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                Suggéré
              </p>
              {preferred.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    if (s.id === "rappel") setRappelOpen(true);
                    else if (s.id === "assigner") setAssignOpen(true);
                    else void run(s.id);
                  }}
                  className="block w-full rounded-lg px-2 py-1.5 text-left text-xs font-semibold text-slate-800 hover:bg-amber-50"
                >
                  {s.label}
                </button>
              ))}
            </div>
          ) : null}
          <div className="max-h-48 space-y-0.5 overflow-y-auto border-t border-slate-100 pt-1">
            {others.map((s) => (
              <button
                key={s.id}
                type="button"
                disabled={busy}
                onClick={() => {
                  if (s.id === "rappel") setRappelOpen(true);
                  else if (s.id === "assigner") setAssignOpen(true);
                  else void run(s.id);
                }}
                className="block w-full rounded-lg px-2 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50"
              >
                {s.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-1 w-full rounded-lg px-2 py-1 text-[10px] text-slate-400 hover:bg-slate-50"
          >
            Fermer
          </button>
        </div>
      ) : null}

      {rappelOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900">Me rappeler ce message</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {(
                [
                  ["1h", 1],
                  ["Cet après-midi", 4],
                  ["Demain 9h", 24],
                  ["Dans 1 semaine", 168],
                ] as const
              ).map(([label, hours]) => (
                <button
                  key={label}
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    const due = new Date(Date.now() + hours * 60 * 60 * 1000);
                    if (label === "Demain 9h") {
                      due.setDate(due.getDate());
                      due.setHours(9, 0, 0, 0);
                      if (due < new Date()) due.setDate(due.getDate() + 1);
                    }
                    void run("rappel", { confirm: true, dueAt: due.toISOString() });
                  }}
                  className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold"
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setRappelOpen(false)}
              className="mt-3 text-xs text-slate-500"
            >
              Annuler
            </button>
          </div>
        </div>
      ) : null}

      {assignOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900">Assigner ce message</h3>
            {agents.length > 0 ? (
              <label className="mt-3 block space-y-1 text-xs">
                <span className="font-semibold text-slate-600">Responsable</span>
                <select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <p className="mt-2 text-xs text-slate-500">Aucun agent listé — l’action vous sera assignée.</p>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAssignOpen(false)}
                className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-600"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  void run("assigner", {
                    confirm: true,
                    assigneeId: assigneeId || undefined,
                    dueAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
                    priority: "IMPORTANT",
                  })
                }
                className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-xs font-bold text-white"
              >
                Assigner
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {preview ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900">Valider l’action</h3>
            <p className="mt-1 text-xs text-slate-500">Prérempli depuis le message — contrôlez puis validez.</p>
            <label className="mt-3 block space-y-1 text-xs">
              <span className="font-semibold text-slate-600">Titre</span>
              <input
                value={preview.title}
                onChange={(e) => setPreview({ ...preview, title: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="mt-2 block space-y-1 text-xs">
              <span className="font-semibold text-slate-600">Début</span>
              <input
                type="datetime-local"
                value={toLocal(preview.startAt)}
                onChange={(e) =>
                  setPreview({
                    ...preview,
                    startAt: new Date(e.target.value).toISOString(),
                    endAt: new Date(new Date(e.target.value).getTime() + 3600000).toISOString(),
                  })
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            {preview.projectTitle ? (
              <p className="mt-2 text-xs text-slate-600">
                Chantier : <span className="font-semibold">{preview.projectTitle}</span>
              </p>
            ) : null}
            <p className="mt-2 line-clamp-3 rounded-lg bg-slate-50 p-2 text-[11px] text-slate-500">
              {preview.sourceExcerpt}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPreview(null)}
                className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-600"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  void run(preview.action, {
                    confirm: true,
                    title: preview.title,
                    startAt: preview.startAt,
                    endAt: preview.endAt,
                    allDay: preview.allDay,
                  })
                }
                className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-xs font-bold text-white"
              >
                Valider
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
