import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { clientDeletionBlockersFromCounts } from "@/lib/clients/delete-client";

function isManager(role?: string | null): boolean {
  return role === "MANAGER";
}

/**
 * DELETE — suppression physique réservée aux comptes vierges.
 * Un compte portant un historique métier doit être désactivé, jamais purgé en cascade.
 */
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

  try {
    const result = await prisma.$transaction(
      async (tx) => {
        const client = await tx.user.findUnique({
          where: { id: clientId },
          select: {
            id: true,
            role: true,
            _count: true,
            followUpAlertSettings: { select: { id: true } },
          },
        });
        if (!client || client.role !== "CLIENT") {
          return { kind: "NOT_FOUND" as const };
        }

        const blockers = clientDeletionBlockersFromCounts(
          client._count as Record<string, number>,
          { hasFollowUpAlertSettings: Boolean(client.followUpAlertSettings) },
        );
        if (blockers.length > 0) {
          return { kind: "BLOCKED" as const, blockers };
        }

        // Seules les relations techniques NextAuth peuvent encore cascader.
        // Aucun fichier Storage métier n'est donc à effacer.
        await tx.user.delete({ where: { id: client.id } });
        return { kind: "DELETED" as const };
      },
      { isolationLevel: "Serializable" },
    );

    if (result.kind === "NOT_FOUND") {
      return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
    }
    if (result.kind === "BLOCKED") {
      return NextResponse.json(
        {
          error:
            "Suppression refusée : ce compte porte des données métier. Désactivez son accès pour conserver l’historique.",
          code: "CLIENT_HAS_BUSINESS_DATA",
          blockers: result.blockers,
        },
        { status: 409 },
      );
    }
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
