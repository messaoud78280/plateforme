import type { Metadata } from "next";
import { SEO_NOINDEX_ROBOTS } from "@/lib/seo-search-engines";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { OutilsCommunication } from "@/components/OutilsCommunication";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { UserAccountDropdown } from "@/components/dashboard/UserAccountDropdown";
import { NotificationsDropdown } from "@/components/dashboard/NotificationsDropdown";
import { ClientAccountStatus, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isClientLoginAllowed } from "@/lib/client-account-approval";

export const metadata: Metadata = {
  robots: SEO_NOINDEX_ROBOTS,
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/connexion?callbackUrl=/dashboard");
  }

  if (session.user?.role === UserRole.CLIENT) {
    const client = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { accountStatus: true },
    });
    if (client && !isClientLoginAllowed(client.accountStatus)) {
      redirect(
        client.accountStatus === ClientAccountStatus.REJECTED
          ? "/compte/inscription-refusee"
          : "/compte/en-attente-validation"
      );
    }
  }

  return (
    <div className="min-h-screen bg-[#eef0f4]">
      <header className="relative z-40 shrink-0 overflow-visible border-b border-[#c8cdd6] bg-[#f8f9fb]">
        <div className="mx-auto flex h-14 max-w-site items-center justify-between gap-2 overflow-visible px-3 sm:gap-3 sm:px-4">
          <Link
            href="/dashboard"
            className="shrink-0 text-xl font-extrabold tracking-tight bg-gradient-to-r from-[#1e3a5f] via-[#2563eb] to-[#0ea5e9] bg-clip-text text-transparent drop-shadow-[0_1px_2px_rgba(30,58,95,0.25)] md:text-2xl"
            style={{ fontFamily: "var(--font-rajdhani), ui-sans-serif, system-ui, sans-serif" }}
          >
            BeWork
          </Link>
          <div className="flex shrink-0 flex-nowrap items-center gap-1 overflow-visible sm:gap-2">
            {session.user?.role === "CLIENT" && (
              <Link
                href="/dashboard/nouvelle-demande"
                className="inline-flex items-center rounded-lg bg-[#1d4ed8] px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#1e40af] sm:px-3.5 sm:text-sm"
              >
                + Nouvelle mission
              </Link>
            )}
            <NotificationsDropdown />
            <OutilsCommunication />
            <UserAccountDropdown
              userName={session.user?.name ?? null}
              userRole={session.user?.role ?? null}
              userCompany={(session.user as { company?: string })?.company ?? null}
            />
          </div>
        </div>
      </header>
      <DashboardNav role={session.user?.role ?? null} />
      <main className="mx-auto max-w-site min-w-0 px-3 py-6 sm:px-4 sm:py-8">{children}</main>
    </div>
  );
}
