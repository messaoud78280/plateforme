"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createDceFillSessionFromUpload } from "@/app/dashboard/devis/dce-fill-actions";

export function DcePricingFillPanel() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    startTransition(async () => {
      const res = await createDceFillSessionFromUpload(fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSuccess(
        `${res.lineCount} ligne(s) extraites — ${res.matchedCount} rapprochée(s) avec la bibliothèque active.`,
      );
      form.reset();
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="font-heading text-lg font-bold text-slate-900">Nouvelle extraction DCE</h2>
      <p className="text-sm text-slate-600">
        Déposez le DPGF ou BPU du marché (PDF, Excel). L&apos;IA extrait les lignes et les rapproche de la{" "}
        <strong>bibliothèque active</strong>. Configurez <span className="font-mono text-xs">OPENAI_API_KEY</span> pour
        l&apos;extraction structurée ; sinon mode tableau automatique.
      </p>
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">{error}</div>
      ) : null}
      {success ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {success}
        </div>
      ) : null}
      <label className="block text-sm">
        <span className="font-semibold text-slate-800">Titre de la session</span>
        <input
          name="title"
          placeholder="ex. DCE — Lot GO — Mars 2026"
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </label>
      <label className="block text-sm">
        <span className="font-semibold text-slate-800">Type de document cible</span>
        <select name="targetDocType" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
          <option value="dpgf">DPGF</option>
          <option value="bpu">BPU</option>
        </select>
      </label>
      <label className="block text-sm">
        <span className="font-semibold text-slate-800">Fichier DCE (PDF, XLSX…)</span>
        <input
          type="file"
          name="dceFile"
          required
          accept=".pdf,.xlsx,.xls,.ods,.csv,.txt"
          className="mt-1 w-full text-sm"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-[#1e3a5f] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#152a45] disabled:opacity-50"
      >
        {pending ? "Extraction en cours…" : "Extraire et rapprocher"}
      </button>
    </form>
  );
}
