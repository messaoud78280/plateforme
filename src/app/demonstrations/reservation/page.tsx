import type { Metadata } from "next";
import { DemoReservation } from "@/components/demonstrations/DemoReservation";
import { DemoShell } from "@/components/demonstrations/DemoShell";
import { demoPageMetadata } from "@/lib/seo-formation-pages";

export const metadata: Metadata = demoPageMetadata(
  "reservation",
  "Système de réservation",
  "Permettez à vos clients de sélectionner une prestation, une date et d’envoyer leur demande.",
);

export default function DemoReservationPage() {
  return (
    <DemoShell
      title="Système de réservation"
      description="Permettez à vos clients de sélectionner une prestation, une date et d’envoyer leur demande."
    >
      <DemoReservation />
    </DemoShell>
  );
}
