import type { Metadata } from "next";
import { DemoDocuments } from "@/components/demonstrations/DemoDocuments";
import { DemoShell } from "@/components/demonstrations/DemoShell";

export const metadata: Metadata = {
  title: "Démo — Gestion de documents",
  description: "Aperçu BeWork d’une interface de classement documentaire. Données fictives.",
};

export default function DemoDocumentsPage() {
  return (
    <DemoShell
      title="Gestion de documents"
      description="Classez et retrouvez les informations importantes dans une interface adaptée à votre métier."
    >
      <DemoDocuments />
    </DemoShell>
  );
}
