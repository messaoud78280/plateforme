import type { Metadata } from "next";
import { DemoCrm } from "@/components/demonstrations/DemoCrm";
import { DemoShell } from "@/components/demonstrations/DemoShell";
import { demoPageMetadata } from "@/lib/seo-formation-pages";

export const metadata: Metadata = demoPageMetadata(
  "crm",
  "CRM / suivi commercial",
  "Suivez prospects, clients, opportunités et prochaines actions dans votre propre outil.",
);

export default function DemoCrmPage() {
  return (
    <DemoShell
      title="CRM / suivi commercial"
      description="Suivez prospects, clients, opportunités et prochaines actions dans votre propre outil."
    >
      <DemoCrm />
    </DemoShell>
  );
}
