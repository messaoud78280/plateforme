"use client";

import { DashboardErrorBoundary } from "@/components/ui/ErrorState";

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
    <DashboardErrorBoundary
      error={error}
      reset={reset}
      title="Erreur de chargement du client"
      description={
        isDbError
          ? "Problème de connexion à la base de données. Vérifiez DATABASE_URL sur Railway."
          : "Une erreur inattendue s’est produite lors du chargement de cette fiche client."
      }
      backHref="/dashboard/clients"
      backLabel="Retour aux clients"
    />
  );
}
