"use client";

import { Suspense } from "react";
import { ConnexionFormByGate } from "@/components/auth/ConnexionFormByGate";

function GeranteForm() {
  return <ConnexionFormByGate gate="gerante" />;
}

export default function ConnexionGerantePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-100">
          <p className="text-slate-600">Chargement...</p>
        </div>
      }
    >
      <GeranteForm />
    </Suspense>
  );
}
