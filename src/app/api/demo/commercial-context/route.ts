import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isDemoEmail } from "@/lib/demo-environment/constants";
import { loadDemoCommercialContext } from "@/lib/demo-environment/commercial-tour-context";

async function resolveDemoOrg(userId: string, demoRootUserId?: string | null) {
  return prisma.demoEnvironment.findFirst({
    where: {
      OR: [
        { rootUserId: userId },
        { organization: { members: { some: { userId } } } },
        ...(demoRootUserId ? [{ rootUserId: demoRootUserId }] : []),
      ],
    },
    select: { id: true, organizationId: true, companyName: true },
  });
}

/** GET — contexte live BC-2026-043 pour le parcours commercial (DEMO only). */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.isDemo) {
    return NextResponse.json({ error: "Réservé à la démonstration" }, { status: 403 });
  }
  if (!isDemoEmail(session.user.email)) {
    return NextResponse.json({ error: "Compte non démo" }, { status: 403 });
  }

  const secret = process.env.NEXTAUTH_SECRET;
  const token = secret ? await getToken({ req: request, secret }) : null;
  const demo = await resolveDemoOrg(
    session.user.id,
    (typeof token?.demoRootUserId === "string" ? token.demoRootUserId : null) ??
      session.user.demoRootUserId ??
      null,
  );

  if (!demo?.organizationId) {
    return NextResponse.json({ error: "Environnement démo introuvable" }, { status: 404 });
  }

  const context = await loadDemoCommercialContext(demo.organizationId);
  return NextResponse.json(
    {
      ok: true,
      companyName: demo.companyName,
      demoEnvironmentId: demo.id,
      context,
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
