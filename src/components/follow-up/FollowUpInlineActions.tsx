"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

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
      if (res.ok) {
        setMsg("OK");
        router.refresh();
      } else {
        setMsg("Erreur");
      }
    } catch {
      setMsg("Erreur");
    } finally {
      setBusy(false);
      setOpen(false);
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
      {msg ? <span className="text-[10px] text-slate-500">{msg}</span> : null}
    </div>
  );
}
