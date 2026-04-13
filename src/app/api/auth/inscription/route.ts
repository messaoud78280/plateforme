import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      email,
      password,
      name,
      phone,
      company,
      formeJuridique,
      secteurActivite,
      service,
    } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Email, mot de passe et nom du contact sont requis." },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Un compte existe déjà avec cet email." },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: UserRole.CLIENT, // Inscription toujours en tant que client (professionnel)
        phone: phone || undefined,
        company: company || undefined,
        formeJuridique: formeJuridique || undefined,
        secteurActivite: secteurActivite || undefined,
        service: service || undefined,
        subscriptionPlan: "STANDARD",
        monthlyActionsTotal: 185, // Standard : ~37 h = 185 actions × 12 min
      },
    });

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    console.error("Erreur inscription:", err?.message ?? error);

    // Contrainte unique (email déjà pris malgré le findUnique)
    if (err?.code === "P2002") {
      return NextResponse.json(
        { error: "Un compte existe déjà avec cet email." },
        { status: 400 }
      );
    }
    // Table ou colonne absente en base
    if (err?.code === "P2021" || err?.code === "P2010") {
      return NextResponse.json(
        { error: "Configuration base de données incomplète. Contactez l'administrateur." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Erreur lors de l'inscription. Réessayez ou contactez le support." },
      { status: 500 }
    );
  }
}
