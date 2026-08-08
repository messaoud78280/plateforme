import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { followUpSheetAccessWhere, resolveFollowUpOwnerUserId } from "@/lib/follow-up/access";
import { getFollowUpSettings } from "@/lib/follow-up/settings";
import { serializeFollowUpSheet } from "@/lib/follow-up/serialize";
import { FollowUpBoard } from "@/components/follow-up/FollowUpBoard";
import { FollowUpKanban } from "@/components/follow-up/FollowUpKanban";
import { FollowUpViewToggle } from "@/components/follow-up/FollowUpViewToggle";
import { PageHeader } from "@/components/ui/PageHeader";
import { BackLink } from "@/components/ui/BackLink";
import { ensureOrganizationForOwner } from "@/lib/organization/access";
import { ensureDefaultWorkflow } from "@/lib/workflow/service";

export const dynamic = "force-dynamic";

export default async function FichesSuiviPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; view?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/connexion?callbackUrl=/dashboard/fiches-suivi");

  const sp = await searchParams;
  const filter = sp.filter;
  const view = sp.view === "tableau" ? "tableau" : "liste";
  const accessWhere = await followUpSheetAccessWhere(session.user);
  const ownerUserId = await resolveFollowUpOwnerUserId(session.user.id);
  const settings = await getFollowUpSettings(ownerUserId);
  const now = new Date();
  const startToday = new Date(now);
  startToday.setHours(0, 0, 0, 0);
  const endToday = new Date(now);
  endToday.setHours(23, 59, 59, 999);
  const endWeek = new Date(startToday);
  const day = endWeek.getDay();
  endWeek.setDate(endWeek.getDate() + (day === 0 ? 0 : 7 - day));
  endWeek.setHours(23, 59, 59, 999);

  const allSheets = await prisma.followUpSheet.findMany({
    where: {
      AND: [accessWhere, { status: { not: "ARCHIVE" } }],
    },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      project: { select: { id: true, title: true, siteCity: true, siteAddress: true } },
    },
    orderBy: [{ nextActionAt: "asc" }, { updatedAt: "desc" }],
    take: 200,
  });

  const allItems = allSheets.map((s) => serializeFollowUpSheet(s, settings.thresholds));

  let items = allItems;
  if (filter === "overdue") {
    items = allItems.filter((i) => i.delayLabel != null);
  } else if (filter === "today") {
    items = allItems.filter((i) => {
      if (!i.nextActionAt || i.nextActionDone) return false;
      const d = new Date(i.nextActionAt);
      return d >= startToday && d <= endToday;
    });
  } else if (filter === "week") {
    items = allItems.filter((i) => {
      if (!i.nextActionAt || i.nextActionDone) return false;
      const d = new Date(i.nextActionAt);
      return d >= startToday && d <= endWeek;
    });
  } else if (filter === "a-facturer") {
    items = allItems.filter((i) => i.status === "A_FACTURER" || i.status === "TRAVAUX_TERMINES");
  } else if (filter === "avenant") {
    items = allItems.filter((i) => i.status === "AVENANT");
  } else if (filter === "a-planifier") {
    items = allItems.filter((i) =>
      ["NOUVEAU", "A_PLANIFIER", "A_ANALYSER"].includes(i.status),
    );
  } else if (filter === "urgent") {
    items = allItems.filter((i) => ["IMPORTANT", "URGENT", "CRITIQUE"].includes(i.urgency));
  } else if (filter === "non-preparees") {
    items = allItems.filter(
      (i) =>
        i.status === "INTERVENTION_PREVUE" ||
        i.status === "COMMANDE_FOURNISSEUR" ||
        (i.nextAction ?? "").toLowerCase().includes("commander"),
    );
  }

  const counters = [
    {
      label: "Urgences",
      value: allItems.filter((i) => i.urgency === "URGENT" || i.urgency === "CRITIQUE").length,
      href: `/dashboard/fiches-suivi?view=${view}&filter=urgent`,
      emphasize: true,
    },
    {
      label: "Aujourd’hui",
      value: allItems.filter((i) => {
        if (!i.nextActionAt || i.nextActionDone) return false;
        const d = new Date(i.nextActionAt);
        return d >= startToday && d <= endToday;
      }).length,
      href: `/dashboard/fiches-suivi?view=${view}&filter=today`,
    },
    {
      label: "Cette semaine",
      value: allItems.filter((i) => {
        if (!i.nextActionAt || i.nextActionDone) return false;
        const d = new Date(i.nextActionAt);
        return d >= startToday && d <= endWeek;
      }).length,
      href: `/dashboard/fiches-suivi?view=${view}&filter=week`,
    },
    {
      label: "En retard",
      value: allItems.filter((i) => i.delayLabel).length,
      href: `/dashboard/fiches-suivi?view=${view}&filter=overdue`,
      emphasize: true,
    },
    {
      label: "Non préparées",
      value: allItems.filter(
        (i) =>
          i.status === "INTERVENTION_PREVUE" ||
          i.status === "COMMANDE_FOURNISSEUR" ||
          (i.nextAction ?? "").toLowerCase().includes("commander"),
      ).length,
      href: `/dashboard/fiches-suivi?view=${view}&filter=non-preparees`,
    },
    {
      label: "À planifier",
      value: allItems.filter((i) =>
        ["NOUVEAU", "A_PLANIFIER", "A_ANALYSER"].includes(i.status),
      ).length,
      href: `/dashboard/fiches-suivi?view=${view}&filter=a-planifier`,
    },
    {
      label: "À facturer",
      value: allItems.filter((i) => i.status === "A_FACTURER" || i.status === "TRAVAUX_TERMINES")
        .length,
      href: `/dashboard/fiches-suivi?view=${view}&filter=a-facturer`,
    },
    {
      label: "Avenants",
      value: allItems.filter((i) => i.status === "AVENANT").length,
      href: `/dashboard/fiches-suivi?view=${view}&filter=avenant`,
    },
  ];

  let kanbanColumns: { statusKey: string; label: string; colorKey: string; sortOrder: number }[] =
    [];
  if (view === "tableau") {
    const orgId = await ensureOrganizationForOwner(ownerUserId);
    if (orgId) {
      const workflow = await ensureDefaultWorkflow(orgId);
      kanbanColumns = workflow.steps
        .filter((s) => s.statusKey !== "ARCHIVE")
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((s) => ({
          statusKey: s.statusKey,
          label: s.label,
          colorKey: s.colorKey,
          sortOrder: s.sortOrder,
        }));
    }
  }

  return (
    <div
      className={`mx-auto space-y-6 px-4 py-6 sm:px-6 ${
        view === "tableau" ? "max-w-[100vw]" : "max-w-6xl"
      }`}
    >
      <BackLink href="/dashboard">Tableau de bord</BackLink>
      <PageHeader
        eyebrow="Suivi opérationnel"
        title="Fiches de suivi"
        description={
          view === "tableau"
            ? "Tableau de suivi : chaque colonne = une étape de votre processus métier."
            : "Mur de post-it numérique : 1 OS / 1 commande = 1 fiche. Filtrez, regroupez, agissez."
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <FollowUpViewToggle view={view} filter={filter} />
            <Link
              href="/dashboard/fiches-suivi/nouvelle"
              className="rounded-xl bg-[#1e3a5f] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#16304f]"
            >
              + Nouvelle fiche
            </Link>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {counters.map((c) => (
          <Link
            key={c.href + c.label}
            href={c.href}
            className={`rounded-xl border bg-white px-3 py-3 shadow-sm transition hover:border-[#1e3a5f]/30 ${
              c.emphasize && c.value > 0 ? "border-red-200 bg-red-50/50" : "border-slate-200"
            } ${filter && c.href.includes(`filter=${filter}`) ? "ring-2 ring-[#1e3a5f]/30" : ""}`}
          >
            <p className="text-2xl font-extrabold tabular-nums text-slate-900">{c.value}</p>
            <p className="text-xs font-medium text-slate-600">{c.label}</p>
          </Link>
        ))}
      </div>

      {allItems.length === 0 ? (
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
      ) : view === "tableau" ? (
        kanbanColumns.length === 0 ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-8 text-sm text-amber-950">
            Aucun processus métier trouvé. Configurez-le dans{" "}
            <Link href="/dashboard/parametres/processus" className="font-semibold underline">
              Paramètres → Processus métier
            </Link>
            .
          </div>
        ) : (
          <FollowUpKanban columns={kanbanColumns} sheets={items} />
        )
      ) : (
        <FollowUpBoard sheets={items} activeFilter={filter} />
      )}
    </div>
  );
}
