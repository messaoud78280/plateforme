"use client";

import { useMemo, useState } from "react";
import {
  evaluateForwardSafety,
  type ForwardScope,
} from "@/lib/messagerie/forward-safety";

export type ForwardDestOption = {
  id: string;
  kind: "DIRECT" | "TASK" | "PROJECT";
  label: string;
  sublabel?: string;
  scope: ForwardScope;
};

type Props = {
  open: boolean;
  onClose: () => void;
  sourceScope: ForwardScope;
  destinations: ForwardDestOption[];
  onConfirm: (dest: ForwardDestOption, confirmExternal: boolean) => Promise<void>;
};

export function MessageForwardDialog({
  open,
  onClose,
  sourceScope,
  destinations,
  onConfirm,
}: Props) {
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<ForwardDestOption | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return destinations;
    return destinations.filter(
      (d) =>
        d.label.toLowerCase().includes(s) ||
        (d.sublabel ?? "").toLowerCase().includes(s),
    );
  }, [destinations, q]);

  if (!open) return null;

  async function go(dest: ForwardDestOption, confirmExternal: boolean) {
    setBusy(true);
    setError(null);
    try {
      await onConfirm(dest, confirmExternal);
      setPending(null);
      setWarning(null);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Transfert impossible");
    } finally {
      setBusy(false);
    }
  }

  function pick(dest: ForwardDestOption) {
    const safety = evaluateForwardSafety(sourceScope, dest.scope, {
      destLabel: dest.label,
    });
    if (!safety.ok) {
      setError(safety.error);
      return;
    }
    if (safety.needsConfirm) {
      setPending(dest);
      setWarning(safety.warning);
      return;
    }
    void go(dest, false);
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/30 p-4 sm:items-center">
      <button type="button" className="absolute inset-0" aria-label="Fermer" onClick={onClose} />
      <div className="relative z-10 flex max-h-[70vh] w-full max-w-md flex-col rounded-[var(--bw-radius-panel,1.125rem)] border border-slate-200 bg-white shadow-xl">
        <div className="border-b border-slate-100 px-4 py-3">
          <h3 className="text-sm font-semibold text-[#1e3a5f]">Transférer vers…</h3>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher une conversation…"
            className="mt-2 w-full rounded-[var(--bw-radius-control,0.625rem)] border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#1e3a5f]/40"
          />
        </div>
        <ul className="min-h-0 flex-1 overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <li className="px-4 py-6 text-center text-sm text-slate-500">Aucune conversation</li>
          ) : (
            filtered.map((d) => (
              <li key={`${d.kind}:${d.id}`}>
                <button
                  type="button"
                  disabled={busy}
                  className="flex w-full flex-col px-4 py-2.5 text-left hover:bg-slate-50 disabled:opacity-50"
                  onClick={() => pick(d)}
                >
                  <span className="text-[14px] font-medium text-slate-900">{d.label}</span>
                  {d.sublabel ? (
                    <span className="text-[12px] text-slate-500">{d.sublabel}</span>
                  ) : null}
                </button>
              </li>
            ))
          )}
        </ul>
        {error ? (
          <p className="border-t border-red-100 bg-red-50 px-4 py-2 text-[12px] text-red-700">
            {error}
          </p>
        ) : null}
        <div className="border-t border-slate-100 px-4 py-2 text-right">
          <button
            type="button"
            className="rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
            onClick={onClose}
          >
            Annuler
          </button>
        </div>
      </div>

      {pending && warning ? (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-[var(--bw-radius-panel,1.125rem)] bg-white p-5 shadow-xl">
            <p className="text-sm font-semibold text-[#1e3a5f]">Partage hors équipe</p>
            <p className="mt-2 text-[13px] leading-relaxed text-slate-700">{warning}</p>
            <p className="mt-1 text-[12px] text-amber-800">
              Destination : {pending.label}
              {pending.sublabel ? ` · ${pending.sublabel}` : ""}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                onClick={() => {
                  setPending(null);
                  setWarning(null);
                }}
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={busy}
                className="rounded-lg bg-[#1e3a5f] px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                onClick={() => void go(pending, true)}
              >
                Transférer quand même
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
