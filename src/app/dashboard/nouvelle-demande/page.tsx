import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NouvelleDemandeForm } from "@/components/demands/NouvelleDemandeForm";
import { BackLink } from "@/components/ui/BackLink";

export default async function NouvelleDemandePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/connexion?callbackUrl=/dashboard/nouvelle-demande");

  if (session.user.role !== "CLIENT") {
    redirect("/dashboard");
  }

  let actionsRemaining = 0;
  try {
    const u = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { monthlyActionsTotal: true, monthlyActionsUsed: true },
    });
    const total = u?.monthlyActionsTotal ?? 185;
    const used = u?.monthlyActionsUsed ?? 0;
    actionsRemaining = Math.max(0, total - used);
  } catch {
    // ignore
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <BackLink href="/dashboard">Tableau de bord</BackLink>
      <NouvelleDemandeForm actionsRemaining={actionsRemaining} />
    </div>
  );
}
