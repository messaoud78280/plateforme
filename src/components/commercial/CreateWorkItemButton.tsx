"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CreateWorkItemButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<"SIMPLE" | "COMPOSITE">("SIMPLE");
  const [unitSellHt, setUnitSellHt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        name: name.trim(),
        kind,
      };
      if (kind === "SIMPLE" && unitSellHt.trim() !== "") {
        body.unitSellHt = Number(unitSellHt) || 0;
        body.sellMode = "FIXED_SELL";
      }
      const res = await fetch("/api/commercial/library/work-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      const id = data.workItem?.id as string | undefined;
      setOpen(false);
      setName("");
      setKind("SIMPLE");
      setUnitSellHt("");
      if (id) {
        router.push(`/dashboard/devis-facturation/bibliotheque/${id}`);
      } else {
        router.refresh();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-xl bg-[#1e3a5f] px-4 py-2.5 text-sm font-bold text-white"
      >
        + Nouvel ouvrage
      </button>
    );
  }

  return (
    <div className="min-w-[16rem] space-y-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nom de l’ouvrage"
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
      />
      <select
        value={kind}
        onChange={(e) => setKind(e.target.value as "SIMPLE" | "COMPOSITE")}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
      >
        <option value="SIMPLE">Simple — prix direct</option>
        <option value="COMPOSITE">Composé — sous-détail</option>
      </select>
      {kind === "SIMPLE" ? (
        <input
          type="number"
          step="0.01"
          value={unitSellHt}
          onChange={(e) => setUnitSellHt(e.target.value)}
          placeholder="Prix de vente HT (optionnel)"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      ) : null}
      {error ? <p className="text-xs text-red-700">{error}</p> : null}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void submit()}
          className="rounded-lg bg-[#1e3a5f] px-3 py-2 text-xs font-bold text-white"
        >
          Créer
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}
