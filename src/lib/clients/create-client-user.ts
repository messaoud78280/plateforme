import bcrypt from "bcryptjs";
import { ContractStatus, Prisma, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isWellFormedEmail } from "@/lib/email-validation";
import { isValidFormeJuridique, isValidSecteurActivite } from "@/lib/client-profile-options";
import { SUBSCRIPTION_PLANS } from "@/lib/subscription-plans";
import { buildCreditsGrantUpdate } from "@/lib/credits-lifecycle";
import { sendAdminNewUserNotification, sendWelcomeEmail } from "@/lib/email";

export type CreateClientInput = {
  email: string;
  password: string;
  name: string;
  company: string;
  formeJuridique: string;
  phone?: string;
  secteurActivite?: string;
  service?: string;
  subscriptionPlan?: keyof typeof SUBSCRIPTION_PLANS;
  contractStatus?: ContractStatus;
};

export type CreateClientResult =
  | { ok: true; user: { id: string; email: string; name: string; company: string | null } }
  | { ok: false; status: number; error: string };

export async function createClientUser(
  input: CreateClientInput,
  options?: { baseUrl?: string; notifyWelcome?: boolean }
): Promise<CreateClientResult> {
  const emailRaw = String(input.email).trim();
  if (!isWellFormedEmail(emailRaw)) {
    return {
      ok: false,
      status: 400,
      error: "Adresse email invalide ou incomplète.",
    };
  }

  const emailNorm = emailRaw.toLowerCase();
  const name = String(input.name).trim();
  const company = String(input.company).trim();
  const formeJuridique = String(input.formeJuridique).trim();
  const password = String(input.password);

  if (!name || !company || !formeJuridique) {
    return {
      ok: false,
      status: 400,
      error: "Nom du contact, raison sociale et forme juridique sont requis.",
    };
  }

  if (!isValidFormeJuridique(formeJuridique)) {
    return { ok: false, status: 400, error: "Forme juridique invalide." };
  }

  if (input.secteurActivite && !isValidSecteurActivite(input.secteurActivite)) {
    return { ok: false, status: 400, error: "Secteur d'activité invalide." };
  }

  if (password.length < 8) {
    return {
      ok: false,
      status: 400,
      error: "Le mot de passe doit contenir au moins 8 caractères.",
    };
  }

  const existing = await prisma.user.findUnique({ where: { email: emailNorm } });
  if (existing) {
    return { ok: false, status: 400, error: "Un compte existe déjà avec cet email." };
  }

  const planKey = input.subscriptionPlan ?? "STANDARD";
  const plan = SUBSCRIPTION_PLANS[planKey];
  if (!plan) {
    return { ok: false, status: 400, error: "Forfait invalide." };
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  try {
    const user = await prisma.user.create({
      data: {
        email: emailNorm,
        password: hashedPassword,
        name,
        role: UserRole.CLIENT,
        company,
        formeJuridique,
        phone: input.phone?.trim() || undefined,
        secteurActivite: input.secteurActivite?.trim() || undefined,
        service: input.service?.trim() || undefined,
        subscriptionPlan: planKey,
        ...buildCreditsGrantUpdate(plan.actionsIncluded),
        contractStatus: input.contractStatus ?? ContractStatus.SIGNED,
      },
      select: { id: true, email: true, name: true, company: true, phone: true, role: true, createdAt: true },
    });

    if (options?.notifyWelcome !== false && options?.baseUrl) {
      sendWelcomeEmail({ email: user.email, name: user.name }, { baseUrl: options.baseUrl }).catch((e) => {
        console.error("sendWelcomeEmail createClientUser:", e);
      });
      sendAdminNewUserNotification({
        name: user.name,
        email: user.email,
        phone: user.phone ?? null,
        company: user.company ?? null,
        role: user.role,
        createdAt: user.createdAt,
      }).catch((e) => {
        console.error("sendAdminNewUserNotification createClientUser:", e);
      });
    }

    return { ok: true, user };
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, status: 400, error: "Un compte existe déjà avec cet email." };
    }
    console.error("createClientUser:", error);
    return { ok: false, status: 500, error: "Impossible de créer le compte client." };
  }
}
