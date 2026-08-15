/**
 * SEC-1 — matrice d’accès personas SETRIM (déterministe, sans DB).
 * npx tsx scripts/test-dashboard-persona-policy.ts
 */
import assert from "node:assert/strict";
import {
  canAccessDashboardHref,
  decideApiAccess,
  decideDashboardPageAccess,
  requiredHrefForApiPath,
} from "../src/lib/equipe-acces/dashboard-policy";

type Persona = {
  key: string;
  personType: string;
  permissionProfile: string;
};

const PERSONAS: Record<string, Persona> = {
  denis: {
    key: "direction",
    personType: "INTERNAL",
    permissionProfile: "DIRECTION",
  },
  julie: {
    key: "administratif",
    personType: "INTERNAL",
    permissionProfile: "ADMINISTRATIF",
  },
  karim: {
    key: "conducteur",
    personType: "INTERNAL",
    permissionProfile: "CONDUCTEUR",
  },
  sophie: {
    key: "client",
    personType: "CLIENT_EXT",
    permissionProfile: "CLIENT",
  },
  thomas: {
    key: "fournisseur",
    personType: "SUPPLIER",
    permissionProfile: "FOURNISSEUR",
  },
};

const DOMAINS = [
  "/dashboard",
  "/dashboard/a-traiter",
  "/dashboard/messagerie",
  "/dashboard/projets",
  "/dashboard/planning",
  "/dashboard/agenda",
  "/dashboard/commandes",
  "/dashboard/depenses",
  "/dashboard/fournisseurs",
  "/dashboard/documents",
  "/dashboard/pilotage-travaux",
  "/dashboard/rentabilite",
  "/dashboard/devis-facturation",
  "/dashboard/facturation",
  "/dashboard/rapports",
  "/dashboard/equipe",
  "/dashboard/livraisons",
  "/dashboard/parametres",
  "/dashboard/taches",
  "/dashboard/fiches-suivi",
  "/dashboard/assistant-ia",
] as const;

/** Attendu = politique nav SETRIM + extras sidebar (équipe, livraisons). */
const ALLOWED: Record<string, readonly string[]> = {
  denis: DOMAINS.filter((h) => h !== "/dashboard/livraisons"),
  julie: DOMAINS.filter((h) => h !== "/dashboard/livraisons"),
  karim: [
    "/dashboard",
    "/dashboard/a-traiter",
    "/dashboard/messagerie",
    "/dashboard/projets",
    "/dashboard/planning",
    "/dashboard/agenda",
    "/dashboard/commandes",
    "/dashboard/documents",
    "/dashboard/devis-facturation",
    "/dashboard/facturation",
    "/dashboard/parametres",
    "/dashboard/taches",
    "/dashboard/fiches-suivi",
    "/dashboard/assistant-ia",
  ],
  sophie: [
    "/dashboard",
    "/dashboard/messagerie",
    "/dashboard/projets",
    "/dashboard/agenda",
    "/dashboard/documents",
    "/dashboard/parametres",
    "/dashboard/taches",
  ],
  thomas: [
    "/dashboard",
    "/dashboard/messagerie",
    "/dashboard/commandes",
    "/dashboard/documents",
    "/dashboard/livraisons",
    "/dashboard/parametres",
  ],
};

function allowedSet(key: string): Set<string> {
  return new Set(ALLOWED[key]);
}

function testMatrix() {
  for (const [who, persona] of Object.entries(PERSONAS)) {
    const allow = allowedSet(who);
    for (const href of DOMAINS) {
      const got = canAccessDashboardHref(
        href,
        persona.personType,
        persona.permissionProfile,
      );
      const want = allow.has(href);
      assert.equal(
        got,
        want,
        `${who} ${href} attendu=${want} obtenu=${got}`,
      );
    }
  }

  assert.equal(
    canAccessDashboardHref(
      "/dashboard/rentabilite",
      PERSONAS.sophie.personType,
      PERSONAS.sophie.permissionProfile,
    ),
    false,
    "CLIENT ne doit jamais ouvrir Rentabilité",
  );
  assert.equal(
    canAccessDashboardHref(
      "/dashboard/depenses",
      PERSONAS.thomas.personType,
      PERSONAS.thomas.permissionProfile,
    ),
    false,
    "FOURNISSEUR ne doit jamais ouvrir Dépenses",
  );
  assert.equal(
    canAccessDashboardHref(
      "/dashboard/devis-facturation/devis/nouveau",
      PERSONAS.karim.personType,
      PERSONAS.karim.permissionProfile,
    ),
    true,
    "CONDUCTEUR conserve le commercial (nav existante)",
  );
  assert.equal(
    canAccessDashboardHref(
      "/dashboard/rentabilite",
      PERSONAS.karim.personType,
      PERSONAS.karim.permissionProfile,
    ),
    false,
    "CONDUCTEUR n’a pas la rentabilité",
  );
  assert.equal(
    canAccessDashboardHref(
      "/dashboard/livraisons",
      PERSONAS.karim.personType,
      PERSONAS.karim.permissionProfile,
    ),
    false,
    "Livraisons = portail fournisseur uniquement (aligné sidebar)",
  );
}

