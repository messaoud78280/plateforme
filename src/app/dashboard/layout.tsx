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
import {
  isExternalPortalUser,
  personaHomeLabel,
} from "@/lib/equipe-acces/nav-by-persona";
import { PERMISSION_PROFILE_LABELS, PERSON_TYPE_LABELS, type PermissionProfileKey, type PersonType } from "@/lib/equipe-acces/types";

export const metadata: Metadata = {
  robots: SEO_NOINDEX_ROBOTS,
};

function roleLabel(
  role?: string | null,
  isDemo?: boolean,
  personType?: string | null,
  permissionProfile?: string | null
) {
  if (isDemo) return "Direction";
  if (role === "MANAGER") return "Direction BeWork";
  if (role === "AGENCE") return "Agence";
  if (role === "AGENT") return "Agent";
  if (role === "CLIENT") {
    if (permissionProfile && permissionProfile in PERMISSION_PROFILE_LABELS) {
      return PERMISSION_PROFILE_LABELS[permissionProfile as PermissionProfileKey];
    }
    if (personType && personType in PERSON_TYPE_LABELS) {
      return PERSON_TYPE_LABELS[personType as PersonType];
    }
    return personaHomeLabel(personType, permissionProfile);
  }
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

  let personType = session.user.personType ?? null;
  let permissionProfile = session.user.permissionProfile ?? null;
  let dbCompany: string | null = null;

  if (session.user?.role === UserRole.CLIENT) {
    const client = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        accountStatus: true,
        company: true,
        personType: true,
        permissionProfile: true,
      },
    });
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

  let demoExpiresIso: string | null = null;
  if (isDemo && session.user.demoEnvironmentId) {
    const demo = await prisma.demoEnvironment.findUnique({
      where: { id: session.user.demoEnvironmentId },
      select: { expiresAt: true, companyName: true },
    });
    demoExpiresIso = demo?.expiresAt?.toISOString() ?? null;
  }

  return (
    <div className="flex min-h-dvh bg-[#f1f5f9]">
      <SkipLink />
      <AppSidebar
        role={session.user?.role ?? null}
        userName={session.user?.name ?? null}
        userRoleLabel={roleLabel(session.user?.role, isDemo, personType, permissionProfile)}
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
            {session.user?.role === "CLIENT" && !isDemo && !external ? (
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
