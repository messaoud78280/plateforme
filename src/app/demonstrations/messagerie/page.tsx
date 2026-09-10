import type { Metadata } from "next";
import { DemoMessagerie } from "@/components/demonstrations/DemoMessagerie";
import { DemoShell } from "@/components/demonstrations/DemoShell";

export const metadata: Metadata = {
  title: "Démo — Messagerie interne",
  description: "Démonstration BeWork d’une messagerie d’équipe. Données fictives, sans inscription.",
  robots: { index: true, follow: true },
};

export default function DemoMessageriePage() {
  return (
    <DemoShell
      title="Messagerie interne"
      description="Centralisez les échanges d’une équipe dans votre propre interface."
    >
      <DemoMessagerie />
    </DemoShell>
  );
}
