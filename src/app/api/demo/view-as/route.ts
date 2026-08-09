import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isDemoEmail } from "@/lib/demo-environment/constants";
import {
  DEMO_PERSONA_KEYS,
  DEMO_PERSONAS,
  isDemoPersonaKey,
  type DemoPersonaKey,
} from "@/lib/demo-environment/personas";
import { listDemoPersonaUsers, seedDemoPersonaUsers } from "@/lib/demo-environment/seed-personas";
import {
  createNextAuthSessionToken,
  getNextAuthSessionCookieName,
  nextAuthSessionCookieOptions,
} from "@/lib/auth-session-cookie";

async function loadDemoForSession(userId: string, demoRootUserId?: string | null) {
  return prisma.demoEnvironment.findFirst({
    where: {
      OR: [
        { rootUserId: userId },
        { organization: { members: { some: { userId } } } },
        ...(demoRootUserId ? [{ rootUserId: demoRootUserId }] : []),
      ],
    },
    select: {
      id: true,
      rootUserId: true,
      loginIdentifier: true,
      organizationId: true,
      companyName: true,
    },
  });
}

/**
 * POST { persona: "direction"|"conducteur"|"client"|"fournisseur" }
 * Bascule la session JWT vers un persona du même environnement démo.
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.isDemo) {
    return NextResponse.json({ error: "Réservé à la démonstration" }, { status: 403 });
  }
  if (!isDemoEmail(session.user.email)) {
    return NextResponse.json({ error: "Compte non démo" }, { status: 403 });
  }

  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Configuration auth manquante" }, { status: 500 });
  }

  const body = await request.json().catch(() => ({}));
  const personaRaw = body.persona;

  const token = await getToken({ req: request, secret });
  if (!token?.id) {
    return NextResponse.json({ error: "Session invalide" }, { status: 401 });
  }

  const demo = await loadDemoForSession(
    session.user.id,
    typeof token.demoRootUserId === "string" ? token.demoRootUserId : null
  );
  if (!demo?.organizationId) {
    return NextResponse.json({ error: "Environnement démo introuvable" }, { status: 404 });
  }

  const demoRootUserId = demo.rootUserId;

  let personas = await listDemoPersonaUsers({
    rootUserId: demoRootUserId,
    loginIdentifier: demo.loginIdentifier,
  });
  if (personas.length < DEMO_PERSONA_KEYS.length) {
    await seedDemoPersonaUsers({
      rootUserId: demoRootUserId,
      organizationId: demo.organizationId,
      loginIdentifier: demo.loginIdentifier,
      companyName: demo.companyName,
    });
    personas = await listDemoPersonaUsers({
      rootUserId: demoRootUserId,
      loginIdentifier: demo.loginIdentifier,
    });
  }

  // Pas de cohérence Victor Hugo / Kanban ici : trop lourd sur le hot path « Voir comme ».
  // Ces ensure* restent sur le seed démo uniquement.

  let targetKey: DemoPersonaKey = "direction";
  if (personaRaw === null || personaRaw === "direction" || personaRaw === "") {
    targetKey = "direction";
  } else if (typeof personaRaw === "string" && isDemoPersonaKey(personaRaw)) {
    targetKey = personaRaw;
  } else {
    return NextResponse.json({ error: "Persona invalide" }, { status: 400 });
  }

  const target = personas.find((p) => p.key === targetKey);
  if (!target) {
    return NextResponse.json({ error: "Persona non provisionné" }, { status: 404 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: target.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      contractStatus: true,
      accountStatus: true,
      personType: true,
      permissionProfile: true,
    },
  });
  if (!dbUser) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }

  const newToken = {
    ...token,
    id: dbUser.id,
    sub: dbUser.id,
    email: dbUser.email,
    name: dbUser.name,
    role: dbUser.role,
    contractStatus: dbUser.contractStatus,
    accountStatus: dbUser.accountStatus,
    personType: dbUser.personType,
    permissionProfile: dbUser.permissionProfile,
    isDemo: true,
    demoEnvironmentId: demo.id,
    demoCompanyName: demo.companyName,
    demoRootUserId,
    demoViewAs: targetKey,
  };

  const jwt = await createNextAuthSessionToken(secret, newToken as never);
  const secure = process.env.NEXTAUTH_URL?.startsWith("https://") ?? false;
  const cookieName = getNextAuthSessionCookieName(secure);
  const res = NextResponse.json({
    ok: true,
    persona: targetKey,
    label: DEMO_PERSONAS[targetKey].label,
    user: { id: dbUser.id, name: dbUser.name, email: dbUser.email },
  });
  res.cookies.set(cookieName, jwt, nextAuthSessionCookieOptions(secure));
  return res;
}

/** GET — liste des personas + persona courant. */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.isDemo) {
    return NextResponse.json({ error: "Réservé à la démonstration" }, { status: 403 });
  }

  const secret = process.env.NEXTAUTH_SECRET;
  const token = secret ? await getToken({ req: request, secret }) : null;
  const demo = await loadDemoForSession(
    session.user.id,
    (typeof token?.demoRootUserId === "string" ? token.demoRootUserId : null) ??
      session.user.demoRootUserId ??
      null
  );
  if (!demo?.organizationId) {
    return NextResponse.json({ personas: [], current: null });
  }

  let personas = await listDemoPersonaUsers({
    rootUserId: demo.rootUserId,
    loginIdentifier: demo.loginIdentifier,
  });
  if (personas.length < DEMO_PERSONA_KEYS.length) {
    await seedDemoPersonaUsers({
      rootUserId: demo.rootUserId,
      organizationId: demo.organizationId,
      loginIdentifier: demo.loginIdentifier,
      companyName: demo.companyName,
    });
    personas = await listDemoPersonaUsers({
      rootUserId: demo.rootUserId,
      loginIdentifier: demo.loginIdentifier,
    });
  }

  // GET : lecture seule — pas de réécriture métier (évite conflits Kanban / statuts)

  const currentKey =
    (typeof token?.demoViewAs === "string" && isDemoPersonaKey(token.demoViewAs)
      ? token.demoViewAs
      : null) ??
    personas.find((p) => p.id === session.user.id)?.key ??
    (session.user.id === demo.rootUserId ? "direction" : null);

  return NextResponse.json({
    personas: personas.map((p) => ({
      key: p.key,
      label: DEMO_PERSONAS[p.key].label,
      name: p.name,
      email: p.email,
      id: p.id,
    })),
    current: currentKey,
    companyName: demo.companyName,
  });
}
