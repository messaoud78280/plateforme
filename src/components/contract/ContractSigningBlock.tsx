"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ContractSigningBlock() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAccept() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/contract/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur lors de l'acceptation.");
        setLoading(false);
        return;
      }

      if (data.signed) {
        router.refresh();
      }
    } catch {
      setError("Erreur de connexion.");
    }
    setLoading(false);
  }

  return (
    <div className="mt-6 flex flex-col items-start gap-4 border-t border-[#e2e8f0] pt-6">
      <button
        type="button"
        onClick={handleAccept}
        disabled={loading}
        className="rounded-lg bg-[#1d4ed8] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#1e40af] disabled:opacity-50"
      >
        {loading ? "Enregistrement…" : "J'accepte le contrat"}
      </button>
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
