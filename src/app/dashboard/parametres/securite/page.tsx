import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getRolePartLabel } from "@/types";
import { ChangePasswordForm } from "@/components/settings/ChangePasswordForm";
import { LogoutButton } from "@/components/LogoutButton";

export default async function PreferencesSecuritePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/connexion?callbackUrl=/dashboard/parametres/securite");
  }

  const role = session.user.role ?? "CLIENT";
  const roleLabel = getRolePartLabel(role);
  const isManager = role === "MANAGER";
  const isAgent = role === "AGENT" || role === "AGENCE";
  const isClient = role === "CLIENT";
  const isCoteAgence = isManager || isAgent;

  return (
    <section className="rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-sm">
      <h2 className="mb-6 text-lg font-semibold text-[#475569]">
        Préférences de sécurité
      </h2>
      <div className="space-y-8">
        <ChangePasswordForm />
        <div className="border-t border-[#e2e8f0] pt-6">
          <p className="mb-2 text-sm font-medium text-[#64748b]">Session</p>
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm text-[#64748b]">Connecté en tant que</span>
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                isCoteAgence ? "bg-blue-100 text-blue-800" : "bg-slate-200 text-slate-800"
              }`}
            >
              {roleLabel}
            </span>
            <LogoutButton />
          </div>
        </div>
      </div>
    </section>
  );
}
