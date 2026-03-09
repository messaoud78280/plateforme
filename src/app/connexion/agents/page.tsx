"use client";

import { Suspense } from "react";
import { ConnexionFormByGate } from "@/components/auth/ConnexionFormByGate";

function AgentsForm() {
  return <ConnexionFormByGate gate="agents" />;
}

export default function ConnexionAgentsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-100">
          <p className="text-slate-600">Chargement...</p>
        </div>
      }
    >
      <AgentsForm />
    </Suspense>
  );
}
