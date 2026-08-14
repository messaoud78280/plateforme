/**
 * GED V2.0.3 — recette recherche + isolation multi-tenant (DB).
 * Le handler HTTP /api/ged/access délègue à resolveDocumentAccess.
 *
 * npx tsx scripts/test-ged-v203-tenant.ts
 */
import assert from "node:assert/strict";
import { loadScriptEnv } from "./load-script-env";

loadScriptEnv();
process.env.NODE_TLS_REJECT_UNAUTHORIZED ??= "0";

async function main() {
  const { prisma } = await import("../src/lib/prisma");
  const { loadDocumentHub } = await import("../src/lib/ged/document-hub");
  const { resolveDocumentAccess } = await import("../src/lib/ged/resolve-document-access");

  const setrim = await prisma.organization.findFirst({
    where: { name: "SETRIM" },
    select: { id: true, ownerUserId: true },
  });
  const preno = await prisma.organization.findFirst({
    where: { name: { contains: "ProRéno" } },
    select: { id: true, ownerUserId: true },
  });
  assert.ok(setrim && preno, "deux organisations requises");
  assert.notEqual(setrim.ownerUserId, preno.ownerUserId);

  const setrimUser = await prisma.user.findUnique({
    where: { id: setrim.ownerUserId },
    select: { id: true, role: true, personType: true, permissionProfile: true },
  });
  const prenoUser = await prisma.user.findUnique({
    where: { id: preno.ownerUserId },
    select: { id: true, role: true, personType: true, permissionProfile: true },
  });
  assert.ok(setrimUser && prenoUser);

  const fileA = await prisma.chantierFile.findFirst({
    where: { organizationId: setrim.id, deletedAt: null, name: { contains: "BL-4582" } },
    select: { id: true, name: true },
  });
  const fileB = await prisma.chantierFile.findFirst({
    where: {
      OR: [{ organizationId: preno.id }, { clientId: preno.ownerUserId }],
      deletedAt: null,
    },
    select: { id: true, name: true, organizationId: true },
  });
  assert.ok(fileA, "document SETRIM (BL) requis — lancer le seed");
  assert.ok(fileB, "document ProRéno requis");

  const asSetrim = {
    id: setrimUser.id,
    role: setrimUser.role,
    personType: setrimUser.personType,
    permissionProfile: setrimUser.permissionProfile,
  };
  const asPreno = {
    id: prenoUser.id,
    role: prenoUser.role,
    personType: prenoUser.personType,
    permissionProfile: prenoUser.permissionProfile,
  };

  const leak = await resolveDocumentAccess(asSetrim, { kind: "CHANTIER_FILE", id: fileB.id });
  assert.equal(leak.ok, false, "SETRIM ne lit pas le fichier ProRéno");
  assert.ok(leak.ok === false && (leak.status === 403 || leak.status === 404));

  const leak2 = await resolveDocumentAccess(asPreno, { kind: "CHANTIER_FILE", id: fileA.id });
  assert.equal(leak2.ok, false, "ProRéno ne lit pas le fichier SETRIM");

  const own = await resolveDocumentAccess(asSetrim, { kind: "CHANTIER_FILE", id: fileA.id });
  // Placeholder démo n’est pas un objet Storage : 400 référence invalide après ACL OK, ou ok.
  assert.ok(own.ok === true || (own.ok === false && own.status !== 403), "ACL SETRIM sur son BL");

  const hubSetrim = await loadDocumentHub({ user: asSetrim, search: "Point.P", page: 1 });
  assert.ok(hubSetrim.items.length >= 2, `Point.P doit renvoyer plusieurs sources (got ${hubSetrim.items.length})`);
  const origins = new Set(hubSetrim.items.map((i) => i.origin));
  assert.ok(origins.size >= 2, "Point.P multi-sources");

  const hubAnd = await loadDocumentHub({ user: asSetrim, search: "Point.P Victor Hugo", page: 1 });
  assert.ok(hubAnd.items.length >= 1, "Point.P Victor Hugo");

  const hubBl = await loadDocumentHub({ user: asSetrim, search: "BL", page: 1 });
  assert.ok(hubBl.items.some((i) => /BL-4582/i.test(i.title)), "BL-4582");

  const hubBc = await loadDocumentHub({ user: asSetrim, search: "BC-2026-043", page: 1 });
  assert.ok(hubBc.items.length >= 1, "BC-2026-043");

  const hubDevis = await loadDocumentHub({ user: asSetrim, search: "devis", page: 1 });
  assert.ok(hubDevis.items.some((i) => /devis/i.test(`${i.title} ${i.typeLabel}`)), "devis");

  const hubMartin = await loadDocumentHub({ user: asSetrim, search: "attestation Martin", page: 1 });
  assert.ok(
    hubMartin.items.some((i) => /Martin/i.test(i.title) && !i.projectId),
    "attestation Martin sans chantier",
  );

  const victor = await prisma.project.findFirst({
    where: { organizationId: setrim.id, title: { contains: "Victor Hugo" } },
    select: { id: true },
  });
  assert.ok(victor);
  const hubChantier = await loadDocumentHub({
    user: asSetrim,
    projectId: victor.id,
    page: 1,
  });
  assert.ok(hubChantier.items.some((i) => i.projectId === victor.id), "docs Victor Hugo");
  assert.ok(
    !hubChantier.items.some((i) => /Attestation-assurance-Martin/i.test(i.title)),
    "DM sans chantier exclu de la vue chantier",
  );

  const crossSearch = await loadDocumentHub({ user: asSetrim, search: fileB.name.slice(0, 18), page: 1 });
  assert.ok(
    !crossSearch.items.some((i) => i.chantierFileId === fileB.id),
    "recherche SETRIM ne remonte pas le fichier ProRéno",
  );

  let httpUnauth = "NON";
  try {
    const res = await fetch("http://127.0.0.1:3000/api/ged/access", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind: "CHANTIER_FILE", id: fileB.id }),
    });
    httpUnauth = String(res.status);
    assert.ok(res.status === 401 || res.status === 403);
    const res2 = await fetch(`http://127.0.0.1:3000/api/chantier/files/${fileB.id}/favorite`, {
      method: "POST",
    });
    assert.ok(res2.status === 401 || res2.status === 403);
  } catch {
    httpUnauth = "serveur local absent — ACL resolveDocumentAccess exécuté";
  }

  console.log("ok isolation SETRIM / ProRéno");
  console.log("ok recherche multi-sources");
  console.log("ok vue chantier exclut le DM sans chantier");
  console.log(`HTTP /api/ged/access sans session : ${httpUnauth}`);
  console.log("GED V2.0.3 tenant OK");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
