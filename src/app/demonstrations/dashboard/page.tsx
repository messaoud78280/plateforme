import type { Metadata } from "next";
import { DemoDashboard } from "@/components/demonstrations/DemoDashboard";
import { DemoShell } from "@/components/demonstrations/DemoShell";
import { demoPageMetadata } from "@/lib/seo-formation-pages";

export const metadata: Metadata = demoPageMetadata(
  "dashboard",
  "Tableau de bord",
  "Transformez vos données en une interface claire pour suivre votre activité.",
);

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
