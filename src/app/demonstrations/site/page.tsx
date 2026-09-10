import type { Metadata } from "next";
import { DemoSite } from "@/components/demonstrations/DemoSite";
import { DemoShell } from "@/components/demonstrations/DemoShell";

export const metadata: Metadata = {
  title: "Démo — Site professionnel",
  description: "Aperçu BeWork de structure de site professionnel. Contenu fictif.",
};

export default function DemoSitePage() {
  return (
    <DemoShell
      title="Site professionnel"
      description="Construisez une véritable présence en ligne adaptée à votre entreprise et à vos objectifs."
    >
      <DemoSite />
    </DemoShell>
  );
}
