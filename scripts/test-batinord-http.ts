/**
 * ONBOARDING-1 — sessions HTTP Christopher / Nicolas / Denis.
 * npx tsx scripts/test-batinord-http.ts
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
    headers: { cookie, Accept: "text/html" },
  });
}

function isRedirect(status: number) {
  return [302, 303, 307, 308].includes(status);
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
  const demo = await prisma.demoEnvironment.findUnique({
    where: { loginIdentifier: "batinord" },
  });
  if (!demo?.organizationId) {
    console.log("SKIP HTTP — BATINORD introuvable");
    return;
  }
  const setrim = await prisma.demoEnvironment.findFirst({
    where: { loginIdentifier: { in: ["bework-demo", "setrim"] } },
  });
  if (!setrim?.organizationId) {
    console.log("SKIP HTTP — SETRIM introuvable");
    return;
  }

  const christopher = await prisma.user.findUniqueOrThrow({
    where: { id: demo.rootUserId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      personType: true,
      permissionProfile: true,
    },
  });
  const nicolas = await prisma.user.findFirst({
    where: {
      organizationMemberships: { some: { organizationId: demo.organizationId } },
      permissionProfile: "CONDUCTEUR",
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
  const denis = await prisma.user.findUniqueOrThrow({
    where: { id: setrim.rootUserId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      personType: true,
      permissionProfile: true,
    },
  });
  assert.ok(nicolas, "Nicolas BATINORD requis");

  const parc = await prisma.project.findFirst({
    where: { organizationId: demo.organizationId, title: "Résidence Parc Central" },
    select: { id: true },
  });
  const victor = await prisma.project.findFirst({
    where: { organizationId: setrim.organizationId, title: { contains: "Victor Hugo" } },
    select: { id: true },
  });
  assert.ok(parc && victor);

  const cc = await mintCookie(christopher);
  const cn = await mintCookie(nicolas);
  const cd = await mintCookie(denis);

  const dash = await hit("/dashboard", cc);
  assert.equal(dash.status, 200, `Christopher dashboard ${dash.status}`);

  const rent = await hit("/dashboard/rentabilite", cc);
  assert.equal(rent.status, 200, `Christopher rentabilité ${rent.status}`);

  const rentApi = await hit(`/api/commercial/projects/${parc.id}/profitability`, cc);
  assert.equal(rentApi.status, 200, `Christopher rentabilité Parc Central ${rentApi.status}`);

  const leakVictor = await hit(`/api/commercial/projects/${victor.id}/profitability`, cc);
  assert.ok(
    leakVictor.status === 404 || leakVictor.status === 403,
    `Christopher Victor Hugo status=${leakVictor.status}`,
  );

  const leakParc = await hit(`/api/commercial/projects/${parc.id}/profitability`, cd);
  assert.ok(
    leakParc.status === 404 || leakParc.status === 403,
    `Denis Parc Central status=${leakParc.status}`,
  );

  const nicolasRent = await hit("/dashboard/rentabilite", cn);
  assert.ok(isRedirect(nicolasRent.status), `Nicolas rentabilité ${nicolasRent.status}`);
  const loc = nicolasRent.headers.get("location") ?? "";
  assert.ok(loc.includes("/dashboard") && !loc.includes("rentabilite"), loc);

  const nicolasApi = await hit(`/api/commercial/projects/${parc.id}/profitability`, cn);
  assert.equal(nicolasApi.status, 403, "Nicolas API rentabilité");

  const quotes = await hit("/api/commercial/quotes", cc);
  assert.equal(quotes.status, 200);
  const quotesJson = (await quotes.json()) as { quotes?: Array<{ id: string; number: string }> };
  assert.ok(quotesJson.quotes?.some((q) => q.number === "DEV-BAT-2026-001"));
  assert.ok(!quotesJson.quotes?.some((q) => /ECO/i.test(q.number)));

  const denisQuotes = await hit("/api/commercial/quotes", cd);
  assert.equal(denisQuotes.status, 200);
  const denisJson = (await denisQuotes.json()) as { quotes?: Array<{ number: string }> };
  assert.ok(!denisJson.quotes?.some((q) => q.number === "DEV-BAT-2026-001"));

  console.log("OK ONBOARDING-1 HTTP");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
