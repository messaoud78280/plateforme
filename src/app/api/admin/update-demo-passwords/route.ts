import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { BEWORK_TEAM, BEWORK_TEAM_PASSWORD } from "@/lib/bework-team-accounts";

const DEMO_EMAILS = ["agence@exemple.com", "client@exemple.com"];
const DEMO_PASSWORD = process.env.MOT_DE_PASSE_DEMO ?? "motdepasse123";

/**
 * POST /api/admin/update-demo-passwords?secret=XXX
 * &scope=demo|team|all
 * Met à jour les mots de passe démo et/ou équipe BeWork (gérantes + agents).
 * Définir UPDATE_DEMO_PASSWORDS_SECRET sur Railway, puis appeler une fois cette URL.
 */
export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret") ?? request.headers.get("x-secret");
  const expected = process.env.UPDATE_DEMO_PASSWORDS_SECRET;
  const scope = (searchParams.get("scope") ?? "all").toLowerCase();

  if (!expected || secret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const results: string[] = [];

    if (scope === "demo" || scope === "all") {
      const hash = await bcrypt.hash(DEMO_PASSWORD, 12);
      for (const email of DEMO_EMAILS) {
        const updated = await prisma.user.updateMany({
          where: { email },
          data: { password: hash },
        });
        results.push(updated.count > 0 ? `${email}: ok (démo)` : `${email}: non trouvé`);
      }
    }

    if (scope === "team" || scope === "all") {
      const teamHash = await bcrypt.hash(BEWORK_TEAM_PASSWORD, 12);
      for (const member of BEWORK_TEAM) {
        await prisma.user.upsert({
          where: { email: member.email },
          update: {
            name: member.name,
            role: member.role,
            password: teamHash,
            accountStatus: "APPROVED",
          },
          create: {
            email: member.email,
            name: member.name,
            role: member.role,
            password: teamHash,
            accountStatus: "APPROVED",
          },
        });
        results.push(`${member.email}: ok (équipe)`);
      }
      const bulk = await prisma.user.updateMany({
        where: { role: { in: [UserRole.MANAGER, UserRole.AGENT, UserRole.AGENCE] } },
        data: { password: teamHash, accountStatus: "APPROVED" },
      });
      results.push(`bulk MANAGER/AGENT/AGENCE: ${bulk.count} compte(s)`);
    }

    return NextResponse.json({
      success: true,
      message:
        scope === "team"
          ? `Équipe BeWork : mot de passe réinitialisé (${BEWORK_TEAM_PASSWORD}).`
          : `Mots de passe mis à jour (scope=${scope}).`,
      details: results,
    });
  } catch (e) {
    console.error("update-demo-passwords:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur serveur" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  return POST(request);
}
