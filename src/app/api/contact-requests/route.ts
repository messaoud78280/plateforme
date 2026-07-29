import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAgencyOrManager } from "@/lib/authz";

/** GET /api/contact-requests — Liste des demandes de contact / RDV (gérante et agence) */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const isAgence = isAgencyOrManager(session.user);
  if (!isAgence) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  try {
    const list = await prisma.contactRequest.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(list);
  } catch (e) {
    console.error("Contact requests list error:", e);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des demandes." },
      { status: 500 }
    );
  }
}