function testApiMapping() {
  assert.equal(
    requiredHrefForApiPath("/api/commercial/quotes"),
    "/dashboard/devis-facturation",
  );
  assert.equal(
    requiredHrefForApiPath("/api/commercial/projects/abc/profitability"),
    "/dashboard/rentabilite",
  );
  assert.equal(
    requiredHrefForApiPath("/api/supplier-invoices"),
    "/dashboard/depenses",
  );
  assert.equal(requiredHrefForApiPath("/api/suppliers"), "/dashboard/fournisseurs");
  assert.equal(requiredHrefForApiPath("/api/equipe"), "/dashboard/equipe");
  assert.equal(requiredHrefForApiPath("/api/reports/stats"), "/dashboard/rapports");
  assert.equal(requiredHrefForApiPath("/api/reports/export"), "/dashboard/rapports");
  assert.equal(
    requiredHrefForApiPath("/api/reports?projectId=x"),
    null,
    "CR chantier /api/reports hors module Rapports",
  );
  assert.equal(
    requiredHrefForApiPath("/api/purchase-orders/xyz"),
    "/dashboard/commandes",
  );
  assert.equal(requiredHrefForApiPath("/api/chantier/files/1"), null);
}

function testHttpDecisions() {
  const karim = PERSONAS.karim;
  const sophie = PERSONAS.sophie;
  const thomas = PERSONAS.thomas;
  const denis = PERSONAS.denis;

  for (const href of [
    "/dashboard/rentabilite",
    "/dashboard/depenses",
    "/dashboard/fournisseurs",
    "/dashboard/pilotage-travaux",
    "/dashboard/rapports",
    "/dashboard/equipe",
  ]) {
    const d = decideDashboardPageAccess(
      href,
      karim.personType,
      karim.permissionProfile,
    );
    assert.equal(d.ok, false, `Karim page ${href}`);
    if (!d.ok) assert.equal(d.status, 403);
  }

  assert.equal(
    decideDashboardPageAccess(
      "/dashboard/devis-facturation",
      karim.personType,
      karim.permissionProfile,
    ).ok,
    true,
    "Karim commercial page",
  );

  for (const href of [
    "/dashboard/rentabilite",
    "/dashboard/depenses",
    "/dashboard/fournisseurs",
    "/dashboard/pilotage-travaux",
    "/dashboard/devis-facturation",
    "/dashboard/equipe",
  ]) {
    assert.equal(
      decideDashboardPageAccess(href, sophie.personType, sophie.permissionProfile)
        .ok,
      false,
      `Sophie page ${href}`,
    );
  }

  for (const href of [
    "/dashboard/rentabilite",
    "/dashboard/depenses",
    "/dashboard/fournisseurs",
    "/dashboard/devis-facturation",
    "/dashboard/equipe",
  ]) {
    assert.equal(
      decideDashboardPageAccess(href, thomas.personType, thomas.permissionProfile)
        .ok,
      false,
      `Thomas page ${href}`,
    );
  }

  assert.equal(
    decideDashboardPageAccess(
      "/dashboard/rentabilite",
      denis.personType,
      denis.permissionProfile,
    ).ok,
    true,
  );

  assert.equal(
    decideApiAccess(
      "/api/commercial/projects/p1/profitability",
      karim.personType,
      karim.permissionProfile,
    ).ok,
    false,
    "Karim API rentabilité",
  );
  assert.equal(
    decideApiAccess(
      "/api/commercial/quotes",
      karim.personType,
      karim.permissionProfile,
    ).ok,
    true,
    "Karim API devis (commercial autorisé)",
  );
  assert.equal(
    decideApiAccess(
      "/api/supplier-invoices",
      karim.personType,
      karim.permissionProfile,
    ).ok,
    false,
    "Karim API dépenses",
  );
  assert.equal(
    decideApiAccess(
      "/api/suppliers",
      sophie.personType,
      sophie.permissionProfile,
    ).ok,
    false,
    "Sophie API fournisseurs",
  );
  assert.equal(
    decideApiAccess(
      "/api/commercial/quotes",
      thomas.personType,
      thomas.permissionProfile,
    ).ok,
    false,
    "Thomas API commercial",
  );
  assert.equal(
    decideApiAccess(
      "/api/purchase-orders",
      thomas.personType,
      thomas.permissionProfile,
    ).ok,
    true,
    "Thomas API commandes (propres, scope ressource ailleurs)",
  );
  assert.equal(
    decideApiAccess(
      "/api/chantier/files/abc",
      sophie.personType,
      sophie.permissionProfile,
    ).ok,
    true,
    "GED hors carte persona — ACL GED inchangée",
  );
}

function test() {
  testMatrix();
  testApiMapping();
  testHttpDecisions();
  console.log("✓ test-dashboard-persona-policy OK");
}

test();
