import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { followUpSheetAccessWhere, resolveFollowUpOwnerUserId } from "@/lib/follow-up/access";
import { getFollowUpSettings } from "@/lib/follow-up/settings";
import { serializeFollowUpSheet } from "@/lib/follow-up/serialize";
import { FollowUpPostItCard } from "@/components/follow-up/FollowUpPostItCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { BackLink } from "@/components/ui/BackLink";

export const dynamic = "force-dynamic";

export default async function FichesSuiviPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/connexion?callbackUrl=/dashboard/fiches-suivi");

  const sp = await searchParams;
  const filter = sp.filter;
  const accessWhere = await followUpSheetAccessWhere(session.user);
  const settings = await getFollowUpSettings(await resolveFollowUpOwnerUserId(session.user.id));
  const now = new Date();
  const startToday = new Date(now);
  startToday.setHours(0, 0, 0, 0);
  const endToday = new Date(now);
  endToday.setHours(23, 59, 59, 999);

  const sheets = await prisma.followUpSheet.findMany({
    where: {
      AND: [
        accessWhere,
        { status: { not: "ARCHIVE" } },
        ...(filter === "overdue"
          ? [{ nextActionDone: false, nextActionAt: { lt: now } }]
          : []),
        ...(filter === "today"
          ? [{ nextActionDone: false, nextActionAt: { gte: startToday, lte: endToday } }]
          : []),
        ...(filter === "a-facturer"
          ? [{ status: { in: ["A_FACTURER" as const, "TRAVAUX_TERMINES" as const] } }]
          : []),
        ...(filter === "avenant" ? [{ status: "AVENANT" as const }] : []),
        ...(filter === "a-planifier"
          ? [{ status: { in: ["NOUVEAU" as const, "A_PLANIFIER" as const, "A_ANALYSER" as const] } }]
          : []),
      ],
    },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      project: { select: { id: true, title: true, siteCity: true, siteAddress: true } },
    },
    orderBy: [{ nextActionAt: "asc" }, { updatedAt: "desc" }],
    take: 200,
  });

  let items = sheets.map((s) => serializeFollowUpSheet(s, settings.thresholds));
  if (filter === "urgent") {
    items = items.filter((i) => ["IMPORTANT", "URGENT", "CRITIQUE"].includes(i.urgency));
  }

  const counters = [
    {
      label: "Urgences",
      value: items.filter((i) => i.urgency === "URGENT" || i.urgency === "CRITIQUE").length,
      href: "/dashboard/fiches-suivi?filter=urgent",
      emphasize: true,
    },
    {
      label: "Aujourd’hui",
      value: items.filter((i) => {
        if (!i.nextActionAt || i.nextActionDone) return false;
        const d = new Date(i.nextActionAt);
        return d >= startToday && d <= endToday;
      }).length,
      href: "/dashboard/fiches-suivi?filter=today",
    },
    {
      label: "En retard",
      value: items.filter((i) => i.delayLabel).length,
      href: "/dashboard/fiches-suivi?filter=overdue",
      emphasize: true,
    },
    {
      label: "À planifier",
      value: items.filter((i) => ["NOUVEAU", "A_PLANIFIER", "A_ANALYSER"].includes(i.status)).length,
      href: "/dashboard/fiches-suivi?filter=a-planifier",
    },
    {
      label: "À facturer",
      value: items.filter((i) => i.status === "A_FACTURER" || i.status === "TRAVAUX_TERMINES").length,
      href: "/dashboard/fiches-suivi?filter=a-facturer",
    },
    {
      label: "Avenants",
      value: items.filter((i) => i.status === "AVENANT").length,
      href: "/dashboard/fiches-suivi?filter=avenant",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
      <BackLink href="/dashboard">Tableau de bord</BackLink>
      <PageHeader
        eyebrow="Suivi opérationnel"
        title="Fiches de suivi"
        description="1 commande / 1 OS = 1 fiche. Remplace les post-it : prochaine action, responsable, échéance, alertes."
        actions={
          <Link
            href="/dashboard/fiches-suivi/nouvelle"
            className="rounded-xl bg-[#1e3a5f] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#16304f]"
          >
            + Nouvelle fiche
          </Link>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {counters.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className={`rounded-xl border bg-white px-3 py-3 shadow-sm transition hover:border-[#1e3a5f]/30 ${
              c.emphasize && c.value > 0 ? "border-red-200 bg-red-50/50" : "border-slate-200"
            }`}
          >
            <p className="text-2xl font-extrabold tabular-nums text-slate-900">{c.value}</p>
            <p className="text-xs font-medium text-slate-600">{c.label}</p>
          </Link>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-14 text-center">
          <p className="text-sm font-semibold text-slate-800">Aucune fiche pour le moment</p>
          <p className="mt-1 text-xs text-slate-500">
            Créez une fiche aussi simplement qu’un post-it sur un dossier papier.
          </p>
          <Link
            href="/dashboard/fiches-suivi/nouvelle"
            className="mt-4 inline-flex rounded-lg bg-[#1e3a5f] px-4 py-2 text-xs font-bold text-white"
          >
            + Nouvelle fiche
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((s) => (
            <FollowUpPostItCard key={s.id} sheet={s} />
          ))}
        </div>
      )}
    </div>
  );
}
