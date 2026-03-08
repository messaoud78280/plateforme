"use client";

import Link from "next/link";

export default function ClientDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isDbError =
    error.message?.includes("DATABASE") ||
    error.message?.includes("Connection") ||
    error.message?.includes("ECONNREFUSED") ||
    error.message?.includes("connect");

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-8">
      <h2 className="text-lg font-semibold text-slate-800">Erreur de chargement du client</h2>
      <p className="mt-2 max-w-md text-center text-sm text-slate-600">
        {isDbError
          ? "Problème de connexion à la base de données. Vérifiez sur Railway : Variables → DATABASE_URL (ou DIRECT_URL)."
          : "Une erreur inattendue s'est produite."}
      </p>
      {error.message && (
        <p className="mt-2 max-w-lg break-words rounded bg-slate-100 px-3 py-2 text-xs text-slate-600">
          {error.message}
        </p>
      )}
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-[#1d4ed8] px-4 py-2 text-sm font-medium text-white hover:bg-[#1e40af]"
        >
          Réessayer
        </button>
        <Link
          href="/dashboard/clients"
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Retour aux clients
        </Link>
      </div>
    </div>
  );
}
