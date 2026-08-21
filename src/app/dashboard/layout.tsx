import Link from "next/link";
import { Suspense } from "react";
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
import {
  SaasTrialBanner,
  SaasTrialExpiredBanner,
} from "@/components/saas/SaasTrialBanner";
import { ContextualHeaderCta } from "@/components/saas/ContextualHeaderCta";
import { getSaasBannerState } from "@/lib/organization/saas-banner";
import { DemoViewAsSwitcher } from "@/components/demo-environment/DemoViewAsSwitcher";
import { DemoCommercialTourLazy } from "@/components/demo-environment/DemoCommercialTourLazy";
import { RoleOnboarding } from "@/components/onboarding/RoleOnboarding";
import { UiPreferencesProvider } from "@/components/system/UiPreferences";
import { DashboardMain } from "@/components/dashboard/DashboardMain";
import { resolveBeWorkEnvironment } from "@/lib/environment";
import { resolveDemoAccessForUser } from "@/lib/demo-environment/access";
import { isDemoEmail } from "@/lib/demo-environment/constants";
import {
  getCurrentPlatformConfig,
} from "@/lib/platform/config";
import {
  isExternalPortalUser,
  personaHomeLabel,
} from "@/lib/equipe-acces/nav-by-persona";
import { displayUserRoleLabel } from "@/lib/equipe-acces/display-role";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { assertDashboardHrefAllowed } from "@/lib/equipe-acces/assert-dashboard-access";
import { isCommercialWorkspacePath } from "@/lib/commercial/workspace";
import { CommercialWorkspaceShell } from "@/components/commercial/CommercialWorkspaceShell";
import { CommercialLaunchLink } from "@/components/dashboard/CommercialLaunchLink";
import { getPlatformRoleForUserId } from "@/lib/platform-admin/authz";
import { isPlatformAdminRole } from "@/lib/platform-admin/role";
import { getActiveSupportSessionForAdmin } from "@/lib/platform-admin/support";
import { PlatformSupportBanner } from "@/components/platform-admin/PlatformSupportBanner";

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

  // Platform Admin : uniquement via SupportSession (sinon console /admin)
  const platformRoleDb = await getPlatformRoleForUserId(session.user.id);
  const platformRole = platformRoleDb ?? session.user.platformRole ?? null;
  let supportSession: Awaited<ReturnType<typeof getActiveSupportSessionForAdmin>> = null;
  if (isPlatformAdminRole(platformRole)) {
    supportSession = await getActiveSupportSessionForAdmin(session.user.id);
    if (!supportSession) {
      redirect("/admin");
    }
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
  let demoLogoUrl: string | null = null;
  let demoOrganizationId: string | null = null;
  let demoLoginIdentifier: string | null = null;
  if (isDemo && session.user.demoEnvironmentId) {
    const demo = await getCachedDemoExpiry(session.user.demoEnvironmentId);
    demoExpiresIso = demo?.expiresAt?.toISOString() ?? null;
    demoLogoUrl = demo?.logoUrl?.trim() || null;
    demoOrganizationId = demo?.organizationId ?? null;
    demoLoginIdentifier = demo?.loginIdentifier ?? null;
  }

  const platform = getCurrentPlatformConfig({
    organizationId: demoOrganizationId,
    isDemo,
    companyName,
    logoUrl: demoLogoUrl,
    loginIdentifier: demoLoginIdentifier,
  });

  const saasBanner = await getSaasBannerState(session.user);

  const pathname = (await headers()).get("x-dashboard-pathname");
  if (pathname) {
    assertDashboardHrefAllowed({
      href: pathname,
      personType,
      permissionProfile,
    });
  }

  if (isCommercialWorkspacePath(pathname)) {
    return (
      <div className="flex min-h-dvh flex-col bg-[color:var(--cc-surface-muted)]">
        <SkipLink />
        <EnvironmentBanner environment={env} />
        {supportSession ? (
          <PlatformSupportBanner
            organizationName={supportSession.organizationName}
            mode={supportSession.mode}
            organizationId={supportSession.organizationId}
          />
        ) : null}
        {isDemo ? (
          <DemoTenantBanner companyName={companyName} expiresAt={demoExpiresIso} />
        ) : null}
        <UiPreferencesProvider userId={session.user.id}>
          <CommercialWorkspaceShell
            personType={personType}
            permissionProfile={permissionProfile}
            orgLabel={companyName ?? dbCompany}
          >
            {children}
          </CommercialWorkspaceShell>
        </UiPreferencesProvider>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh bg-[color:var(--cc-surface-muted)]">
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
        demoLogoUrl={isDemo ? platform.branding.logo : null}
        productSecondaryLabel={platform.branding.productSecondaryLabel}
        contactRoleFallback={
          isDemo ? platform.branding.contactRoleLabel || null : null
        }
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <EnvironmentBanner environment={env} />
        {supportSession ? (
          <PlatformSupportBanner
            organizationName={supportSession.organizationName}
            mode={supportSession.mode}
            organizationId={supportSession.organizationId}
          />
        ) : null}
        {isDemo ? (
          <DemoTenantBanner companyName={companyName} expiresAt={demoExpiresIso} />
        ) : saasBanner.kind === "trial" ? (
          <SaasTrialBanner
            daysRemaining={saasBanner.daysRemaining}
            companyName={saasBanner.companyName}
            activationPercent={saasBanner.activationPercent}
          />
        ) : saasBanner.kind === "trial_expired" ? (
          <SaasTrialExpiredBanner />
        ) : null}
        <header className="cc-header sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-3 px-3 sm:px-5">
          <div className="min-w-0">
            <p className="truncate text-[0.9375rem] font-semibold tracking-tight text-bework-ink">
              {isDemo && companyName
                ? companyName
                : external
                  ? personaHomeLabel(personType, permissionProfile)
                  : "Espace de travail"}
            </p>
            <p className="truncate text-[12px] font-medium text-bework-muted">
              {platform.branding.productSecondaryLabel}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            {isDemo && platform.features.demoViewAs ? <DemoViewAsSwitcher /> : null}
            {session.user?.role === "CLIENT" && !isDemo && !external ? (
              <Suspense
                fallback={
                  <Link
                    href="/dashboard/taches?nouvelle=1"
                    className="btn-cc-primary !text-xs sm:!text-sm"
                  >
                    + Nouvelle tâche
                  </Link>
                }
              >
                <ContextualHeaderCta user={session.user} />
              </Suspense>
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
            <CommercialLaunchLink
              personType={personType}
              permissionProfile={permissionProfile}
            />
            <OutilsCommunication />
            <UserAccountDropdown
              key={session.user.id}
              userName={session.user?.name ?? null}
              userRole={session.user?.role ?? null}
              roleLabel={userRoleLabel}
              userCompany={companyName ?? dbCompany ?? null}
              personType={personType}
              permissionProfile={permissionProfile}
              isDemo={isDemo}
              demoModules={session.user.demoModules ?? null}
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
          <Suspense fallback={null}>
            <MobileBottomNav
              personType={personType}
              permissionProfile={permissionProfile}
            />
          </Suspense>
          {isDemo && platform.commercialDemo ? <DemoCommercialTourLazy /> : null}
        </UiPreferencesProvider>
      </div>
    </div>
  );
}
