import type { Metadata } from "next";
import { DemoCrm } from "@/components/demonstrations/DemoCrm";
import { DemoShell } from "@/components/demonstrations/DemoShell";

export const metadata: Metadata = {
  title: "Démo — CRM / suivi commercial",
  description: "Démonstration BeWork d’un suivi prospects et opportunités. Données fictives.",
};

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
