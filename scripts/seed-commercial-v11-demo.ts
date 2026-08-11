/**
 * Seed FICTIF Devis & Facturation V1.1 — démonstration chiffrage BTP.
 * Valeurs NON officielles — uniquement pour montrer le moteur.
 *
 * Usage:
 *   COMMERCIAL_SEED_ORG_ID=<uuid> npx tsx scripts/seed-commercial-v11-demo.ts
 */
import { prisma } from "../src/lib/prisma";
import {
  createEquipmentResource,
  createLaborResource,
  createMaterial,
  createWorkItem,
  upsertWorkItemComponent,
  updateWorkItem,
} from "../src/lib/commercial/library";

async function main() {
  const orgId = process.env.COMMERCIAL_SEED_ORG_ID?.trim();
  if (!orgId) {
    console.error("COMMERCIAL_SEED_ORG_ID requis");
    process.exit(1);
  }
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { id: true, name: true },
  });
  if (!org) {
    console.error("Organisation introuvable");
    process.exit(1);
  }

  console.log(`Seed FICTIF V1.1 pour ${org.name} (${org.id})`);

  const bloc = await createMaterial(orgId, {
    name: "Bloc béton creux 20×20×50",
    reference: "MAT-BLOC-20",
    family: "Maçonnerie",
    unit: "U",
    supplierName: "Négoce Démo",
    currentPriceHt: 1.85,
    priceSource: "seed fictif",
    notes: "Tarif FICTIF démonstration — pas une référence marché.",
  });
  await createMaterial(orgId, {
    name: "Mortier bâtard",
    reference: "MAT-MORT",
    family: "Maçonnerie",
    unit: "m³",
    currentPriceHt: 145,
    priceSource: "seed fictif",
  });
  await createMaterial(orgId, {
    name: "Ciment CEM II 35 kg",
    reference: "MAT-CIM",
    family: "Liants",
    unit: "sac",
    currentPriceHt: 8.5,
    priceSource: "seed fictif",
  });
  await createMaterial(orgId, {
    name: "Béton C25/30",
    reference: "MAT-BET-C25",
    family: "Béton",
    unit: "m³",
    currentPriceHt: 138,
    priceSource: "seed fictif",
  });
  await createMaterial(orgId, {
    name: "Treillis soudé ST25C",
    reference: "MAT-ST25C",
    family: "Ferraillage",
    unit: "m²",
    currentPriceHt: 4.2,
    priceSource: "seed fictif",
  });
  await createMaterial(orgId, {
    name: "Plaque BA13",
    reference: "MAT-BA13",
    family: "Plâtrerie",
    unit: "m²",
    currentPriceHt: 3.8,
    priceSource: "seed fictif",
  });
  await createMaterial(orgId, {
    name: "Rail R48",
    reference: "MAT-R48",
    family: "Plâtrerie",
    unit: "ml",
    currentPriceHt: 2.1,
    priceSource: "seed fictif",
  });
  await createMaterial(orgId, {
    name: "Isolant laine minérale 100 mm",
    reference: "MAT-LM100",
    family: "Isolation",
    unit: "m²",
    currentPriceHt: 9.5,
    priceSource: "seed fictif",
  });

  const macon = await createLaborResource(orgId, {
    name: "Maçon",
    trade: "Maçonnerie",
    hourlyCostHt: 32,
    loadedCostHt: 42,
    notes: "Coût chargé FICTIF (charges incluses) — utilisé en chiffrage si renseigné.",
  });
  const manoeuvre = await createLaborResource(orgId, {
    name: "Manœuvre",
    trade: "Maçonnerie",
    hourlyCostHt: 24,
    loadedCostHt: 32,
  });
  await createLaborResource(orgId, {
    name: "Plaquiste",
    trade: "Plâtrerie",
    hourlyCostHt: 30,
    loadedCostHt: 40,
  });

  await createEquipmentResource(orgId, {
    name: "Mini-pelle",
    kind: "RENTAL",
    category: "Terrassement",
    unit: "j",
    dailyCostHt: 220,
  });
  await createEquipmentResource(orgId, {
    name: "Plaque vibrante",
    kind: "OWNED",
    category: "Compactage",
    unit: "j",
    dailyCostHt: 35,
  });
  const nacelle = await createEquipmentResource(orgId, {
    name: "Nacelle",
    kind: "RENTAL",
    category: "Élévation",
    unit: "h",
    hourlyCostHt: 28,
  });

  await createWorkItem(orgId, {
    name: "Installation de chantier",
    reference: "OUV-INST",
    family: "Installation de chantier",
    saleUnit: "fft",
    kind: "SIMPLE",
    unitSellHt: 1850,
    marginPercent: 25,
  });

  await createWorkItem(orgId, {
    name: "Démolition cloison",
    reference: "OUV-DEMO-CL",
    family: "Démolition",
    saleUnit: "m²",
    kind: "SIMPLE",
    unitSellHt: 28,
    marginPercent: 30,
  });

  const mur = await createWorkItem(orgId, {
    name: "Mur en blocs béton creux 20 cm",
    reference: "OUV-MUR-20",
    family: "Maçonnerie",
    description:
      "Fourniture et pose d’un mur en blocs béton creux ép. 20 cm — composition FICTIVE de démonstration.",
    saleUnit: "m²",
    kind: "COMPOSITE",
    marginPercent: 22,
    feesPercent: 3,
    sellMode: "MARGIN",
  });

  await upsertWorkItemComponent(orgId, mur.id, {
    name: "Bloc béton 20×20×50",
    type: "MATERIAL",
    materialId: bloc.id,
    quantityPerUnit: 10,
    unit: "U",
    lossPercent: 5,
  });
  await upsertWorkItemComponent(orgId, mur.id, {
    name: "Mortier",
    type: "MATERIAL",
    quantityPerUnit: 0.018,
    unit: "m³",
    unitCostHt: 145,
    lossPercent: 5,
  });
  await upsertWorkItemComponent(orgId, mur.id, {
    name: "Maçon",
    type: "LABOR",
    laborId: macon.id,
    quantityPerUnit: 0.55,
    unit: "h",
  });
  await upsertWorkItemComponent(orgId, mur.id, {
    name: "Manœuvre",
    type: "LABOR",
    laborId: manoeuvre.id,
    quantityPerUnit: 0.25,
    unit: "h",
  });
  await upsertWorkItemComponent(orgId, mur.id, {
    name: "Petit matériel",
    type: "OTHER",
    quantityPerUnit: 1,
    unit: "fft",
    unitCostHt: 2.5,
  });
  await upsertWorkItemComponent(orgId, mur.id, {
    name: "Nacelle (partagée)",
    type: "EQUIPMENT",
    equipmentId: nacelle.id,
    quantityPerUnit: 0.05,
    unit: "h",
  });

  await updateWorkItem(orgId, mur.id, {
    kind: "COMPOSITE",
    marginPercent: 22,
    feesPercent: 3,
    sellMode: "MARGIN",
  });

  const dalle = await createWorkItem(orgId, {
    name: "Dalle béton armé",
    reference: "OUV-DALLE",
    family: "Gros œuvre",
    saleUnit: "m²",
    kind: "SIMPLE",
    unitSellHt: 95,
    marginPercent: 20,
  });
  void dalle;

  const cloison = await createWorkItem(orgId, {
    name: "Cloison BA13",
    reference: "OUV-BA13",
    family: "Plâtrerie",
    saleUnit: "m²",
    kind: "SIMPLE",
    unitSellHt: 42,
    marginPercent: 25,
  });
  void cloison;

  console.log("OK — seed fictif terminé (Mur blocs 20 cm composé prêt pour la démo).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
