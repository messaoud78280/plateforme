import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { ReportsView } from "@/components/reports/ReportsView";
import { BackLink } from "@/components/ui/BackLink";
import { PageHeader } from "@/components/ui/PageHeader";
import { FilterBar, FilterChip } from "@/components/ui/FilterBar";

const PERIODS = [
  { key: "7d", label: "7 jours" },
  { key: "30d", label: "30 jours" },
  { key: "3m", label: "3 mois" },
  { key: "6m", label: "6 mois" },
  { key: "1y", label: "1 an" },
] as const;

export default async function RapportsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/connexion?callbackUrl=/dashboard/rapports");
  }

  const params = await searchParams;
  const period =
    params.period && ["7d", "30d", "3m", "6m", "1y"].includes(params.period) ? params.period : "30d";

  const isClient = session.user.role === "CLIENT";

  return (
    <div className="space-y-6">
      <BackLink href="/dashboard">Tableau de bord</BackLink>
      <PageHeader
        eyebrow={isClient ? "Pilotage client" : "Pilotage activité"}
        title={isClient ? "Reporting intelligent" : "Rapports"}
        description={
          isClient
            ? "Synthèse dirigeant, dossiers prioritaires, décisions et pilotage — en moins de 10 secondes."
            : "Suivi des missions, documents et projets sur la période sélectionnée."
        }
        actions={
          <>
            <a href={`/api/reports/export?period=${period}&format=pdf`} download className="btn-cc-secondary">
              {isClient ? "PDF synthèse" : "PDF"}
            </a>
            <a href={`/api/reports/export?period=${period}&format=csv`} download className="btn-cc-secondary">
              {isClient ? "Excel dossiers" : "Excel"}
            </a>
          </>
        }
      />

      <FilterBar as="div">
        {PERIODS.map((p) => (
          <FilterChip key={p.key} href={`/dashboard/rapports?period=${p.key}`} active={period === p.key}>
            {p.label}
          </FilterChip>
        ))}
      </FilterBar>

      <ReportsView period={period} />
    </div>
  );
}
