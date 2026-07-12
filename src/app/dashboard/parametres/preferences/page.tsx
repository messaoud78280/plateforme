import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { UiPreferencesPanel } from "@/components/system/UiPreferences";
import { RestartOnboardingButton } from "@/components/onboarding/RoleOnboarding";

export default async function ParametresPreferencesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/connexion?callbackUrl=/dashboard/parametres/preferences");
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl surface-metallic-light p-6">
        <h2 className="mb-6 text-lg font-semibold text-black">Paramètres et préférences</h2>
        <ProfileForm initialName={session.user.name ?? ""} email={session.user.email ?? ""} />
      </section>

      <section className="rounded-2xl border border-[color:var(--cc-chrome-border)] bg-white p-6">
        <h2 className="text-lg font-semibold text-bework-ink">Affichage</h2>
        <p className="mt-1 text-sm text-bework-muted">
          Ces choix ne concernent que votre compte sur cet appareil.
        </p>
        <div className="mt-4">
          <UiPreferencesPanel userId={session.user.id} />
        </div>
      </section>

      <section className="rounded-2xl border border-[color:var(--cc-chrome-border)] bg-white p-6">
        <h2 className="text-lg font-semibold text-bework-ink">Aide — guide de démarrage</h2>
        <p className="mt-1 text-sm text-bework-muted">
          Relancer le parcours court adapté à votre rôle (moins de 5 minutes).
        </p>
        <div className="mt-4">
          <RestartOnboardingButton userId={session.user.id} role={session.user.role} />
        </div>
      </section>
    </div>
  );
}
