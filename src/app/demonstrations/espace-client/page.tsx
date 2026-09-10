import type { Metadata } from "next";
import { DemoEspaceClient } from "@/components/demonstrations/DemoEspaceClient";
import { DemoShell } from "@/components/demonstrations/DemoShell";

export const metadata: Metadata = {
  title: "Démo — Espace client",
  description: "Aperçu BeWork d’un espace client privé. Données fictives, sans inscription.",
};

export default function DemoEspaceClientPage() {
  return (
    <DemoShell
      title="Espace client"
      description="Créez un espace privé dans lequel vos clients retrouvent informations, documents ou suivi."
    >
      <DemoEspaceClient />
    </DemoShell>
  );
}
