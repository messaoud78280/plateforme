import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  activeProjectWhere,
  archivedProjectWhere,
} from "@/lib/chantier/project-archive";
import { buildSectionPdfFilename, sanitizePdfFilenamePart } from "@/lib/chantier/pdf/filename";
import { provenanceLabel } from "@/lib/chantier/pdf/shared";

describe("project-archive helpers", () => {
  it("activeProjectWhere exclut les archivés", () => {
    assert.deepEqual(activeProjectWhere(), { archivedAt: null });
  });

  it("archivedProjectWhere cible uniquement les archivés", () => {
    assert.deepEqual(archivedProjectWhere(), { archivedAt: { not: null } });
  });
});

describe("pdf filename", () => {
  it("nettoie les caractères incompatibles", () => {
    assert.equal(sanitizePdfFilenamePart("MOREL / Rénovation"), "MOREL_Renovation");
  });

  it("construit un nom déterministe", () => {
    assert.equal(
      buildSectionPdfFilename({
        projectTitle: "MOREL",
        sectionLabel: "Planning",
        suffix: "rev8",
      }),
      "MOREL_Planning_rev8.pdf",
    );
  });
});

describe("provenance PDF métré", () => {
  it("distingue hypothèse et mesure", () => {
    assert.match(provenanceLabel("HYPOTHESIS"), /Hypothèse/i);
    assert.match(provenanceLabel("RELEVE"), /Mesure/i);
    assert.match(provenanceLabel("SAISIE_MANUELLE"), /manuelle/i);
  });
});
