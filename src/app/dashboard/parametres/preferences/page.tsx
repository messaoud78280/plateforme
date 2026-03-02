import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { ProfileForm } from "@/components/settings/ProfileForm";

export default async function ParametresPreferencesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/connexion?callbackUrl=/dashboard/parametres/preferences");
  }

  return (
    <section className="rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-sm">
      <h2 className="mb-6 text-lg font-semibold text-[#475569]">
        Paramètres et préférences
      </h2>
      <ProfileForm
        initialName={session.user.name ?? ""}
        email={session.user.email ?? ""}
      />
    </section>
  );
}
