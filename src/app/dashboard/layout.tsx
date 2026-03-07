import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { OutilsCommunication } from "@/components/OutilsCommunication";
import { UserAccountDropdown } from "@/components/dashboard/UserAccountDropdown";
import { NotificationsDropdown } from "@/components/dashboard/NotificationsDropdown";

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
            className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-[#1e3a5f] via-[#2563eb] to-[#0ea5e9] bg-clip-text text-transparent drop-shadow-[0_1px_2px_rgba(30,58,95,0.25)]"
            style={{ fontFamily: "var(--font-orbitron), system-ui, sans-serif" }}
          >
            BeWork
          </Link>
          <div className="flex items-center gap-2">
            {session.user?.role === "CLIENT" && <NotificationsDropdown />}
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
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-1 py-2">
          <Link
            href="/dashboard"
            className="rounded-lg px-3 py-2 text-sm font-medium text-[#334155] hover:bg-[#eef0f4] hover:text-[#0f172a]"
          >
            Dashboard
          </Link>
          {session.user?.role === "CLIENT" ? (
            <>
              <Link
                href="/dashboard/nouvelle-demande"
                className="rounded-lg bg-[#1d4ed8] px-3 py-2 text-sm font-semibold text-white hover:bg-[#1e40af]"
              >
                Nouvelle demande
              </Link>
              <Link
                href="/dashboard/taches"
                className="rounded-lg px-3 py-2 text-sm font-medium text-[#334155] hover:bg-[#eef0f4] hover:text-[#0f172a]"
              >
                Mes demandes
              </Link>
              <Link
                href="/dashboard/messagerie"
                className="rounded-lg px-3 py-2 text-sm font-medium text-[#334155] hover:bg-[#eef0f4] hover:text-[#0f172a]"
              >
                Messagerie
              </Link>
              <Link
                href="/dashboard/documents"
                className="rounded-lg px-3 py-2 text-sm font-medium text-[#334155] hover:bg-[#eef0f4] hover:text-[#0f172a]"
              >
                Documents
              </Link>
              <Link
                href="/dashboard/abonnement"
                className="rounded-lg px-3 py-2 text-sm font-medium text-[#334155] hover:bg-[#eef0f4] hover:text-[#0f172a]"
              >
                Abonnement
              </Link>
              <Link
                href="/dashboard/parametres"
                className="rounded-lg px-3 py-2 text-sm font-medium text-[#334155] hover:bg-[#eef0f4] hover:text-[#0f172a]"
              >
                Paramètres
              </Link>
            </>
          ) : (
            <>
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
                <>
                  <Link
                    href="/dashboard/clients"
                    className="rounded-lg px-3 py-2 text-sm font-medium text-[#334155] hover:bg-[#eef0f4] hover:text-[#0f172a]"
                  >
                    Clients
                  </Link>
                  <Link
                    href="/dashboard/simulation"
                    className="rounded-lg px-3 py-2 text-sm font-medium text-[#334155] hover:bg-[#eef0f4] hover:text-[#0f172a]"
                  >
                    Simulation
                  </Link>
                </>
              )}
              <Link
                href="/dashboard/rapports"
                className="rounded-lg px-3 py-2 text-sm font-medium text-[#334155] hover:bg-[#eef0f4] hover:text-[#0f172a]"
              >
                Rapports
              </Link>
              {(session.user?.role === "AGENT") && (
                <Link
                  href="/dashboard/parametres"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-[#334155] hover:bg-[#eef0f4] hover:text-[#0f172a]"
                >
                  Paramètres
                </Link>
              )}
            </>
          )}
        </div>
      </nav>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
