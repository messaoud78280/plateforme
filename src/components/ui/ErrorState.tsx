"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

export function ErrorState({
  title = "Une erreur est survenue",
  description = "Rechargez la page ou réessayez. Si le problème persiste, consultez les logs serveur.",
  digest,
  onRetry,
  backHref,
  backLabel = "Retour",
}: {
  title?: string;
  description?: string;
  digest?: string;
  onRetry?: () => void;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div
      role="alert"
      className="mx-auto flex min-h-[40vh] max-w-lg flex-col items-center justify-center px-4 py-12 text-center"
    >
      <Alert tone="critical" title={title} className="w-full text-left">
        <p>{description}</p>
        {digest ? (
          <p className="mt-2 text-xs opacity-80">
            Référence : <code className="font-mono">{digest}</code>
          </p>
        ) : null}
      </Alert>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {onRetry ? (
          <Button type="button" onClick={onRetry}>
            Réessayer
          </Button>
        ) : null}
        {backHref ? (
          <Link href={backHref} className="btn-cc-secondary">
            {backLabel}
          </Link>
        ) : null}
      </div>
    </div>
  );
}

export function DashboardErrorBoundary({
  error,
  reset,
  title,
  description = "Une erreur inattendue s’est produite. Réessayez ou revenez au tableau de bord.",
  backHref = "/dashboard",
  backLabel = "Tableau de bord",
}: {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
}) {
  useEffect(() => {
    console.error("[Dashboard Error]", error);
  }, [error]);

  return (
    <ErrorState
      title={title}
      description={description}
      digest={error.digest}
      onRetry={reset}
      backHref={backHref}
      backLabel={backLabel}
    />
  );
}
