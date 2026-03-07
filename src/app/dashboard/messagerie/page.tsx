import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { MessagesSection } from "@/components/dashboard/MessagesSection";
import { MessagerieView } from "@/components/messagerie/MessagerieView";
import { BackLink } from "@/components/ui/BackLink";

export default async function MessageriePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/connexion?callbackUrl=/dashboard");
  }

  const isAgence = session.user.role === "AGENCE" || session.user.role === "MANAGER";
  const isClient = session.user.role === "CLIENT";

  return (
    <div className="space-y-6">
      <BackLink href="/dashboard">Dashboard</BackLink>
      <div>
        <h1 className="text-2xl font-bold text-[#0f172a]">Messagerie</h1>
        <p className="mt-1 text-[#334155]">
          {isClient
            ? "Échangez avec votre assistant, suivez vos demandes et envoyez des documents."
            : "Échangez avec l'agence via les projets. Consultez les messages et l'historique."}
        </p>
      </div>

      {isClient ? (
        <MessagerieView sessionUserId={session.user.id} />
      ) : (
        <MessagesSection
          isAgence={isAgence}
          sessionUserId={session.user.id}
          variant="messagerie"
        />
      )}
    </div>
  );
}
