import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const { projectId, content } = await request.json();

    if (!projectId || !content?.trim()) {
      return NextResponse.json(
        { error: "Projet et contenu requis." },
        { status: 400 }
      );
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, title: true, clientId: true },
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
      const agenceUser = await prisma.user.findFirst({
        where: { role: { in: ["AGENCE", "MANAGER"] } },
      });
      if (!agenceUser) {
        return NextResponse.json(
          { error: "Aucun membre agence disponible." },
          { status: 400 }
        );
      }
      finalReceiverId = agenceUser.id;
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
