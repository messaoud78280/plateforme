import type { Metadata } from "next";
import { DemoAgenda } from "@/components/demonstrations/DemoAgenda";
import { DemoShell } from "@/components/demonstrations/DemoShell";

export const metadata: Metadata = {
  title: "Démo — Agenda professionnel",
  description: "Démonstration BeWork d’un agenda adapté à votre activité. Données fictives.",
};

export default function DemoAgendaPage() {
  return (
    <DemoShell
      title="Agenda professionnel"
      description="Organisez rendez-vous, interventions, réunions ou tâches dans un agenda adapté."
    >
      <DemoAgenda />
    </DemoShell>
  );
}
