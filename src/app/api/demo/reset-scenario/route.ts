import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isDemoEmail } from "@/lib/demo-environment/constants";
import { resetDemoEnvironment } from "@/lib/demo-environment/service";

/**
 * POST — réinitialise le scénario démo (seed v4).
 * Réservé DEMO. Ne change pas le persona (reset ≠ Voir comme).
 * Action volontaire avec confirmation côté UI.
 */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.isDemo) {
    return NextResponse.json({ error: "Réservé à la démonstration" }, { status: 403 });
  }
  if (!isDemoEmail(session.user.email)) {
    return NextResponse.json({ error: "Compte non démo" }, { status: 403 });
  }

  // Direction (root ou profil DIRECTION) uniquement — pas les portails externes
  const profile = session.user.permissionProfile;
  const personType = session.user.personType;
  const isInternalDirection =
    personType === "INTERNAL" && (profile === "DIRECTION" || !profile);
  const isRoot =
    session.user.id === session.user.demoRootUserId ||
    session.user.demoViewAs === "direction" ||
    !session.user.demoViewAs;

  if (!isInternalDirection && !isRoot) {
    return NextResponse.json(
      { error: "Réinitialisation réservée au profil Direction de la démo." },
      { status: 403 },
    );
  }

  const demoId =
    session.user.demoEnvironmentId ??
    (
      await prisma.demoEnvironment.findFirst({
        where: {
          OR: [
            { rootUserId: session.user.demoRootUserId ?? session.user.id },
            { organization: { members: { some: { userId: session.user.id } } } },
          ],
        },
        select: { id: true },
      })
    )?.id;

  if (!demoId) {
    return NextResponse.json({ error: "Environnement démo introuvable" }, { status: 404 });
  }

  const result = await resetDemoEnvironment(demoId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true, reset: "scenario" });
}
