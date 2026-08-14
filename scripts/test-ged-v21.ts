/**
 * GED V2.1 — finition UX (sans DB).
 * npx tsx scripts/test-ged-v21.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { originFromLinks, originHref, folderDisplayLabel } from "../src/lib/ged/origin";
import { displayGedTypeLabel } from "../src/lib/ged/classify-document";
import {
  HUB_DOC_TYPES,
  documentResultLines,
  hubEmptyCopy,
  hubItemMatchesQuery,
  provenanceSummary,
  recentDayLabel,
  visibleHubViews,
  type HubDocumentItem,
} from "../src/lib/ged/document-hub-ui";

function sample(over: Partial<HubDocumentItem> = {}): HubDocumentItem {
  return {
    id: "cf:1",
    source: "chantier",
    title: "BL-4582.pdf",
    typeLabel: "Bon de livraison",
    group: "fournisseurs",
    projectId: "vh",
    projectTitle: "Résidence Victor Hugo",
    contextLabel: "BC-2026-043",
    visibility: "Interne",
    authorName: null,
    createdAt: "2026-08-14T10:00:00.000Z",
    href: "/api/x",
    mimeHint: "application/pdf",
    isCurrentVersion: true,
    origin: "COMMANDE",
    originLabel: "Commande",
    originHref: "/dashboard/commandes/po1",
    originActionLabel: "Voir la commande",
    companyLabel: "Point.P",
    chantierFileId: "f1",
    ...over,
  };
}

function tTypesHumains() {
  assert.equal(displayGedTypeLabel("BON_LIVRAISON"), "Bon de livraison");
  assert.equal(displayGedTypeLabel("FICHE_TECHNIQUE"), "Fiche technique");
  assert.equal(displayGedTypeLabel("ATTESTATION"), "Attestation");
  assert.ok(!HUB_DOC_TYPES.some((t) => t.label === "Chantiers"));
  assert.ok(!HUB_DOC_TYPES.some((t) => t.id === "chantiers"));
  console.log("ok types humains (pas Type : Chantiers)");
}

function tResultLines() {
  const bl = documentResultLines(sample());
  assert.equal(bl.typeLine, "Bon de livraison");
  assert.equal(bl.placeLine, "Résidence Victor Hugo · Point.P");
  assert.ok(bl.sourceLine.includes("Commande BC-2026-043"));
  assert.equal(bl.placeLine.includes("Sans chantier"), false);

  const hidden = documentResultLines(sample(), { hideProject: true });
  assert.equal(hidden.placeLine.includes("Victor Hugo"), false);
  assert.ok(hidden.placeLine.includes("Point.P"));

  const martin = documentResultLines(
    sample({
      title: "Attestation-assurance-Martin.pdf",
      typeLabel: "Attestation",
      projectId: null,
      projectTitle: null,
      companyLabel: "Martin Étanchéité",
      origin: "MESSAGERIE",
      contextLabel: null,
    }),
  );
  assert.equal(martin.placeLine, "Martin Étanchéité");
  assert.ok(martin.sourceLine.includes("Messagerie"));
  assert.equal(martin.placeLine.includes("Sans chantier"), false);
  assert.equal(martin.placeLine.includes("Aucune entreprise"), false);

  const miss = documentResultLines(
    sample({
      isExpectedMissing: true,
      title: "Fiche technique membrane",
    }),
  );
  assert.equal(miss.typeLine, "À récupérer");
  console.log("ok lignes résultat compactes");
}

function tSearchAnd() {
  const bl = sample();
  assert.equal(hubItemMatchesQuery(bl, "Point.P"), true);
  assert.equal(hubItemMatchesQuery(bl, "Point.P Victor Hugo"), true);
  assert.equal(hubItemMatchesQuery(bl, "Point.P Jardins"), false);
  assert.equal(hubItemMatchesQuery(bl, "BC-2026-043"), true);
  assert.equal(hubItemMatchesQuery(bl, "BL"), true);
  const membrane = sample({
    title: "Fiche-technique-membrane-Soprema.pdf",
    typeLabel: "Fiche technique",
    origin: "MESSAGERIE",
    contextLabel: null,
  });
  assert.equal(hubItemMatchesQuery(membrane, "membrane"), true);
  const martin = sample({
    title: "Attestation-assurance-Martin.pdf",
    typeLabel: "Attestation",
    companyLabel: "Martin Étanchéité",
    projectTitle: null,
  });
  assert.equal(hubItemMatchesQuery(martin, "attestation Martin"), true);
  console.log("ok recherche AND");
}

function tEmptyCopy() {
  const search = hubEmptyCopy({ group: "all", search: "plan charpente" });
  assert.ok(search.title.includes("plan charpente"));
  assert.equal(search.action, "clear-search");
  const filters = hubEmptyCopy({ group: "all", hasFilters: true });
  assert.equal(filters.action, "clear-filters");
  const empty = hubEmptyCopy({ group: "all" });
  assert.equal(empty.action, "add");
  console.log("ok états vides");
}

function tClassifyTab() {
  const views = visibleHubViews(
    [
      { id: "all", label: "Tous" },
      { id: "classify", label: "À classer" },
    ],
    0,
  );
  assert.ok(!views.some((v) => v.id === "classify"));
  const withCount = visibleHubViews(
    [
      { id: "all", label: "Tous" },
      { id: "classify", label: "À classer" },
    ],
    2,
  );
  assert.equal(withCount.find((v) => v.id === "classify")?.label, "À classer · 2");
  console.log("ok À classer conditionnel");
}

function tOriginRetour() {
  const doe = originFromLinks({ links: [{ entityType: "doe_item", entityId: "d1" }] });
  assert.equal(doe.actionLabel, "Voir le DOE");
  const four = originFromLinks({ links: [{ entityType: "supplier", entityLabel: "Point.P" }] });
  assert.equal(four.actionLabel, "Voir le fournisseur");
  const hrefF = originHref({ origin: "FOURNISSEUR", links: [], projectId: "p1" });
  assert.equal(hrefF, "/dashboard/fournisseurs");
  const hrefDoe = originHref({ origin: "DOE", links: [], projectId: "p1" });
  assert.ok(hrefDoe?.includes("#tab-documents"));
  const fac = originFromLinks({
    links: [{ entityType: "commercial_invoice", entityId: "i1", entityLabel: "FAC-2026-014" }],
  });
  assert.equal(fac.actionLabel, "Voir la facture");
  console.log("ok retour source");
}

function tFolderNoNumbers() {
  assert.equal(folderDisplayLabel("03 Plans & pièces techniques", "03"), "Plans & pièces techniques");
  assert.equal(folderDisplayLabel("Plans & pièces techniques", "03"), "Plans & pièces techniques");
  console.log("ok catégories sans numéros");
}

function tRecentGroups() {
  const now = new Date("2026-08-14T12:00:00Z");
  assert.equal(recentDayLabel("2026-08-14T08:00:00Z", now), "Aujourd’hui");
  assert.equal(recentDayLabel("2026-08-13T08:00:00Z", now), "Hier");
  assert.equal(recentDayLabel("2026-08-11T08:00:00Z", now), "Cette semaine");
  assert.equal(recentDayLabel("2026-07-01T08:00:00Z", now), "Plus ancien");
  console.log("ok regroupement temporel");
}

function tNoEmptyWords() {
  const line = provenanceSummary({
    origin: "MESSAGERIE",
    companyLabel: "Martin Étanchéité",
    projectTitle: null,
  });
  assert.equal(/sans chantier|aucune entreprise|pas de référence/i.test(line), false);
  console.log("ok pas de vide affiché");
}

function tNoMigrationV21() {
  const hub = readFileSync(join(process.cwd(), "src/lib/ged/document-hub.ts"), "utf8");
  assert.ok(hub.includes("searchTokens"));
  assert.ok(hub.includes("classifyCount"));
  assert.ok(!hub.includes("model GedDocument"));
  console.log("ok pas de nouvelle GED");
}

tTypesHumains();
tResultLines();
tSearchAnd();
tEmptyCopy();
tClassifyTab();
tOriginRetour();
tFolderNoNumbers();
tRecentGroups();
tNoEmptyWords();
tNoMigrationV21();
console.log("GED V2.1 recette OK");
