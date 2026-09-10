/**
 * Mise à jour ciblée DEV-2026-0148 — descriptions + notes client + alerte délimitations.
 * Ne touche PAS aux prix / quantités / totaux / échéancier.
 * Run: node --import tsx scripts/update-dev-2026-0148-presentation.ts
 */
import { Prisma } from "@prisma/client";
import { prisma } from "../src/lib/prisma";
import { buildCleanClientNotes } from "../src/lib/commercial/client-notes-structure";
import {
  DELIMITATION_GRAVILLON_ALERT,
  ensureInternalVerifyAlert,
  mergeTechnicalIntoCompositionSnapshot,
} from "../src/lib/commercial/line-technical-info";
import { generateCurrentQuotePdfPreview } from "../src/lib/commercial/accepted-snapshot";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const NUMBER = "DEV-2026-0148";

const GRAVE_DESC =
  "Fourniture, répartition, réglage et compactage mécanique de grave concassée 0/31,5 sur une épaisseur moyenne d'environ 12 à 15 cm après compactage, afin de réaliser une assise stable pour le revêtement final.";

const GRAVILLON_DESC =
  "Fourniture, répartition et réglage d'un gravillon décoratif calcaire blanc-beige sur une épaisseur moyenne d'environ 4 cm, dans des tonalités blanc, crème et beige clair, avec finition soignée adaptée à l'environnement de la maison.";

