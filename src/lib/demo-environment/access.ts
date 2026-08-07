import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageDemoPilotage } from "@/lib/demo-pilotage/access";
import type { DemoEnvironmentStatus } from "./constants";
import { isDemoEmail } from "./constants";

export type DemoSessionMeta = {
  isDemo: true;
  demoEnvironmentId: string;
  companyName: string;
  modulesEnabled: string[];
  templateKey: string;
  expiresAt: Date;
  status: DemoEnvironmentStatus;
};

export async function findActiveDemoForUser(userId: string) {
  const demo = await prisma.demoEnvironment.findFirst({
    where: {
      OR: [{ rootUserId: userId }, { organization: { members: { some: { userId } } } }],
    },
    orderBy: { createdAt: "desc" },
  });
  return demo;
}

export async function resolveDemoAccessForUser(userId: string): Promise<
  | { ok: true; demo: NonNullable<Awaited<ReturnType<typeof findActiveDemoForUser>>> }
  | { ok: false; reason: "not_demo" | "disabled" | "expired" | "not_started" }
> {
  const demo = await findActiveDemoForUser(userId);
  if (!demo) return { ok: false, reason: "not_demo" };
  if (demo.status === "DISABLED" || demo.status === "ARCHIVED") {
    return { ok: false, reason: "disabled" };
  }
  const now = Date.now();
  if (demo.startsAt.getTime() > now) return { ok: false, reason: "not_started" };
  if (demo.expiresAt.getTime() < now || demo.status === "EXPIRED") {
    if (demo.status === "ACTIVE") {
      await prisma.demoEnvironment.update({
        where: { id: demo.id },
        data: { status: "EXPIRED" },
      });
    }
    return { ok: false, reason: "expired" };
  }
  return { ok: true, demo };
}

export function parseModules(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === "string");
}

export async function getDemoMetaForSession(userId: string, email?: string | null): Promise<DemoSessionMeta | null> {
  if (!isDemoEmail(email)) {
    const demo = await findActiveDemoForUser(userId);
    if (!demo) return null;
  }
  const access = await resolveDemoAccessForUser(userId);
  if (!access.ok) return null;
  return {
    isDemo: true,
    demoEnvironmentId: access.demo.id,
    companyName: access.demo.companyName,
    modulesEnabled: parseModules(access.demo.modulesEnabled),
    templateKey: access.demo.templateKey,
    expiresAt: access.demo.expiresAt,
    status: access.demo.status as DemoEnvironmentStatus,
  };
}

export async function requireDemoStaffSessionForPlatform() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect(`/connexion?callbackUrl=/dashboard/demonstrations/plateformes`);
  }
  if (!canManageDemoPilotage(session.user.role)) {
    redirect("/dashboard");
  }
  if ((session.user as { isDemo?: boolean }).isDemo) {
    redirect("/dashboard");
  }
  return session;
}

/** Empêche un compte démo d’accéder aux zones staff / admin BeWork. */
export function assertNotDemoStaffRoute(session: Session | null, pathname: string) {
  const isDemo = Boolean((session?.user as { isDemo?: boolean } | undefined)?.isDemo);
  if (!isDemo) return;
  const blockedPrefixes = [
    "/dashboard/clients",
    "/dashboard/agents",
    "/dashboard/demonstrations",
    "/dashboard/devis",
    "/api/admin",
  ];
  if (blockedPrefixes.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    redirect("/dashboard");
  }
}
