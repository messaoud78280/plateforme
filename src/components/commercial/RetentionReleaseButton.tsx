"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RetentionReleaseButton({ retentionId }: { retentionId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function release() {
    if (
      !confirm(
        "Libérer cette retenue de garantie ? Une facture de libération sera créée pour l’encaissement.",
      )
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/commercial/retentions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "release", id: retentionId }),
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
    <div>
      <button
        type="button"
        disabled={busy}
        onClick={() => void release()}
        className="text-xs font-semibold text-[#1e3a5f] disabled:opacity-50"
      >
        {busy ? "…" : "Libérer"}
      </button>
      {error ? <p className="text-[10px] text-red-600">{error}</p> : null}
    </div>
  );
}
