import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export function canManageDemoPilotage(role?: string | null): boolean {
  return role === "MANAGER" || role === "AGENCE";
}

export async function requireDemoStaffSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect(`/connexion?callbackUrl=/dashboard/demonstrations`);
  }
  if (!canManageDemoPilotage(session.user.role)) {
    redirect("/dashboard");
  }
  return session;
}

export type DemoLinkAccessResult =
  | { ok: true; link: NonNullable<Awaited<ReturnType<typeof findDemoLink>>> }
  | { ok: false; reason: "not_found" | "revoked" | "expired" | "max_views" };

async function findDemoLink(token: string) {
  return prisma.demoPilotageLink.findUnique({ where: { token } });
}

/** Valide un token prospect côté serveur — n’accède jamais aux tables Pilotage métier. */
export async function resolveDemoLinkAccess(token: string): Promise<DemoLinkAccessResult> {
  const link = await findDemoLink(token);
  if (!link) return { ok: false, reason: "not_found" };
  if (link.revokedAt || link.status === "REVOKED") return { ok: false, reason: "revoked" };
  if (link.expiresAt.getTime() < Date.now() || link.status === "EXPIRED") {
    return { ok: false, reason: "expired" };
  }
  if (link.maxViews != null && link.viewCount >= link.maxViews) {
    return { ok: false, reason: "max_views" };
  }
  return { ok: true, link };
}

/** Enregistre une consultation (non intrusif). Incrémente la vue au plus une fois / 30 min. */
export async function recordDemoView(token: string, section?: string) {
  const access = await resolveDemoLinkAccess(token);
  if (!access.ok) return access;

  const sections = Array.isArray(access.link.sectionsVisited)
    ? ([...access.link.sectionsVisited] as string[])
    : [];
  if (section && !sections.includes(section)) sections.push(section);

  const last = access.link.lastViewedAt?.getTime() ?? 0;
  const shouldIncrement = !access.link.firstViewedAt || Date.now() - last > 30 * 60 * 1000;

  await prisma.demoPilotageLink.update({
    where: { id: access.link.id },
    data: {
      ...(shouldIncrement ? { viewCount: { increment: 1 } } : {}),
      firstViewedAt: access.link.firstViewedAt ?? new Date(),
      lastViewedAt: new Date(),
      sectionsVisited: sections,
    },
  });
  return { ok: true as const };
}
