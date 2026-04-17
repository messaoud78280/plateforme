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
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-[#f8f9fb] via-[#eef0f4] to-[#dce2ea] px-4">
          <p className="text-sm font-medium text-black">Chargement…</p>
        </div>
      }
    >
      <AgentsForm />
    </Suspense>
  );
}
