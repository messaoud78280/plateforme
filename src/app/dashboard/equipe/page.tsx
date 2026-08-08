import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EquipeSection } from "@/components/dashboard/EquipeSection";
import { BackLink } from "@/components/ui/BackLink";
import { canManageEquipe } from "@/lib/equipe-acces/nav-by-persona";

export default async function EquipePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/connexion?callbackUrl=/dashboard/equipe");
  if (session.user.role !== "CLIENT") redirect("/dashboard");

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { personType: true, permissionProfile: true },
  });
  if (!canManageEquipe(me?.personType, me?.permissionProfile)) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-8">
      <BackLink href="/dashboard">Tableau de bord</BackLink>
      <div>
        <h1 className="text-2xl font-bold text-[#1e3a5f]">Équipe & partenaires</h1>
        <p className="mt-1 text-slate-600">
          Gérez le personnel, les clients, fournisseurs et partenaires — avec un périmètre chantier
          clair pour éviter les fuites d&apos;accès.
        </p>
      </div>
      <EquipeSection />
    </div>
  );
}
