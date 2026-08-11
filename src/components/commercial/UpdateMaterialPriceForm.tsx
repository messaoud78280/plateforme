"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const inputClass =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none";

export function UpdateMaterialPriceForm({ materialId }: { materialId: string }) {
  const router = useRouter();
  const [price, setPrice] = useState("");
  const [supplier, setSupplier] = useState("");
  const [source, setSource] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (price.trim() === "") return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/commercial/library/materials/${materialId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPriceHt: Number(price) || 0,
          supplierName: supplier.trim() || null,
          priceSource: source.trim() || "mise à jour",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setPrice("");
      setSupplier("");
      setSource("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
      <h2 className="text-sm font-bold text-[#1e3a5f]">Mettre à jour le prix</h2>
      <div className="grid gap-2 sm:grid-cols-3">
        <input
          type="number"
          step="0.01"
          className={inputClass}
          placeholder="Nouveau prix HT"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <input
          className={inputClass}
          placeholder="Fournisseur"
          value={supplier}
          onChange={(e) => setSupplier(e.target.value)}
        />
        <input
          className={inputClass}
          placeholder="Source"
          value={source}
          onChange={(e) => setSource(e.target.value)}
        />
      </div>
      {error ? <p className="text-xs text-red-700">{error}</p> : null}
      <button
        type="button"
        disabled={busy || !price.trim()}
        onClick={() => void submit()}
        className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
      >
        Enregistrer le prix
      </button>
    </div>
  );
}
