import type { Metadata } from "next";
import { SEO_NOINDEX_ROBOTS } from "@/lib/seo-search-engines";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { OutilsCommunication } from "@/components/OutilsCommunication";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { UserAccountDropdown } from "@/components/dashboard/UserAccountDropdown";
import { NotificationsDropdown } from "@/components/dashboard/NotificationsDropdown";
import { ClientAccountStatus, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isClientLoginAllowed } from "@/lib/client-account-approval";
import { SkipLink } from "@/components/ui/SkipLink";
import { EnvironmentBanner } from "@/components/system/EnvironmentBanner";
import { DemoTenantBanner } from "@/components/demo-environment/DemoTenantBanner";
import { RoleOnboarding } from "@/components/onboarding/RoleOnboarding";
import { UiPreferencesProvider } from "@/components/system/UiPreferences";
import { resolveBeWorkEnvironment } from "@/lib/environment";
import { resolveDemoAccessForUser } from "@/lib/demo-environment/access";
import { isDemoEmail } from "@/lib/demo-environment/constants";

export const metadata: Metadata = {
  robots: SEO_NOINDEX_ROBOTS,
};

function roleLabel(role?: string | null, isDemo?: boolean) {
  if (isDemo) return "Direction";
  if (role === "MANAGER") return "Direction BeWork";
  if (role === "AGENCE") return "Agence";
  if (role === "AGENT") return "Agent";
  if (role === "CLIENT") return "Entreprise";
  return role ?? "";
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/connexion?callbackUrl=/dashboard");
  }

  if (session.user?.demoExpired || (session.user?.isDemo && session.user.demoExpired)) {
    redirect("/connexion/demo?error=demo_expired");
  }

  if (isDemoEmail(session.user?.email)) {
    const access = await resolveDemoAccessForUser(session.user.id);
    if (!access.ok) {
      redirect(`/connexion/demo?error=${access.reason === "expired" ? "demo_expired" : "demo_disabled"}`);
    }
  }

  if (session.user?.role === UserRole.CLIENT) {
    const client = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { accountStatus: true, company: true },
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
  const isDemo = Boolean(session.user.isDemo);
  const companyName = session.user.demoCompanyName ?? null;

  let demoExpiresIso: string | null = null;
  if (isDemo && session.user.demoEnvironmentId) {
    const demo = await prisma.demoEnvironment.findUnique({
      where: { id: session.user.demoEnvironmentId },
      select: { expiresAt: true, companyName: true },
    });
    demoExpiresIso = demo?.expiresAt?.toISOString() ?? null;
  }

  const dbCompany =
    !companyName && session.user.role === UserRole.CLIENT
      ? (
          await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { company: true },
          })
        )?.company
      : null;

  return (
    <div className="flex min-h-dvh bg-[#f1f5f9]">
      <SkipLink />
      <AppSidebar
        role={session.user?.role ?? null}
        userName={session.user?.name ?? null}
        userRoleLabel={roleLabel(session.user?.role, isDemo)}
        companyName={companyName ?? dbCompany}
        isDemo={isDemo}
        demoModules={session.user.demoModules ?? null}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <EnvironmentBanner environment={env} />
        {isDemo ? (
          <DemoTenantBanner companyName={companyName} expiresAt={demoExpiresIso} />
        ) : null}
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-slate-200/80 bg-white/90 px-3 backdrop-blur-sm sm:px-5">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-bework-ink">
              {isDemo && companyName ? companyName : "Espace de travail"}
            </p>
            <p className="truncate text-[11px] text-bework-muted">
              {isDemo ? "Démonstration BeWork" : "BeWork"}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            {session.user?.role === "CLIENT" && !isDemo ? (
              <a href="/dashboard/nouvelle-demande" className="btn-cc-primary !text-xs sm:!text-sm">
                + Nouvelle mission
              </a>
            ) : null}
            <NotificationsDropdown />
            <OutilsCommunication />
            <UserAccountDropdown
              userName={session.user?.name ?? null}
              userRole={session.user?.role ?? null}
              userCompany={companyName ?? dbCompany ?? null}
            />
          </div>
        </header>
        <UiPreferencesProvider userId={session.user.id}>
          <main
            id="contenu-principal"
            tabIndex={-1}
            className="cc-enter mx-auto w-full max-w-site min-w-0 flex-1 px-3 py-6 outline-none sm:px-5 sm:py-8"
          >
            {children}
          </main>
          <RoleOnboarding userId={session.user.id} role={session.user.role} />
        </UiPreferencesProvider>
      </div>
    </div>
  );
}
