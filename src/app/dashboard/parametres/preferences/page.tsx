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
    <section className="rounded-2xl surface-metallic-light p-6">
      <h2 className="mb-6 text-lg font-semibold text-black">
        Paramètres et préférences
      </h2>
      <ProfileForm
        initialName={session.user.name ?? ""}
        email={session.user.email ?? ""}
      />
    </section>
  );
}
