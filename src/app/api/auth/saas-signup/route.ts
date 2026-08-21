import { NextResponse } from "next/server";
import { createSaasWorkspace } from "@/lib/organization/create-workspace";

/**
 * POST /api/auth/saas-signup
 * Inscription publique SaaS — crée User + Organization TRIAL 14 j (espace vide).
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

  const email = typeof body.email === "string" ? body.email : "";
  const password = typeof body.password === "string" ? body.password : "";
  const firstName = typeof body.firstName === "string" ? body.firstName : "";
  const lastName = typeof body.lastName === "string" ? body.lastName : "";
  const companyName = typeof body.companyName === "string" ? body.companyName : "";

  const result = await createSaasWorkspace({
    email,
    password,
    firstName,
    lastName,
    companyName,
  });

  if (!result.ok) {
    const status =
      result.code === "EMAIL_TAKEN" ? 409 : result.code === "VALIDATION" ? 400 : 500;
    return NextResponse.json({ error: result.error, code: result.code }, { status });
  }

  return NextResponse.json({
    ok: true,
    organizationId: result.organizationId,
    trialEndsAt: result.trialEndsAt?.toISOString() ?? null,
    trialDays: result.trialDays,
  });
}
