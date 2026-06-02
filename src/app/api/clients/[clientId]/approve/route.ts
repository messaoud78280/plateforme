import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { approveClientAccount } from "@/lib/client-account-approval";

function isManager(role?: string | null): boolean {
  return role === "MANAGER";
}

/** POST /api/clients/[clientId]/approve — Valider une inscription client */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  if (!isManager(session.user.role)) {
    return NextResponse.json({ error: "Réservé au gérant" }, { status: 403 });
  }

  const { clientId } = await params;
  const baseUrl = new URL(request.url).origin;
  const result = await approveClientAccount(clientId, session.user.id, { baseUrl });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ success: true, userId: result.userId, email: result.email });
}

