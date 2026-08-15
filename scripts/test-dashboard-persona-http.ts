/**
 * SEC-1 — requêtes HTTP directes (si serveur + SETRIM + secret disponibles).
 * npx tsx scripts/test-dashboard-persona-http.ts
 */
import assert from "node:assert/strict";
import { loadScriptEnv } from "./load-script-env";

loadScriptEnv();
process.env.NODE_TLS_REJECT_UNAUTHORIZED ??= "0";

const BASE = process.env.SEC1_BASE_URL ?? "http://127.0.0.1:3000";

async function serverUp(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/connexion`, { redirect: "manual" });
    return res.status > 0;
  } catch {
    return false;
  }
}

async function mintCookie(opts: {
  id: string;
  email: string | null;
  name: string | null;
  role: string;
  personType: string | null;
  permissionProfile: string | null;
}): Promise<string> {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET absent");
  const { createNextAuthSessionToken, getNextAuthSessionCookieName } = await import(
    "../src/lib/auth-session-cookie"
  );
  const token = await createNextAuthSessionToken(secret, {
    id: opts.id,
    email: opts.email ?? undefined,
    name: opts.name ?? undefined,
    role: opts.role,
    personType: opts.personType,
    permissionProfile: opts.permissionProfile,
  });
  const name = getNextAuthSessionCookieName(BASE.startsWith("https"));
  return `${name}=${token}`;
}

async function hit(path: string, cookie: string) {
  return fetch(`${BASE}${path}`, {
    redirect: "manual",
    headers: { cookie },
  });
}

async function main() {
  if (!(await serverUp())) {
    console.log("SKIP HTTP — serveur indisponible (" + BASE + ")");
    return;
  }
  if (!process.env.DATABASE_URL || !process.env.NEXTAUTH_SECRET) {
    console.log("SKIP HTTP — DATABASE_URL ou NEXTAUTH_SECRET absent");
    return;
  }

  const { prisma } = await import("../src/lib/prisma");
  const org = await prisma.organization.findFirst({
    where: { name: "SETRIM" },
    select: { id: true },
  });
  if (!org) {
    console.log("SKIP HTTP — organisation SETRIM introuvable");
    return;
  }

  const users = await prisma.user.findMany({
    where: {
      organizationMemberships: { some: { organizationId: org.id } },
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      personType: true,
      permissionProfile: true,
    },
  });

  const karim = users.find((u) => u.permissionProfile === "CONDUCTEUR");
  const sophie = users.find((u) => u.permissionProfile === "CLIENT");
  const thomas = users.find((u) => u.permissionProfile === "FOURNISSEUR");
  if (!karim || !sophie || !thomas) {
    console.log("SKIP HTTP — personas SETRIM incomplets");
    return;
  }

  const ck = await mintCookie(karim);
  const cs = await mintCookie(sophie);
  const ct = await mintCookie(thomas);

  const karimRent = await hit("/dashboard/rentabilite", ck);
  assert.ok(
    [302, 303, 307, 308].includes(karimRent.status),
    `Karim rentabilité status=${karimRent.status}`,
  );
  const locK = karimRent.headers.get("location") ?? "";
  assert.ok(locK.includes("/dashboard") && !locK.includes("rentabilite"), locK);

  const karimDep = await hit("/api/supplier-invoices", ck);
  assert.equal(karimDep.status, 403, "Karim API dépenses");

  const karimComm = await hit("/api/commercial/quotes", ck);
  assert.ok(
    karimComm.status === 200 || karimComm.status === 403,
    `Karim commercial API ${karimComm.status} (200 attendu si org OK)`,
  );

  const sophieRent = await hit("/dashboard/rentabilite", cs);
  assert.ok([302, 303, 307, 308].includes(sophieRent.status));
  const sophieFour = await hit("/api/suppliers", cs);
  assert.equal(sophieFour.status, 403, "Sophie API fournisseurs");
  const sophiePilot = await hit("/dashboard/pilotage-travaux", cs);
  assert.ok([302, 303, 307, 308].includes(sophiePilot.status));

  const thomasRent = await hit("/dashboard/rentabilite", ct);
  assert.ok([302, 303, 307, 308].includes(thomasRent.status));
  const thomasDep = await hit("/api/supplier-invoices", ct);
  assert.equal(thomasDep.status, 403, "Thomas API dépenses");
  const thomasComm = await hit("/api/commercial/quotes", ct);
  assert.equal(thomasComm.status, 403, "Thomas API commercial");

  console.log("✓ test-dashboard-persona-http OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
