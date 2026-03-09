"use client";

import { Suspense } from "react";
import { ConnexionFormByGate } from "@/components/auth/ConnexionFormByGate";

function ClientsForm() {
  return <ConnexionFormByGate gate="clients" />;
}

export default function ConnexionClientsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-100">
          <p className="text-slate-600">Chargement...</p>
        </div>
      }
    >
      <ClientsForm />
    </Suspense>
  );
}
