import type { Metadata } from "next";
import { DemoMessagerie } from "@/components/demonstrations/DemoMessagerie";
import { DemoShell } from "@/components/demonstrations/DemoShell";
import { demoPageMetadata } from "@/lib/seo-formation-pages";

export const metadata: Metadata = demoPageMetadata(
  "messagerie",
  "Messagerie interne",
  "Centralisez les échanges d’une équipe dans votre propre interface.",
);

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
