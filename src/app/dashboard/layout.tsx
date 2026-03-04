import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { OutilsCommunication } from "@/components/OutilsCommunication";
import { UserAccountDropdown } from "@/components/dashboard/UserAccountDropdown";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/connexion?callbackUrl=/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#eef0f4]">
      <header className="border-b border-[#c8cdd6] bg-[#f8f9fb]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link
            href="/dashboard"
            className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-[#1d4ed8] via-[#3b82f6] to-[#60a5fa] bg-clip-text text-transparent"
            style={{ fontFamily: "var(--font-orbitron), system-ui, sans-serif" }}
          >
            BeWork
          </Link>
          <div className="flex items-center gap-4">
            <OutilsCommunication />
            <UserAccountDropdown
              userName={session.user?.name ?? null}
              userRole={session.user?.role ?? null}
              userCompany={(session.user as { company?: string })?.company ?? null}
            />
          </div>
        </div>
      </header>
      <nav className="border-b border-[#c8cdd6] bg-[#f8f9fb] px-4">
        <div className="mx-auto flex max-w-6xl flex-wrap gap-1 py-2">
          <Link
            href="/dashboard"
            className="rounded-lg px-3 py-2 text-sm font-medium text-[#334155] hover:bg-[#eef0f4] hover:text-[#0f172a]"
          >
            Tableau de bord
          </Link>
          <Link
            href="/dashboard/projets"
            className="rounded-lg px-3 py-2 text-sm font-medium text-[#334155] hover:bg-[#eef0f4] hover:text-[#0f172a]"
          >
            Projets
          </Link>
          <Link
            href="/dashboard/taches"
            className="rounded-lg px-3 py-2 text-sm font-medium text-[#334155] hover:bg-[#eef0f4] hover:text-[#0f172a]"
          >
            Mes tâches
          </Link>
          <Link
            href="/dashboard/documents"
            className="rounded-lg px-3 py-2 text-sm font-medium text-[#334155] hover:bg-[#eef0f4] hover:text-[#0f172a]"
          >
            Mes documents
          </Link>
          <Link
            href="/dashboard/messagerie"
            className="rounded-lg px-3 py-2 text-sm font-medium text-[#334155] hover:bg-[#eef0f4] hover:text-[#0f172a]"
          >
            Messagerie
          </Link>
          <Link
            href="/dashboard/messages"
            className="rounded-lg px-3 py-2 text-sm font-medium text-[#334155] hover:bg-[#eef0f4] hover:text-[#0f172a]"
          >
            RDV
          </Link>
          {(session.user?.role === "AGENCE" || session.user?.role === "MANAGER") && (
            <Link
              href="/dashboard/clients"
              className="rounded-lg px-3 py-2 text-sm font-medium text-[#334155] hover:bg-[#eef0f4] hover:text-[#0f172a]"
            >
              Clients
            </Link>
          )}
          {(session.user?.role === "AGENCE" || session.user?.role === "MANAGER") && (
            <Link
              href="/dashboard/simulation"
              className="rounded-lg px-3 py-2 text-sm font-medium text-[#334155] hover:bg-[#eef0f4] hover:text-[#0f172a]"
            >
              Simulation
            </Link>
          )}
          <Link
            href="/dashboard/rapports"
            className="rounded-lg px-3 py-2 text-sm font-medium text-[#334155] hover:bg-[#eef0f4] hover:text-[#0f172a]"
          >
            Rapports
          </Link>
          <Link
            href="/dashboard/abonnement"
            className="rounded-lg px-3 py-2 text-sm font-medium text-[#334155] hover:bg-[#eef0f4] hover:text-[#0f172a]"
          >
            Abonnement
          </Link>
          <Link
            href="/contract"
            className="rounded-lg px-3 py-2 text-sm font-medium text-[#334155] hover:bg-[#eef0f4] hover:text-[#0f172a]"
          >
            Contrat
          </Link>
          <Link
            href="/dashboard/parametres"
            className="rounded-lg px-3 py-2 text-sm font-medium text-[#334155] hover:bg-[#eef0f4] hover:text-[#0f172a]"
          >
            Paramètres
          </Link>
        </div>
      </nav>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
