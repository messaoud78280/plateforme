import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const DEMO_EMAILS = ["agence@exemple.com", "client@exemple.com"];
const PASSWORD = process.env.MOT_DE_PASSE_DEMO ?? "motdepasse123";

/**
 * POST /api/admin/update-demo-passwords?secret=XXX
 * Met à jour les mots de passe des comptes de démo (agence@exemple.com, client@exemple.com).
 * Définir UPDATE_DEMO_PASSWORDS_SECRET dans les variables Railway, puis appeler une fois cette URL.
 */
export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret") ?? request.headers.get("x-secret");
  const expected = process.env.UPDATE_DEMO_PASSWORDS_SECRET;

  if (!expected || secret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const hash = await bcrypt.hash(PASSWORD, 12);
    const results: string[] = [];

    for (const email of DEMO_EMAILS) {
      const updated = await prisma.user.updateMany({
        where: { email },
        data: { password: hash },
      });
      results.push(updated.count > 0 ? `${email}: ok` : `${email}: non trouvé`);
    }

    return NextResponse.json({
      success: true,
      message: `Mots de passe mis à jour. Connexion avec ces comptes et le mot de passe: ${PASSWORD}`,
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
