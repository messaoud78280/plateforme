/**
 * Seed démo Pilotage travaux — UNIQUEMENT environnement de développement.
 * Usage :
 *   NODE_ENV=development node --env-file=.env --env-file=.env.local scripts/seed-pilotage-demo.mjs
 * Ne jamais exécuter contre la production.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === "production" || process.env.RAILWAY_ENVIRONMENT === "production") {
    throw new Error("Refus : seed pilotage démo interdit en production.");
  }

  let client = await prisma.user.findFirst({
    where: { role: "CLIENT", OR: [{ company: { contains: "CRM Construction" } }, { email: "demo-crm-pilotage@bework.local" }] },
  });
  if (!client) {
    client = await prisma.user.create({
      data: {
        email: "demo-crm-pilotage@bework.local",
        password: "unused-demo-hash",
        name: "Contact CRM Construction",
        company: "CRM Construction",
        role: "CLIENT",
        accountStatus: "APPROVED",
        contractStatus: "SIGNED",
      },
    });
  }

  let project = await prisma.project.findFirst({
    where: { clientId: client.id, title: { contains: "logements" } },
  });
  if (!project) {
    project = await prisma.project.create({
      data: {
        title: "Construction de logements – Lot Gros œuvre",
        description: "Chantier démo Pilotage travaux",
        clientId: client.id,
        siteCity: "Bordeaux",
        siteAddress: "12 rue des Chantiers",
        chantierStatus: "EN_COURS",
      },
    });
  }

  const existing = await prisma.worksitePilotage.findUnique({ where: { projectId: project.id } });
  if (existing) {
    console.log(`Pilotage démo déjà présent : ${existing.id}`);
    return;
  }

  const pilotage = await prisma.worksitePilotage.create({
    data: {
      projectId: project.id,
      clientId: client.id,
      lot: "Gros œuvre",
      corpsEtat: "Gros œuvre",
      status: "EN_COURS",
      startDate: new Date(),
      plannedEndDate: new Date(Date.now() + 120 * 86400000),
      description: "Jeu de données démo — à supprimer facilement.",
      obligations: {
        create: [
          {
            title: "Remise du PPSPS avant démarrage",
            category: "Sécurité",
            priority: "Critique",
            status: "En cours",
            dueDate: new Date(Date.now() + 5 * 86400000),
          },
          {
            title: "Archivage de la notification de marché",
            category: "Administratif",
            priority: "Haute",
            status: "À préparer",
          },
        ],
      },
      requiredDocuments: {
        create: [
          { name: "PPSPS", category: "Sécurité", status: "Manquant", isMandatory: true },
          { name: "Planning d’exécution", category: "Études", status: "À préparer", isMandatory: true },
          { name: "Attestations d’assurance", category: "Administratif", status: "Reçu", isMandatory: true },
        ],
      },
      actions: {
        create: [
          {
            title: "Relancer le PPSPS",
            category: "Document",
            priority: "Critique",
            status: "À faire",
            dueDate: new Date(Date.now() - 2 * 86400000),
          },
          {
            title: "Vérifier les plans de fondation",
            category: "Plan",
            priority: "Haute",
            status: "En cours",
            dueDate: new Date(Date.now() + 3 * 86400000),
          },
          {
            title: "Préparer situation n°1",
            category: "Situation",
            priority: "Normale",
            status: "À faire",
            dueDate: new Date(Date.now() + 14 * 86400000),
          },
        ],
      },
      plans: {
        create: [
          {
            reference: "FON-01",
            title: "Plans de fondation",
            planType: "Fondations",
            status: "En attente de visa",
            visaDueDate: new Date(Date.now() + 4 * 86400000),
            indice: "B",
          },
          {
            reference: "COF-01",
            title: "Plans de coffrage",
            planType: "Coffrage",
            status: "À produire",
            indice: "A",
          },
        ],
      },
      doeItems: {
        create: [
          { title: "Plans de recollement", category: "Plans de recollement", status: "Manquant", isMandatory: true },
          { title: "Fiches techniques béton", category: "Fiches techniques", status: "À demander", isMandatory: true },
          { title: "PV d’essais béton", category: "PV d’essais", status: "Manquant", isMandatory: true },
          { title: "Photos de chantier", category: "Photos", status: "Non applicable", isMandatory: false },
        ],
      },
      activities: {
        create: {
          actionType: "création",
          entityType: "pilotage",
          entityLabel: project.title,
          comment: "Seed démo développement",
          userName: "Seed",
        },
      },
    },
  });

  console.log(`Seed pilotage démo OK : ${pilotage.id} (chantier ${project.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
