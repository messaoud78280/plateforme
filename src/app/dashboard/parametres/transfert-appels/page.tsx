import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function TransfertAppelsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/connexion?callbackUrl=/dashboard/parametres/transfert-appels");
  }

  return (
    <section className="rounded-2xl surface-metallic-light p-6">
      <h2 className="mb-4 text-lg font-semibold text-[#475569]">
        Transfert d&apos;appels
      </h2>
      <p className="text-[#64748b]">
        Cette fonctionnalité sera bientôt disponible.
      </p>
    </section>
  );
}
