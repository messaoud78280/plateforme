import type { Metadata } from "next";
import { DemoEspaceClient } from "@/components/demonstrations/DemoEspaceClient";
import { DemoShell } from "@/components/demonstrations/DemoShell";
import { demoPageMetadata } from "@/lib/seo-formation-pages";

export const metadata: Metadata = demoPageMetadata(
  "espace-client",
  "Espace client",
  "Créez un espace privé dans lequel vos clients retrouvent informations, documents ou suivi.",
);

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
