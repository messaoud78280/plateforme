import type { Metadata } from "next";
import { DemoDocuments } from "@/components/demonstrations/DemoDocuments";
import { DemoShell } from "@/components/demonstrations/DemoShell";
import { demoPageMetadata } from "@/lib/seo-formation-pages";

export const metadata: Metadata = demoPageMetadata(
  "documents",
  "Gestion de documents",
  "Classez et retrouvez les informations importantes dans une interface adaptée à votre métier.",
);

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
