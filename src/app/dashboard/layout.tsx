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
import { SkipLink } from "@/components/ui/SkipLink";
import { EnvironmentBanner } from "@/components/system/EnvironmentBanner";
import { RoleOnboarding } from "@/components/onboarding/RoleOnboarding";
import { UiPreferencesProvider } from "@/components/system/UiPreferences";
import { resolveBeWorkEnvironment } from "@/lib/environment";

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

  const env = resolveBeWorkEnvironment();

  return (
    <div className="cc-shell">
      <SkipLink />
      <EnvironmentBanner environment={env} />
      <header className="cc-header sticky top-0 z-40 shrink-0 overflow-visible">
        <div className="mx-auto flex h-14 max-w-site items-center justify-between gap-2 overflow-visible px-3 sm:gap-3 sm:px-4">
          <Link
            href="/dashboard"
            className="font-heading shrink-0 text-xl font-extrabold tracking-tight text-bework-navy md:text-2xl"
          >
            <span className="bg-gradient-to-r from-bework-navy via-bework-accent to-bework-cyan bg-clip-text text-transparent">
              BeWork
            </span>
            <span className="ml-2 hidden align-middle text-[10px] font-bold uppercase tracking-[0.16em] text-bework-muted sm:inline">
              Command
            </span>
          </Link>
          <div className="flex shrink-0 flex-nowrap items-center gap-1 overflow-visible sm:gap-2">
            {session.user?.role === "CLIENT" && (
              <Link href="/dashboard/nouvelle-demande" className="btn-cc-primary !text-xs sm:!text-sm">
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
      <UiPreferencesProvider userId={session.user.id}>
        <main
          id="contenu-principal"
          tabIndex={-1}
          className="cc-enter mx-auto max-w-site min-w-0 px-3 py-6 outline-none sm:px-4 sm:py-8"
        >
          {children}
        </main>
        <RoleOnboarding userId={session.user.id} role={session.user.role} />
      </UiPreferencesProvider>
    </div>
  );
}
