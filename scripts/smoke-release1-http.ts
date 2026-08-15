/**
 * RELEASE-1 — smoke HTTP réel (pages rendues + SEC-1).
 * npx tsx scripts/smoke-release1-http.ts
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
    throw new Error("Serveur indisponible " + BASE);
  }
  const { prisma } = await import("../src/lib/prisma");
  const org = await prisma.organization.findFirst({
    where: { name: "SETRIM" },
    select: { id: true },
  });
  if (!org) throw new Error("SETRIM introuvable");

  const users = await prisma.user.findMany({
    where: { organizationMemberships: { some: { organizationId: org.id } } },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      personType: true,
      permissionProfile: true,
    },
  });
  const denis = users.find((u) => u.permissionProfile === "DIRECTION");
  const julie = users.find((u) => u.permissionProfile === "ADMINISTRATIF");
  const karim = users.find((u) => u.permissionProfile === "CONDUCTEUR");
  const sophie = users.find((u) => u.permissionProfile === "CLIENT");
  const thomas = users.find((u) => u.permissionProfile === "FOURNISSEUR");
  if (!denis || !julie || !karim || !sophie || !thomas) {
    throw new Error("Personas SETRIM incomplets");
  }

  const cookies = {
    denis: await mintCookie(denis),
    julie: await mintCookie(julie),
    karim: await mintCookie(karim),
    sophie: await mintCookie(sophie),
    thomas: await mintCookie(thomas),
  };

  const project = await prisma.project.findFirst({
    where: { organizationId: org.id, title: { contains: "Victor Hugo" } },
    select: { id: true, title: true },
  });
  const quote = await prisma.commercialQuote.findFirst({
    where: { organizationId: org.id, number: "DEV-ECO-2026-001" },
    select: { id: true },
  });
  const po = await prisma.purchaseOrder.findFirst({
    where: { organizationId: org.id, number: { startsWith: "BC-ECO-" } },
    select: { id: true, number: true },
  });
  const sheet = await prisma.followUpSheet.findFirst({
    where: { projectId: project?.id ?? "__none__", status: "A_FACTURER" },
    select: { id: true },
  });

  // Denis — pages autorisées
  for (const path of [
    "/dashboard",
    "/dashboard/projets",
    "/dashboard/rentabilite",
    "/dashboard/depenses",
    "/dashboard/fournisseurs",
    "/dashboard/devis-facturation",
    "/dashboard/commandes",
    "/dashboard/documents",
    "/dashboard/messagerie",
    "/dashboard/facturation",
    "/dashboard/a-traiter",
    "/dashboard/agenda",
    "/dashboard/planning",
  ]) {
    const res = await hit(path, cookies.denis);
    assert.equal(res.status, 200, `Denis ${path} status=${res.status}`);
    const html = await res.text();
    assert.ok(!html.includes("Unhandled Runtime"), `Denis ${path} runtime`);
    assert.ok(!/Application error/i.test(html), `Denis ${path} app error`);
  }

  if (project) {
    const res = await hit(`/dashboard/projets/${project.id}`, cookies.denis);
    assert.equal(res.status, 200, "Denis chantier");
    const html = await res.text();
    assert.ok(/Victor Hugo|250\s?000|180\s?000|70\s?000/i.test(html), "Denis chantier chiffres/titre");
  }
  if (quote) {
    const res = await hit(`/dashboard/devis-facturation/devis/${quote.id}`, cookies.denis);
    assert.ok(res.status === 200 || isRedirect(res.status), `Denis devis ${res.status}`);
  }
  if (po) {
    const res = await hit(`/dashboard/commandes/${po.id}`, cookies.denis);
    assert.equal(res.status, 200, "Denis commande");
    const html = await res.text();
    assert.ok(html.includes("Préparer") || html.includes("facture"), "Denis action facture");
  }

  // Julie — finances OK
  const julieRent = await hit("/dashboard/rentabilite", cookies.julie);
  assert.equal(julieRent.status, 200, "Julie rentabilité");

  // Karim — refus finances
  for (const path of [
    "/dashboard/rentabilite",
    "/dashboard/depenses",
    "/dashboard/fournisseurs",
    "/dashboard/pilotage-travaux",
    "/dashboard/rapports",
    "/dashboard/equipe",
  ]) {
    const res = await hit(path, cookies.karim);
    assert.ok(isRedirect(res.status), `Karim ${path} attendu redirect, got ${res.status}`);
    const loc = res.headers.get("location") ?? "";
    assert.ok(loc.includes("/dashboard") && !loc.includes(path.split("/").pop() ?? "___"), loc);
  }
  const karimDash = await hit("/dashboard", cookies.karim);
  assert.equal(karimDash.status, 200, "Karim dashboard");
  const karimDashHtml = await karimDash.text();
  assert.ok(!karimDashHtml.includes("Voir la rentabilité"), "Karim accueil sans CTA rentabilité");
  const karimComm = await hit("/dashboard/devis-facturation", cookies.karim);
  assert.equal(karimComm.status, 200, "Karim commercial");
  const karimPoApi = await hit("/api/supplier-invoices", cookies.karim);
  assert.equal(karimPoApi.status, 403, "Karim API dépenses 403");
  if (po) {
    const res = await hit(`/dashboard/commandes/${po.id}`, cookies.karim);
    assert.equal(res.status, 200, "Karim commande");
    const html = await res.text();
    assert.ok(!html.includes("Préparer la facture fournisseur"), "Karim sans CTA facture FO");
    assert.ok(!html.includes("Ajouter / préparer une facture"), "Karim sans CTA ajouter facture");
  }
  if (sheet && project) {
    const href = `/dashboard/devis-facturation/factures/preparer?projectId=${project.id}&sheetId=${sheet.id}`;
    const res = await hit(href, cookies.karim);
    assert.equal(res.status, 200, "Karim préparer facturation");
  }

  // Sophie
  for (const path of [
    "/dashboard/rentabilite",
    "/dashboard/depenses",
    "/dashboard/fournisseurs",
    "/dashboard/devis-facturation",
    "/dashboard/equipe",
  ]) {
    const res = await hit(path, cookies.sophie);
    assert.ok(isRedirect(res.status), `Sophie ${path} ${res.status}`);
  }
  assert.equal((await hit("/dashboard", cookies.sophie)).status, 200, "Sophie dashboard");
  assert.equal((await hit("/api/suppliers", cookies.sophie)).status, 403, "Sophie API fournisseurs");

  // Thomas
  for (const path of [
    "/dashboard/rentabilite",
    "/dashboard/depenses",
    "/dashboard/devis-facturation",
    "/dashboard/projets",
  ]) {
    const res = await hit(path, cookies.thomas);
    assert.ok(isRedirect(res.status), `Thomas ${path} ${res.status}`);
  }
  assert.equal((await hit("/dashboard/commandes", cookies.thomas)).status, 200, "Thomas commandes");
  assert.equal((await hit("/api/commercial/quotes", cookies.thomas)).status, 403, "Thomas API commercial");

  console.log("✓ smoke-release1-http OK");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