async function main() {
  const quote = await prisma.commercialQuote.findFirst({
    where: { number: NUMBER },
    include: {
      currentVersion: {
        include: { lines: true },
      },
    },
  });
  if (!quote?.currentVersion) throw new Error("Devis introuvable");

  const editable =
    quote.status === "DRAFT" ||
    quote.status === "TO_VALIDATE" ||
    quote.status === "VALIDATED";
  if (!editable || quote.currentVersion.lockState !== "DRAFT") {
    console.log(
      `Skip mutation contenu : status=${quote.status} lock=${quote.currentVersion.lockState}`,
    );
    console.log("Les améliorations renderer PDF s’appliquent à la génération.");
    return;
  }

  const htBefore = String(quote.totalSellHt);
  const ttcBefore = String(quote.totalTtc);

  const clientNotes = buildCleanClientNotes({
    intro:
      "Réfection complète de l'accès extérieur de la maison comprenant la dépose du carrelage existant, la démolition de la dalle béton déformée, l'évacuation des gravats, la préparation du fond de forme, la mise en place d'un géotextile, la réalisation d'une fondation en grave concassée 0/31,5 compactée et la finition en gravillon décoratif calcaire blanc-beige.",
    adviceParagraphs: [
      "Compte tenu des irrégularités observées sur la dalle existante et des zones de stagnation d'eau, nous préconisons une dépose complète du revêtement et de son support plutôt qu'une simple reprise du carrelage.\n\nCette intervention permettra de reprendre correctement le fond de forme, les niveaux et les pentes avant la réalisation d'une nouvelle structure en grave compactée et d'une finition en gravillon décoratif.",
      "Cette solution constitue un compromis pertinent entre coût, esthétique, entretien et adaptation aux contraintes existantes. Elle favorise une meilleure gestion des eaux de surface grâce à la reprise des pentes, sans constituer un dispositif de drainage indépendant non chiffré.",
      "Un gravillon calcaire blanc-beige est retenu pour une finition lumineuse, naturelle et élégante, cohérente avec la pierre et les teintes claires de la façade.",
    ],
    stages: [
      {
        order: 1,
        title: "Dépose et démolition",
        description:
          "Dépose du carrelage existant, démolition de la dalle béton et évacuation des matériaux.",
      },
      {
        order: 2,
        title: "Préparation du sol",
        description:
          "Décaissement, réglage des niveaux, réalisation des pentes nécessaires afin de limiter les stagnations d'eau, et préparation du fond de forme.",
      },
      {
        order: 3,
        title: "Mise en œuvre de la grave",
        description:
          "Pose, réglage et compactage mécanique de la grave concassée 0/31,5.",
      },
      {
        order: 4,
        title: "Finition en gravillon décoratif",
        description:
          "Répartition et réglage du gravillon calcaire blanc-beige pour obtenir la finition définitive.",
      },
    ],
    reserves: [
      "Le présent chiffrage est établi sur la base des éléments visibles lors de la visite et avant démolition de la dalle existante.",
      "La nature et la qualité du support situé sous la dalle ne pourront être vérifiées qu'après démolition. Toute découverte d'un remblai instable, d'une surépaisseur importante, d'un réseau non identifié ou nécessitant un terrassement complémentaire fera l'objet d'un chiffrage soumis au client avant exécution.",
      "La teinte, la granulométrie et l'aspect du gravillon décoratif peuvent présenter de légères variations naturelles selon les approvisionnements.",
    ],
  });

  const internalNotes = ensureInternalVerifyAlert(
    quote.internalNotes,
    DELIMITATION_GRAVILLON_ALERT,
  );

  for (const line of quote.currentVersion.lines) {
    if (line.designation.includes("grave concassée 0/31,5")) {
      const snap = mergeTechnicalIntoCompositionSnapshot(
        line.compositionSnapshotJson,
        { thicknessNote: "12 à 15 cm" },
      );
      await prisma.commercialQuoteLine.update({
        where: { id: line.id },
        data: {
          description: GRAVE_DESC,
          compositionSnapshotJson: snap as Prisma.InputJsonValue,
        },
      });
      console.log("✓ grave description + épaisseur");
    }
    if (line.designation.includes("gravillon décoratif")) {
      const snap = mergeTechnicalIntoCompositionSnapshot(
        line.compositionSnapshotJson,
        { thicknessNote: "4 cm" },
      );
      await prisma.commercialQuoteLine.update({
        where: { id: line.id },
        data: {
          description: GRAVILLON_DESC,
          compositionSnapshotJson: snap as Prisma.InputJsonValue,
        },
      });
      console.log("✓ gravillon description + épaisseur");
    }
  }

  await prisma.commercialQuote.update({
    where: { id: quote.id },
    data: { clientNotes, internalNotes },
  });
  await prisma.commercialQuoteVersion.update({
    where: { id: quote.currentVersion.id },
    data: { clientNotes },
  });

  const after = await prisma.commercialQuote.findUniqueOrThrow({
    where: { id: quote.id },
    select: { totalSellHt: true, totalTtc: true },
  });
  if (String(after.totalSellHt) !== htBefore || String(after.totalTtc) !== ttcBefore) {
    throw new Error("Totaux modifiés — rollback requis");
  }
  console.log("✓ notes client nettoyées (sans ===)");
  console.log("✓ alerte délimitations ajoutée (interne)");
  console.log("✓ totaux inchangés", htBefore, "HT /", ttcBefore, "TTC");

  const preview = await generateCurrentQuotePdfPreview(
    quote.organizationId,
    quote.id,
  );
  if (preview) {
    const dir = join(process.cwd(), "tmp/devis-pdf-refonte");
    mkdirSync(dir, { recursive: true });
    const out = join(dir, "DEV-2026-0148-apres.pdf");
    writeFileSync(out, preview.buffer);
    const latin = preview.buffer.toString("latin1");
    console.log("✓ PDF", out, preview.buffer.length, "bytes");
    console.log("  pages ~", (latin.match(/\/Type\s*\/Page(?!s)/g) || []).length);
    console.log("  has === ?", latin.includes("==="));
    console.log("  has ChatGPT ?", /ChatGPT|Suggestion ChatGPT|TVA à confirmer/i.test(latin));
    console.log("  has interne ?", /sensible au prix|marge|rentabilit/i.test(latin));
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
