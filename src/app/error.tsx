"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ui/ErrorState";

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
    <ErrorState
      digest={error.digest}
      onRetry={reset}
      backHref="/"
      backLabel="Accueil"
      description="Rechargez la page ou consultez les logs serveur si le problème persiste."
    />
  );
}
