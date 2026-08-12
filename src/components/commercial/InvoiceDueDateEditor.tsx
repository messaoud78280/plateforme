"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { computeDueDateFromTerms } from "@/lib/commercial/invoice-status";

const TERMS: { id: Parameters<typeof computeDueDateFromTerms>[1]; label: string }[] = [
  { id: "COMPTANT", label: "Comptant" },
  { id: "J15", label: "15 jours" },
  { id: "J30", label: "30 jours" },
  { id: "J45", label: "45 jours" },
  { id: "J30_FDM", label: "30 jours fin de mois" },
  { id: "J45_FDM", label: "45 jours fin de mois" },
  { id: "CUSTOM", label: "Date personnalisée" },
];

/** Saisie / modification de l’échéance (date stockée explicitement). */
export function InvoiceDueDateEditor({
  invoiceId,
  issueDate,
  dueDate,
  locked,
}: {
  invoiceId: string;
  issueDate: string | Date;
  dueDate: string | Date | null;
  locked?: boolean;
}) {
  const router = useRouter();
  const [terms, setTerms] = useState<(typeof TERMS)[number]["id"]>("J30");
  const [custom, setCustom] = useState(
    dueDate ? new Date(dueDate).toISOString().slice(0, 10) : "",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  if (locked) {
    return dueDate ? (
      <p className="text-xs text-slate-500">
        Échéance · {new Date(dueDate).toLocaleDateString("fr-FR")}
      </p>
    ) : null;
  }

  async function save() {
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      const issue = new Date(issueDate);
      const next =
        terms === "CUSTOM"
          ? custom
            ? new Date(custom)
            : null
          : computeDueDateFromTerms(issue, terms);
      const res = await fetch(`/api/commercial/invoices/${invoiceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dueDate: next ? next.toISOString().slice(0, 10) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setMsg(
        next
          ? `Échéance enregistrée : ${next.toLocaleDateString("fr-FR")}`
          : "Échéance effacée",
      );
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
        Conditions de règlement → échéance
      </p>
      <div className="flex flex-wrap gap-2">
        <select
          value={terms}
          onChange={(e) =>
            setTerms(e.target.value as (typeof TERMS)[number]["id"])
          }
          className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs"
        >
          {TERMS.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
        {terms === "CUSTOM" ? (
          <input
            type="date"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs"
          />
        ) : null}
        <button
          type="button"
          disabled={busy}
          onClick={() => void save()}
          className="rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
        >
          {busy ? "…" : "Enregistrer l’échéance"}
        </button>
      </div>
      {dueDate ? (
        <p className="text-xs text-slate-600">
          Actuelle :{" "}
          <strong>{new Date(dueDate).toLocaleDateString("fr-FR")}</strong>
        </p>
      ) : (
        <p className="text-xs text-slate-500">
          Sans échéance : J+30 à l’émission.
        </p>
      )}
      {error ? <p className="text-xs text-red-700">{error}</p> : null}
      {msg ? <p className="text-xs text-emerald-700">{msg}</p> : null}
    </div>
  );
}
