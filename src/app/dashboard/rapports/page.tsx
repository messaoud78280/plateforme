import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { ReportsView } from "@/components/reports/ReportsView";
import { BackLink } from "@/components/ui/BackLink";

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
  const period = params.period && ["7d", "30d", "3m", "6m", "1y"].includes(params.period)
    ? params.period
    : "30d";

  return (
    <div className="space-y-6">
      <BackLink href="/dashboard">Tableau de bord</BackLink>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Rapports</h1>
          <p className="mt-1 text-sm text-slate-600">
            Période : choisir ci-dessous · Export : PDF ou Excel à droite
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href={`/api/reports/export?period=${period}&format=pdf`}
            download
            className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
          >
            PDF
          </a>
          <a
            href={`/api/reports/export?period=${period}&format=csv`}
            download
            className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
          >
            Excel
          </a>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {PERIODS.map((p) => (
          <Link
            key={p.key}
            href={`/dashboard/rapports?period=${p.key}`}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              period === p.key ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {p.label}
          </Link>
        ))}
      </div>

      <ReportsView period={period} />
    </div>
  );
}
