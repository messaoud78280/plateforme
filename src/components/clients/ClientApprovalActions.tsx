"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  clientId: string;
  clientName: string;
  accountStatus: "PENDING_APPROVAL" | "APPROVED" | "REJECTED";
};

export function ClientApprovalActions({ clientId, clientName, accountStatus }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState("");

  async function run(action: "approve" | "reject") {
    setLoading(action);
    setError("");
    try {
      const res = await fetch(`/api/clients/${clientId}/${action}`, { method: "POST" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Action impossible.");
        return;
      }
      router.refresh();
    } catch {
      setError("Erreur réseau.");
    } finally {
      setLoading(null);
    }
  }

  if (accountStatus === "APPROVED") {
    return <span className="text-xs font-medium text-emerald-700">Compte validé</span>;
  }

  if (accountStatus === "REJECTED") {
    return <span className="text-xs font-medium text-red-700">Inscription refusée</span>;
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          disabled={loading !== null}
          onClick={() => void run("approve")}
          className="inline-flex items-center rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading === "approve" ? "…" : "Valider"}
        </button>
        <button
          type="button"
          disabled={loading !== null}
          onClick={() => {
            if (
              !window.confirm(
                `Refuser l'inscription de ${clientName} ? Le client ne pourra plus se connecter.`
              )
            ) {
              return;
            }
            void run("reject");
          }}
          className="inline-flex items-center rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-700 shadow-sm transition hover:bg-red-50 disabled:opacity-50"
        >
          {loading === "reject" ? "…" : "Refuser"}
        </button>
      </div>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
