import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { ChangePasswordForm } from "@/components/settings/ChangePasswordForm";
import { LogoutButton } from "@/components/LogoutButton";

export default async function ParametresPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/connexion?callbackUrl=/dashboard/parametres");
  }

  const isAgence = session.user.role === "AGENCE" || session.user.role === "MANAGER";

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Paramètres du compte
        </h1>
        <p className="mt-1 text-slate-600">
          Gérez votre profil et la sécurité de votre compte.
        </p>
      </div>

      {/* Profil */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Profil</h2>
            <p className="text-sm text-slate-500">Nom et email associés à votre compte.</p>
          </div>
        </div>
        <ProfileForm
          initialName={session.user.name ?? ""}
          email={session.user.email ?? ""}
        />
      </section>

      {/* Sécurité */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Sécurité</h2>
            <p className="text-sm text-slate-500">Modifiez votre mot de passe.</p>
          </div>
        </div>
        <ChangePasswordForm />
      </section>

      {/* Session */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Session</h2>
            <p className="text-sm text-slate-500">Rôle actuel et déconnexion.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">Connecté en tant que</span>
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                isAgence ? "bg-blue-100 text-blue-800" : "bg-slate-200 text-slate-800"
              }`}
            >
              {isAgence ? "Agence" : "Client"}
            </span>
          </div>
          <LogoutButton />
        </div>
      </section>
    </div>
  );
}
