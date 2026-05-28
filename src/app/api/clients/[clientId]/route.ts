import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteClientStorageFiles } from "@/lib/clients/delete-client";
import { createServiceRoleClient } from "@/lib/supabase";

function isManager(role?: string | null): boolean {
  return role === "MANAGER";
}

/** DELETE — Supprimer un compte client et ses données (cascade Prisma + fichiers Storage). */
export async function DELETE(
  _request: Request,
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
  if (clientId === session.user.id) {
    return NextResponse.json({ error: "Impossible de supprimer votre propre compte." }, { status: 400 });
  }

  const client = await prisma.user.findUnique({
    where: { id: clientId },
    select: {
      id: true,
      role: true,
      name: true,
      email: true,
      _count: { select: { projects: true, tasks: true } },
    },
  });

  if (!client || client.role !== "CLIENT") {
    return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
  }

  const supabase = createServiceRoleClient();
  if (supabase) {
    try {
      await deleteClientStorageFiles(supabase, clientId);
    } catch (e) {
      console.error("deleteClientStorageFiles:", e);
    }
  }

  try {
    await prisma.user.delete({ where: { id: clientId } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Suppression client:", e);
    return NextResponse.json(
      {
        error:
          "Impossible de supprimer ce client. Vérifiez qu’aucune donnée bloquante ne subsiste, ou contactez le support.",
      },
      { status: 500 }
    );
  }
}
