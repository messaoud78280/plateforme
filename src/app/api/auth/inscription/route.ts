import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { isWellFormedEmail } from "@/lib/email-validation";
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

    const emailRaw = String(email).trim();
    if (!isWellFormedEmail(emailRaw)) {
      return NextResponse.json(
        {
          error:
            "Adresse email invalide ou incomplète (ex. il manque « .com », « .fr » après votre fournisseur @gmail, @yahoo, etc.).",
        },
        { status: 400 }
      );
    }

    const emailNorm = emailRaw.toLowerCase();

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
    const err = error as { code?: string; message?: string; meta?: { target?: unknown } };
    console.error("Erreur inscription:", err?.code ?? "", err?.message ?? error);

    const msg = (err?.message ?? "").toLowerCase();

    // Base / connexion Postgres (Supabase, Railway…)
    if (
      msg.includes("can't reach database server") ||
      msg.includes("server has closed the connection") ||
      err?.code === "P1001" ||
      err?.code === "P1017"
    ) {
      return NextResponse.json(
        {
          error:
            "La base de données est injoignable depuis le serveur. Vérifiez DATABASE_URL (pooler SSL) et le pare-feu sur le tableau d’hébergement.",
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
    // Table ou colonne absente — souvent après déploiement sans prisma db push
    if (
      err?.code === "P2021" ||
      err?.code === "P2010" ||
      err?.code === "P2022" ||
      msg.includes("does not exist") ||
      (msg.includes("column") && msg.includes("not found"))
    ) {
      return NextResponse.json(
        {
          error:
            "Schéma base de données non à jour sur ce serveur. Exécutez « npx prisma db push » sur la base de production puis redémarrez.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Erreur lors de l'inscription. Réessayez ou contactez le support." },
      { status: 500 }
    );
  }
}
