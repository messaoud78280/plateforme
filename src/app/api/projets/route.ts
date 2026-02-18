import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  if (session.user.role !== "CLIENT") {
    return NextResponse.json(
      { error: "Seuls les clients peuvent créer des projets." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const {
      title,
      description,
      notes,
      dateSouhaitee,
      deadline,
      urgency,
    } = body as {
      title?: string;
      description?: string;
      notes?: string;
      dateSouhaitee?: string;
      deadline?: string;
      urgency?: "BASSE" | "MOYENNE" | "HAUTE" | "URGENTE";
    };

    if (!title?.trim()) {
      return NextResponse.json(
        { error: "Le titre est requis." },
        { status: 400 }
      );
    }

    const validUrgency = urgency && ["BASSE", "MOYENNE", "HAUTE", "URGENTE"].includes(urgency) ? urgency : "MOYENNE";

    const project = await prisma.project.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        notes: notes?.trim() || null,
        dateSouhaitee: dateSouhaitee ? new Date(dateSouhaitee) : null,
        deadline: deadline ? new Date(deadline) : null,
        urgency: validUrgency,
        clientId: session.user.id,
      },
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error("Erreur création projet:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du projet." },
      { status: 500 }
    );
  }
}
