import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { countATraiter } from "@/lib/a-traiter/collect";

/** GET /api/a-traiter/count — Badge nav « À traiter » */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const total = await countATraiter({
      id: session.user.id,
      role: session.user.role,
      personType: session.user.personType ?? null,
    });
    return NextResponse.json({ total });
  } catch (e) {
    console.error("[a-traiter/count]", e);
    return NextResponse.json({ total: 0 });
  }
}
