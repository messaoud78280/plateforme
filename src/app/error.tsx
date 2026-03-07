"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[App Error]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <h1 className="text-xl font-semibold text-slate-800">Une erreur est survenue</h1>
      <p className="mt-2 text-center text-sm text-slate-600">
        Rechargez la page ou consultez les logs serveur (Railway → Deployments → View logs).
        {error.digest && (
          <span className="mt-1 block text-slate-500">Référence : {error.digest}</span>
        )}
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-6 rounded-lg bg-[#1d4ed8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1e40af]"
      >
        Réessayer
      </button>
    </div>
  );
}
