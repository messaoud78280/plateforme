import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getRolePartLabel } from "@/types";
import { ChangePasswordForm } from "@/components/settings/ChangePasswordForm";
import { LogoutButton } from "@/components/LogoutButton";

type Props = { searchParams?: Promise<{ mustChangePassword?: string }> };

export default async function PreferencesSecuritePage({ searchParams }: Props) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/connexion?callbackUrl=/dashboard/parametres/securite");
  }

  const sp = (await searchParams) ?? {};
  const forceChange = sp.mustChangePassword === "1";

  const role = session.user.role ?? "CLIENT";
  const roleLabel = getRolePartLabel(role);
  const isManager = role === "MANAGER";
  const isAgent = role === "AGENT" || role === "AGENCE";
  const isCoteAgence = isManager || isAgent;

  return (
    <section className="rounded-2xl surface-metallic-light p-6">
      <h2 className="mb-6 text-lg font-semibold text-black">
        Préférences de sécurité
      </h2>
      <div className="space-y-8">
        <ChangePasswordForm forceChange={forceChange} />
        <div className="border-t border-[#e2e8f0] pt-6">
          <p className="mb-2 text-sm font-medium text-black">Session</p>
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm text-black">Connecté en tant que</span>
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
