"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AmendmentActions({
  amendmentId,
  status,
}: {
  amendmentId: string;
  status: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/commercial/amendments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, amendmentId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function addLine() {
    const designation = prompt("Désignation", "Travaux complémentaires");
    if (!designation?.trim()) return;
    const amount = prompt("Montant unitaire HT", "1000");
    if (!amount) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/commercial/amendments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "addLine",
          amendmentId,
          designation: designation.trim(),
          quantity: 1,
          unitSellHt: Number(amount),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status === "DRAFT" ? (
        <>
          <button
            type="button"
            disabled={busy}
            onClick={() => void addLine()}
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold"
          >
            + Ligne
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void run("toValidate")}
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold"
          >
            Soumettre à validation
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void run("send")}
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold"
          >
            Marquer envoyé
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void run("accept")}
            className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white"
          >
            Accepter
          </button>
        </>
      ) : null}
      {status === "TO_VALIDATE" ? (
        <>
          <button
            type="button"
            disabled={busy}
            onClick={() => void run("reopenDraft")}
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold"
          >
            Retour brouillon
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void run("send")}
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold"
          >
            Marquer envoyé
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void run("accept")}
            className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white"
          >
            Accepter
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void run("refuse")}
            className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-800"
          >
            Refuser
          </button>
        </>
      ) : null}
      {status === "SENT" ? (
        <>
          <button
            type="button"
            disabled={busy}
            onClick={() => void run("accept")}
            className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white"
          >
            Accepter
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void run("refuse")}
            className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-800"
          >
            Refuser
          </button>
        </>
      ) : null}
      {error ? <p className="w-full text-xs text-red-700">{error}</p> : null}
    </div>
  );
}
