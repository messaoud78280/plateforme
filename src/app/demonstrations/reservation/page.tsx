import type { Metadata } from "next";
import { DemoReservation } from "@/components/demonstrations/DemoReservation";
import { DemoShell } from "@/components/demonstrations/DemoShell";

export const metadata: Metadata = {
  title: "Démo — Système de réservation",
  description: "Démonstration BeWork d’un parcours de réservation. Données fictives, sans inscription.",
};

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
