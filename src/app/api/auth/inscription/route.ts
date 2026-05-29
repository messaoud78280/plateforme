import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { isWellFormedEmail } from "@/lib/email-validation";
import { isValidFormeJuridique, isValidSecteurActivite } from "@/lib/client-profile-options";
import { SUBSCRIPTION_PLANS } from "@/lib/subscription-plans";
import { Prisma, UserRole } from "@prisma/client";
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

    if (!email || !password || !name || !company || !formeJuridique) {
      return NextResponse.json(
        { error: "Email, mot de passe, nom du contact, raison sociale et forme juridique sont requis." },
        { status: 400 }
      );
    }

    const companyTrim = String(company).trim();
    const formeTrim = String(formeJuridique).trim();
    if (!companyTrim) {
      return NextResponse.json({ error: "La raison sociale est requise." }, { status: 400 });
    }
    if (!isValidFormeJuridique(formeTrim)) {
      return NextResponse.json({ error: "Forme juridique invalide." }, { status: 400 });
    }
    if (secteurActivite && !isValidSecteurActivite(String(secteurActivite))) {
      return NextResponse.json({ error: "Secteur d'activité invalide." }, { status: 400 });
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
        company: companyTrim,
        formeJuridique: formeTrim,
        secteurActivite: secteurActivite || undefined,
        service: service || undefined,
        subscriptionPlan: "STANDARD",
        monthlyActionsTotal: SUBSCRIPTION_PLANS.STANDARD.actionsIncluded,
      },
    });

    // Email de bienvenue (non bloquant : ne doit pas empêcher l'inscription)
    const baseUrl = new URL(request.url).origin;
    sendWelcomeEmail({ email: user.email, name: user.name }, { baseUrl }).then((r) => {
      if (!r.ok) {
        console.error("[inscription] Mail de bienvenue non envoyé — raison:", r.reason);
      }
    }).catch((e) => {
      console.error("sendWelcomeEmail route error:", e);
    });

    // Notification interne équipe BeWork (non bloquant)
    sendAdminNewUserNotification({
      name: user.name,
      email: user.email,
      phone: user.phone ?? null,
      company: user.company ?? null,
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
    console.error("Erreur inscription:", error);

    const msg = (error instanceof Error ? error.message : String(error)).toLowerCase();

    // Connexion DB : Prisma met le code dans `errorCode`, pas dans `code`
    if (error instanceof Prisma.PrismaClientInitializationError) {
      const c = error.errorCode ?? "";
      if (["P1001", "P1000", "P1011", "P1017"].includes(c) || msg.includes("can't reach database server")) {
        return NextResponse.json(
          {
            error:
              "La base de données est injoignable depuis le serveur (credentials, SSL ou réseau). Vérifiez DATABASE_URL sur Railway (pooler Supabase + sslmode=require).",
          },
          { status: 503 }
        );
      }
    }

    // Erreurs Prisma métier connues (colonne manquante, contrainte, etc.)
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (["P1001", "P1017"].includes(error.code)) {
        return NextResponse.json(
          {
            error:
              "Impossible de joindre la base de données. Vérifiez DATABASE_URL et que Supabase autorise Railway (sans IP bloquée).",
          },
          { status: 503 }
        );
      }
      if (error.code === "P2002") {
        return NextResponse.json(
          { error: "Un compte existe déjà avec cet email." },
          { status: 400 }
        );
      }
      if (
        error.code === "P2021" ||
        error.code === "P2010" ||
        error.code === "P2022" ||
        msg.includes("does not exist") ||
        (msg.includes("column") && msg.includes("not found"))
      ) {
        return NextResponse.json(
          {
            error:
              "Schéma PostgreSQL incomplet pour ce déploiement. Connectez DATABASE_URL prod et exécutez : npx prisma db push",
          },
          { status: 503 }
        );
      }
    }

    if (error instanceof Prisma.PrismaClientValidationError) {
      return NextResponse.json(
        { error: "Données invalides pour la création du compte. Vérifiez le formulaire." },
        { status: 400 }
      );
    }

    if (
      msg.includes("can't reach database server") ||
      msg.includes("server has closed the connection") ||
      msg.includes("authentication failed")
    ) {
      return NextResponse.json(
        {
          error:
            "Erreur de connexion à PostgreSQL (URL ou mot de passe). Vérifiez DATABASE_URL sur l’hébergeur.",
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
