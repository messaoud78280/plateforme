/**
 * Seed exemple — bibliothèque BeWork Devis (10 ouvrages + source & prix démo).
 * Exécution : npm run db:seed:devis
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL est requis.");
}

const prisma = new PrismaClient({ datasourceUrl: connectionString });

const DEMO_ITEMS = [
  {
    code: "BW-CAR-001",
    lot: "Carrelage",
    title: "Carrelage grès cérame 60×60",
    fullDescription:
      "Fourniture et pose de carrelage grès cérame rectifié 60×60 cm, joints alignés, collage adapté au support selon DTU.",
    unit: "m²",
  },
  {
    code: "BW-PEI-001",
    lot: "Peinture",
    title: "Peinture murs impression + 2 couches",
    fullDescription:
      "Préparation des supports, impression acrylique et deux couches de finition sur murs intérieurs hors zones très humides.",
    unit: "m²",
  },
  {
    code: "BW-GO-001",
    lot: "Gros œuvre",
    title: "Semelle filante béton armé",
    fullDescription:
      "Réalisation de semelle filante en béton armé (armatures selon note de calcul / prescriptions géotechniques).",
    unit: "ml",
  },
  {
    code: "BW-GO-002",
    lot: "Gros œuvre",
    title: "Dallage béton armé 12 cm",
    fullDescription:
      "Dallage sur isolant ou liaisonné, épaisseur indicative 12 cm, treillis soudé et dosages selon projet.",
    unit: "m²",
  },
  {
    code: "BW-VRD-001",
    lot: "VRD / Assainissement",
    title: "Évacuation PVC EU Ø100",
    fullDescription:
      "Pose de réseaux EU PVC Ø100 avec pente réglementaire, regards et raccordements conformes au projet VRD.",
    unit: "ml",
  },
  {
    code: "BW-VRD-002",
    lot: "VRD / Drainage",
    title: "Drainage périphérique",
    fullDescription:
      "Mise en œuvre de drain perforé, géotextile et grave de drainage sur linéaire défini au plan.",
    unit: "ml",
  },
  {
    code: "BW-PLA-001",
    lot: "Plâtrerie / Isolation",
    title: "Doublage laine de verre + BA13",
    fullDescription:
      "Doublage métallique, isolation laine de verre et plaque BA13, traitements acoustiques et coupe-feu selon notice.",
    unit: "m²",
  },
  {
    code: "BW-MEN-001",
    lot: "Menuiseries extérieures",
    title: "Fenêtre PVC double vitrage",
    fullDescription:
      "Fourniture et pose de fenêtre PVC avec vitrage isolant, huisseries et quincailleries conformes au carnet de prescriptions.",
    unit: "u",
  },
  {
    code: "BW-ELEC-001",
    lot: "Électricité",
    title: "Tableau électrique conforme NF C 15-100",
    fullDescription:
      "Réalisation ou adaptation de tableau basse tension, différentiels et protections dimensionnés selon schéma unifilaire.",
    unit: "forfait",
  },
  {
    code: "BW-FAC-001",
    lot: "Façade",
    title: "Enduit monocouche gratté",
    fullDescription:
      "Mise en œuvre d’enduit monocouche sur support préparé, finition grattée et traitements des appuis.",
    unit: "m²",
  },
] as const;

async function main() {
  for (const row of DEMO_ITEMS) {
    await prisma.workItem.upsert({
      where: { code: row.code },
      update: {},
      create: {
        code: row.code,
        lot: row.lot,
        title: row.title,
        fullDescription: row.fullDescription,
        unit: row.unit,
        status: "valide",
        qualityLevel: "standard",
      },
    });
  }

  const car = await prisma.workItem.findUnique({ where: { code: "BW-CAR-001" } });
  if (!car) return;

  const priceCount = await prisma.priceEntry.count({ where: { workItemId: car.id } });
  if (priceCount > 0) {
    console.log("Seed BeWork Devis : prix déjà présents pour BW-CAR-001 — skip démo prix.");
    return;
  }

  const src = await prisma.priceSource.create({
    data: {
      name: "Seed interne — extrait devis démo",
      sourceType: "devis",
      clientName: "Client anonymisé",
      projectName: "Chantier pilotage interne",
      projectLocation: "Île-de-France",
      department: "75",
      notes: "Données fictives pour tester l’interface — à remplacer par des sources réelles.",
    },
  });

  const src = await prisma.priceSource.create({
    data: [
      {
        workItemId: car.id,
        priceSourceId: src.id,
        sourceName: src.name,
        sourceType: "devis",
        unitPriceHT: "42.5",
        vatRate: "20",
        unitPriceTTC: "51",
        department: "75",
        reliabilityScore: 4,
        dateObserved: new Date("2026-01-15"),
      },
      {
        workItemId: car.id,
        priceSourceId: src.id,
        sourceName: `${src.name} (variante pose renforcée)`,
        sourceType: "estimation_interne",
        unitPriceHT: "48",
        vatRate: "20",
        unitPriceTTC: "57.6",
        department: "69",
        reliabilityScore: 3,
        dateObserved: new Date("2026-02-01"),
      },
    ],
  });

  console.log("Seed BeWork Devis : 10 ouvrages + source + 2 prix démo sur BW-CAR-001.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
