import Link from "next/link";
import { getCachedServerSession } from "@/lib/auth/cached-session";
import { SEO_NOINDEX_ROBOTS } from "@/lib/seo-search-engines";
import { OutilsCommunication } from "@/components/OutilsCommunication";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { UserAccountDropdown } from "@/components/dashboard/UserAccountDropdown";
import { NotificationsDropdown } from "@/components/dashboard/NotificationsDropdown";
import { MessagerieHeaderShortcut } from "@/components/dashboard/MessagerieHeaderShortcut";
import { GlobalSearchTrigger } from "@/components/dashboard/GlobalSearch";
import { MessagerieToastListener } from "@/components/dashboard/MessagerieToastListener";
import { MobileBottomNav } from "@/components/dashboard/MobileBottomNav";
import { PrefetchMainRoutes } from "@/components/dashboard/PrefetchMainRoutes";
import { MessagerieRealtimeBootstrap } from "@/components/dashboard/MessagerieRealtimeBootstrap";
import { ClientAccountStatus, UserRole } from "@prisma/client";
import { isClientLoginAllowed } from "@/lib/client-account-approval";
import { getCachedClientGate, getCachedDemoExpiry } from "@/lib/auth/cached-dashboard-user";
import { SkipLink } from "@/components/ui/SkipLink";
import { EnvironmentBanner } from "@/components/system/EnvironmentBanner";
import { DemoTenantBanner } from "@/components/demo-environment/DemoTenantBanner";
import { DemoViewAsSwitcher } from "@/components/demo-environment/DemoViewAsSwitcher";
import { DemoCommercialTour } from "@/components/demo-environment/DemoCommercialTour";
import { RoleOnboarding } from "@/components/onboarding/RoleOnboarding";
import { UiPreferencesProvider } from "@/components/system/UiPreferences";
import { DashboardMain } from "@/components/dashboard/DashboardMain";
import { resolveBeWorkEnvironment } from "@/lib/environment";
import { resolveDemoAccessForUser } from "@/lib/demo-environment/access";
import { isDemoEmail } from "@/lib/demo-environment/constants";
import {
  isExternalPortalUser,
  personaHomeLabel,
} from "@/lib/equipe-acces/nav-by-persona";
import { displayUserRoleLabel } from "@/lib/equipe-acces/display-role";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  robots: SEO_NOINDEX_ROBOTS,
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCachedServerSession();

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

  let personType = session.user.personType ?? null;
  let permissionProfile = session.user.permissionProfile ?? null;
  let dbCompany: string | null = null;

  if (session.user?.role === UserRole.CLIENT) {
    const client = await getCachedClientGate(session.user.id);
    if (client && !isClientLoginAllowed(client.accountStatus)) {
      redirect(
        client.accountStatus === ClientAccountStatus.REJECTED
          ? "/compte/inscription-refusee"
          : "/compte/en-attente-validation"
      );
    }
    personType = client?.personType ?? personType;
    permissionProfile = client?.permissionProfile ?? permissionProfile;
    dbCompany = client?.company ?? null;
  }

  const env = resolveBeWorkEnvironment();
  const isDemo = Boolean(session.user.isDemo);
  const companyName = session.user.demoCompanyName ?? null;
  const external = isExternalPortalUser(personType);
  const userRoleLabel = displayUserRoleLabel({
    role: session.user?.role,
    personType,
    permissionProfile,
  });

  let demoExpiresIso: string | null = null;
  if (isDemo && session.user.demoEnvironmentId) {
    const demo = await getCachedDemoExpiry(session.user.demoEnvironmentId);
    demoExpiresIso = demo?.expiresAt?.toISOString() ?? null;
  }

  return (
    <div className="flex min-h-dvh bg-[#f1f5f9]">
      <SkipLink />
      <AppSidebar
        role={session.user?.role ?? null}
        userName={session.user?.name ?? null}
        userRoleLabel={userRoleLabel}
        companyName={companyName ?? dbCompany}
        isDemo={isDemo}
        demoModules={session.user.demoModules ?? null}
        personType={personType}
        permissionProfile={permissionProfile}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <EnvironmentBanner environment={env} />
        {isDemo ? (
          <DemoTenantBanner companyName={companyName} expiresAt={demoExpiresIso} />
        ) : null}
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-slate-200/80 bg-white/90 px-3 backdrop-blur-sm sm:px-5">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-bework-ink">
              {isDemo && companyName
                ? companyName
                : external
                  ? personaHomeLabel(personType, permissionProfile)
                  : "Espace de travail"}
            </p>
            <p className="truncate text-[11px] text-bework-muted">
              {isDemo ? "Démonstration BeWork" : "BeWork"}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            {isDemo ? <DemoViewAsSwitcher /> : null}
            {session.user?.role === "CLIENT" && !isDemo && !external ? (
              <Link href="/dashboard/nouvelle-demande" className="btn-cc-primary !text-xs sm:!text-sm">
                + Nouvelle tâche
              </Link>
            ) : null}
            <GlobalSearchTrigger />
            <div
              className="flex items-center gap-0.5"
              role="group"
              aria-label="Messagerie et notifications"
            >
              <MessagerieHeaderShortcut key={session.user.id} />
              <NotificationsDropdown key={session.user.id} userId={session.user.id} />
            </div>
            <OutilsCommunication />
            <UserAccountDropdown
              key={session.user.id}
              userName={session.user?.name ?? null}
              userRole={session.user?.role ?? null}
              roleLabel={userRoleLabel}
              userCompany={companyName ?? dbCompany ?? null}
            />
          </div>
        </header>
        <UiPreferencesProvider userId={session.user.id}>
          <PrefetchMainRoutes
            personType={personType}
            permissionProfile={permissionProfile}
          />
          <MessagerieRealtimeBootstrap key={session.user.id} userId={session.user.id} />
          <DashboardMain>{children}</DashboardMain>
          <RoleOnboarding userId={session.user.id} role={session.user.role} />
          <MessagerieToastListener />
          <MobileBottomNav
            personType={personType}
            permissionProfile={permissionProfile}
          />
          {isDemo ? <DemoCommercialTour /> : null}
        </UiPreferencesProvider>
      </div>
    </div>
  );
}
