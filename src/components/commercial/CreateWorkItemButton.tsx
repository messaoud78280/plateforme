"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CreateWorkItemButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/commercial/library/work-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setOpen(false);
      setName("");
      router.refresh();
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
    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nom de l’ouvrage"
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
      />
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
