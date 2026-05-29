import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createClientUser } from "@/lib/clients/create-client-user";

function isManager(role?: string | null): boolean {
  return role === "MANAGER";
}

/** POST — Créer un compte client entreprise (gérant uniquement). */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  if (!isManager(session.user.role)) {
    return NextResponse.json({ error: "Réservé au gérant" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const baseUrl = new URL(request.url).origin;
  const result = await createClientUser(
    {
      email: String(body.email ?? ""),
      password: String(body.password ?? ""),
      name: String(body.name ?? ""),
      company: String(body.company ?? ""),
      formeJuridique: String(body.formeJuridique ?? ""),
      phone: body.phone ? String(body.phone) : undefined,
      secteurActivite: body.secteurActivite ? String(body.secteurActivite) : undefined,
      service: body.service ? String(body.service) : undefined,
    },
    { baseUrl, notifyWelcome: true }
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    id: result.user.id,
    email: result.user.email,
    name: result.user.name,
    company: result.user.company,
  });
}
