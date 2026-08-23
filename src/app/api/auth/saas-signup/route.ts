import { NextResponse } from "next/server";
import { createSaasWorkspace } from "@/lib/organization/create-workspace";
import { createClientApprovalToken } from "@/lib/client-account-approval";
import {
  sendAdminSaasTrialRequestNotification,
  sendSaasTrialRequestReceivedEmail,
} from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { publicAppOriginForEmails } from "@/lib/site";

/**
 * POST /api/auth/saas-signup
 * Demande d’essai SaaS — compte PENDING jusqu’à validation BeWork (email / dashboard clients).
 * Désactivable : SAAS_PUBLIC_SIGNUP=0
 */
export async function POST(request: Request) {
  if (process.env.SAAS_PUBLIC_SIGNUP === "0" || process.env.SAAS_PUBLIC_SIGNUP === "false") {
    return NextResponse.json(
      { error: "Les inscriptions publiques sont temporairement fermées." },
      { status: 403 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const str = (k: string) => (typeof body[k] === "string" ? (body[k] as string) : "");

  const result = await createSaasWorkspace({
    email: str("email"),
    password: str("password"),
    firstName: str("firstName"),
    lastName: str("lastName"),
    companyName: str("companyName"),
    siret: str("siret"),
    phone: str("phone"),
    addressLine1: str("addressLine1"),
    addressLine2: str("addressLine2") || undefined,
    postalCode: str("postalCode"),
    city: str("city"),
    companySize: str("companySize"),
    corpsMetier: str("corpsMetier"),
  });

  if (!result.ok) {
    const status =
      result.code === "EMAIL_TAKEN" ? 409 : result.code === "VALIDATION" ? 400 : 500;
    return NextResponse.json({ error: result.error, code: result.code }, { status });
  }

  // Jamais localhost dans les emails (sinon ERR_CONNECTION_REFUSED chez le destinataire).
  const baseUrl = publicAppOriginForEmails(new URL(request.url).origin);
  let approveUrl: string | null = null;
  try {
    const token = createClientApprovalToken(result.userId);
    approveUrl = `${baseUrl}/api/clients/approve-by-token?token=${encodeURIComponent(token)}`;
  } catch (e) {
    console.error("[saas-signup] Token approbation non généré:", e);
  }

  const user = await prisma.user.findUnique({
    where: { id: result.userId },
    select: {
      name: true,
      email: true,
      phone: true,
      company: true,
      createdAt: true,
      billingAddressLine1: true,
      billingAddressLine2: true,
      billingPostalCode: true,
      billingCity: true,
      secteurActivite: true,
      service: true,
    },
  });
  const org = await prisma.organization.findUnique({
    where: { id: result.organizationId },
    select: { siret: true },
  });

  const address = [
    user?.billingAddressLine1,
    user?.billingAddressLine2,
    [user?.billingPostalCode, user?.billingCity].filter(Boolean).join(" "),
  ]
    .filter(Boolean)
    .join(", ");

  sendAdminSaasTrialRequestNotification(
    {
      name: user?.name,
      email: user?.email,
      phone: user?.phone,
      company: user?.company,
      siret: org?.siret,
      address,
      companySize: user?.service,
      corpsMetier: user?.secteurActivite,
      createdAt: user?.createdAt,
    },
    { approveUrl },
  ).catch((e) => console.error("sendAdminSaasTrialRequestNotification:", e));

  if (user?.email) {
    sendSaasTrialRequestReceivedEmail({
      email: user.email,
      name: user.name,
      company: user.company,
    }).catch((e) => console.error("sendSaasTrialRequestReceivedEmail:", e));
  }

  return NextResponse.json({
    ok: true,
    pendingApproval: true,
    organizationId: result.organizationId,
    trialDays: result.trialDays,
  });
}
