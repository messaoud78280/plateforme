"use client";

/**
 * Actions démo legacy — préférer la fiche PurchaseOrder (/dashboard/commandes/[id]).
 * Conservé pour compatibilité liens éventuels.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";

export function SupplierOrderActions({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function run(action: "confirm" | "propose") {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch(`/api/purchase-orders/${orderId}/supplier`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          action === "confirm"
            ? { action: "confirm" }
            : {
                action: "propose",
                proposedDeliveryAt: new Date(2026, 7, 11, 9, 0, 0, 0).toISOString(),
                comment: "Notre camion ne peut pas être sur site avant 9h.",
              },
        ),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error ?? "Erreur");
      } else {
        setMsg(
          action === "confirm"
            ? "Livraison confirmée — l’entreprise a été notifiée."
            : "Proposition 09:00 envoyée — en attente de validation.",
        );
        router.refresh();
      }
    } catch {
      setMsg("Erreur de connexion");
    }
    setBusy(false);
  }

  return (
    <div className="mt-2 space-y-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void run("confirm")}
          className="rounded-lg bg-[#1d4ed8] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
        >
          Confirmer la livraison
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void run("propose")}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
        >
          Proposer 09:00
        </button>
      </div>
      {msg ? <p className="text-xs text-emerald-700">{msg}</p> : null}
    </div>
  );
}
