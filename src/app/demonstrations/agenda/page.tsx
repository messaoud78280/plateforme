import type { Metadata } from "next";
import { DemoAgenda } from "@/components/demonstrations/DemoAgenda";
import { DemoShell } from "@/components/demonstrations/DemoShell";
import { demoPageMetadata } from "@/lib/seo-formation-pages";

export const metadata: Metadata = demoPageMetadata(
  "agenda",
  "Agenda professionnel",
  "Organisez rendez-vous, interventions, réunions ou tâches dans un agenda adapté à votre activité.",
);

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
