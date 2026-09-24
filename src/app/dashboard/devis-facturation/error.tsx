"use client";

import { DashboardErrorBoundary } from "@/components/ui/ErrorState";

export default function DevisFacturationError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <DashboardErrorBoundary
      error={error}
      reset={reset}
      title="Erreur — Devis & Facturation"
      description="Cette vue a rencontré un problème. Réessayez ou ouvrez la liste des devis."
      backHref="/dashboard/devis-facturation/devis"
      backLabel="Liste des devis"
    />
  );
}
