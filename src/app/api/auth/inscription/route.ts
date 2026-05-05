import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { SUBSCRIPTION_PLANS } from "@/lib/subscription-plans";
import { UserRole } from "@prisma/client";
import { sendAdminNewUserNotification, sendWelcomeEmail } from "@/lib/email";

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

    const emailNorm = String(email).trim().toLowerCase();

    const existing = await prisma.user.findUnique({
      where: { email: emailNorm },
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
        email: emailNorm,
        password: hashedPassword,
        name,
        role: UserRole.CLIENT, // Inscription toujours en tant que client (professionnel)
        phone: phone || undefined,
        company: company || undefined,
        formeJuridique: formeJuridique || undefined,
        secteurActivite: secteurActivite || undefined,
        service: service || undefined,
        subscriptionPlan: "STANDARD",
        monthlyActionsTotal: SUBSCRIPTION_PLANS.STANDARD.actionsIncluded,
      },
    });

    // Email de bienvenue (non bloquant : ne doit pas empêcher l'inscription)
    const baseUrl = new URL(request.url).origin;
    sendWelcomeEmail({ email: user.email, name: user.name }, { baseUrl }).catch((e) => {
      console.error("sendWelcomeEmail route error:", e);
    });

    // Notification interne équipe BeWork (non bloquant)
    sendAdminNewUserNotification({
      name: user.name,
      email: user.email,
      phone: user.phone ?? null,
      role: user.role,
      createdAt: user.createdAt,
    }).catch((e) => {
      console.error("sendAdminNewUserNotification route error:", e);
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

    // Base de données indisponible (ex: Supabase down / mauvais host / mauvais port)
    if ((err?.message ?? "").includes("Can't reach database server")) {
      return NextResponse.json(
        {
          error:
            "Service momentanément indisponible : la base de données ne répond pas. Réessayez dans quelques minutes ou contactez le support.",
        },
        { status: 503 }
      );
    }

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
