import type { Metadata } from "next";
import { DemoSite } from "@/components/demonstrations/DemoSite";
import { DemoShell } from "@/components/demonstrations/DemoShell";
import { demoPageMetadata } from "@/lib/seo-formation-pages";

export const metadata: Metadata = demoPageMetadata(
  "site",
  "Site professionnel",
  "Construisez une véritable présence en ligne adaptée à votre entreprise et à vos objectifs.",
);

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
