import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const isAgence = session.user.role === "AGENCE" || session.user.role === "MANAGER";

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { receiverId: session.user.id },
          { senderId: session.user.id },
        ],
      },
      include: {
        project: { select: { id: true, title: true } },
        sender: { select: { id: true, name: true } },
        receiver: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Erreur récupération messages:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des messages." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const { projectId, content, receiverId: bodyReceiverId } = await request.json();

    if (!projectId || !content?.trim()) {
      return NextResponse.json(
        { error: "Projet et contenu requis." },
        { status: 400 }
      );
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { assignedTo: { select: { id: true } } },
    });

    if (!project) {
      return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });
    }

    const isAgence = session.user.role === "AGENCE" || session.user.role === "MANAGER";
    let finalReceiverId: string;

    if (isAgence) {
      if (project.clientId === session.user.id) {
        return NextResponse.json(
          { error: "Accès refusé." },
          { status: 403 }
        );
      }
      finalReceiverId = project.clientId;
    } else {
      if (project.clientId !== session.user.id) {
        return NextResponse.json(
          { error: "Accès refusé à ce projet." },
          { status: 403 }
        );
      }
      if (bodyReceiverId) {
        const allowed = await prisma.user.findFirst({
          where: {
            id: bodyReceiverId,
            role: { in: ["AGENCE", "MANAGER"] },
          },
        });
        if (!allowed) {
          return NextResponse.json(
            { error: "Destinataire invalide." },
            { status: 400 }
          );
        }
        if (allowed.role === "AGENCE" && project.assignedToId !== bodyReceiverId) {
          return NextResponse.json(
            { error: "Cet agent ne suit pas ce projet." },
            { status: 400 }
          );
        }
        finalReceiverId = bodyReceiverId;
      } else {
        if (project.assignedToId) {
          finalReceiverId = project.assignedToId;
        } else {
          const manager = await prisma.user.findFirst({
            where: { role: "MANAGER" },
          });
          if (!manager) {
            const fallback = await prisma.user.findFirst({
              where: { role: { in: ["AGENCE", "MANAGER"] } },
            });
            if (!fallback) {
              return NextResponse.json(
                { error: "Aucun membre agence disponible." },
                { status: 400 }
              );
            }
            finalReceiverId = fallback.id;
          } else {
            finalReceiverId = manager.id;
          }
        }
      }
    }

    const message = await prisma.message.create({
      data: {
        content: content.trim(),
        projectId,
        senderId: session.user.id,
        receiverId: finalReceiverId,
      },
    });

    // Alerte pour l'agent quand c'est un client qui envoie le message (l'agent est le destinataire)
    if (!isAgence) {
      try {
        const sender = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { name: true },
        });
        const alertMessage = `${sender?.name ?? "Un client"} vous a envoyé un message sur le projet « ${project.title} ».`;
        try {
          await prisma.alert.create({
            data: {
              title: "Nouveau message client",
              message: alertMessage,
              level: "WARNING",
              clientId: finalReceiverId,
              actionUrl: `/dashboard/projets/${projectId}`,
            },
          });
        } catch {
          await prisma.alert.create({
            data: {
              title: "Nouveau message client",
              message: alertMessage,
              level: "WARNING",
              clientId: finalReceiverId,
            },
          });
        }
      } catch (alertErr) {
        console.error("Création alerte (nouveau message):", alertErr);
      }
    }

    return NextResponse.json(message);
  } catch (error) {
    console.error("Erreur création message:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi du message." },
      { status: 500 }
    );
  }
}
