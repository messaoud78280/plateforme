import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { MessagesSection } from "@/components/dashboard/MessagesSection";
import { BackLink } from "@/components/ui/BackLink";

export default async function MessageriePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/connexion?callbackUrl=/dashboard");
  }

  const isAgence = session.user.role === "AGENCE" || session.user.role === "MANAGER";

  return (
    <div className="space-y-8">
      <BackLink href="/dashboard">Dashboard</BackLink>
      <div>
        <h1 className="text-2xl font-bold text-[#0f172a]">Messagerie</h1>
        <p className="mt-1 text-[#334155]">
          Échangez avec l&apos;agence via les projets. Consultez les nouveaux messages, l&apos;historique et envoyez des messages.
        </p>
      </div>

      <MessagesSection
        isAgence={isAgence}
        sessionUserId={session.user.id}
        variant="messagerie"
      />
    </div>
  );
}
