import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { EquipeSection } from "@/components/dashboard/EquipeSection";
import { BackLink } from "@/components/ui/BackLink";

export default async function EquipePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/connexion?callbackUrl=/dashboard/equipe");
  if (session.user.role !== "CLIENT") redirect("/dashboard");

  return (
    <div className="space-y-8">
      <BackLink href="/dashboard">Dashboard</BackLink>
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Inviter un membre de l&apos;équipe</h1>
        <p className="mt-1 text-slate-600">
          Ajoutez des collaborateurs et définissez leur rôle (Administrateur, Utilisateur ou Superviseur).
        </p>
      </div>
      <EquipeSection />
    </div>
  );
}
