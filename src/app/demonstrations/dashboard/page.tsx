import type { Metadata } from "next";
import { DemoDashboard } from "@/components/demonstrations/DemoDashboard";
import { DemoShell } from "@/components/demonstrations/DemoShell";

export const metadata: Metadata = {
  title: "Démo — Tableau de bord",
  description: "Démonstration BeWork d’un tableau de bord d’activité. Données fictives.",
};

export default function DemoDashboardPage() {
  return (
    <DemoShell
      title="Tableau de bord"
      description="Transformez vos données en une interface claire pour suivre votre activité."
    >
      <DemoDashboard />
    </DemoShell>
  );
}
