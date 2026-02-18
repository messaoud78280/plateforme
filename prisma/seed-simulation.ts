/**
 * Seed simulation TaskFlow Solutions - BelleVie Cosmétiques
 * Crée Sophie Mercier (client), Laure Olivie (gérante), Amina Benali (agent)
 * + projet BelleVie + données initiales pour la simulation
 */
import "dotenv/config";
import { PrismaClient, UserRole } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL est requis.");
}

const prisma = new PrismaClient();
async function main() {
  const password = await bcrypt.hash("motdepasse123", 12);

  // 1. Sophie Mercier (Client - BelleVie Cosmétiques)
  const sophie = await prisma.user.upsert({
    where: { email: "sophie.mercier@bellevie-cosmetiques.fr" },
    update: {},
    create: {
      email: "sophie.mercier@bellevie-cosmetiques.fr",
      password,
      name: "Sophie Mercier",
      role: UserRole.CLIENT,
      company: "BelleVie Cosmétiques",
      phone: "+33678453219",
    },
  });

  // 2. Laure Olivie (Gérante - IATASK, donne le travail aux assistants)
  const laure = await prisma.user.upsert({
    where: { email: "laure.olivie@iatask.fr" },
    update: {},
    create: {
      email: "laure.olivie@iatask.fr",
      password,
      name: "Laure Olivie",
      role: UserRole.MANAGER,
      company: "IATASK",
      phone: "+33187664523",
    },
  });

  // 3. Amina Benali (Agent - TaskFlow Solutions)
  const amina = await prisma.user.upsert({
    where: { email: "amina@taskflow-solutions.com" },
    update: {},
    create: {
      email: "amina@taskflow-solutions.com",
      password,
      name: "Amina Benali",
      role: UserRole.AGENCE,
      company: "TaskFlow Solutions",
      phone: "+213555123456",
    },
  });

  // 4. Projet BelleVie - Community Management
  const project = await prisma.project.upsert({
    where: { id: "sim-bellevie-001" },
    update: {},
    create: {
      id: "sim-bellevie-001",
      title: "BelleVie Cosmétiques - Community Management",
      description: "Gestion réseaux sociaux (Instagram/Facebook) + Support client email. Mission 1 mois renouvelable, 850€/mois HT. Début 24 février 2026.",
      status: "NOUVEAU",
      clientId: sophie.id,
      assignedToId: amina.id,
      urgency: "MOYENNE",
      notes: "Community Management, Support Client (30-50 emails/jour), Budget 850€/mois HT",
      dateSouhaitee: new Date("2026-02-24"),
      deadline: new Date("2026-03-24"),
    },
  });

  // 5. Message initial (premier contact)
  await prisma.message.upsert({
    where: { id: "sim-msg-001" },
    update: {},
    create: {
      id: "sim-msg-001",
      projectId: project.id,
      content: "Bonjour,\n\nJe suis directrice marketing chez BelleVie Cosmétiques. Nous recherchons un partenaire pour la gestion de nos réseaux sociaux (Instagram/Facebook) et le support client par email (30-50 emails/jour). Budget indicatif : 850€/mois HT. Merci de me recontacter.",
      senderId: sophie.id,
      receiverId: laure.id,
      read: false,
    },
  });

  // 6. Tâche exemple pour la simulation
  const task = await prisma.task.create({
    data: {
      title: "Prise en main des accès BelleVie",
      description: "☐ Tester accès Meta Business Suite\n☐ Tester accès email support",
      status: "EN_ATTENTE",
      clientId: sophie.id,
      projectId: project.id,
      assignedToId: amina.id,
    },
  });

  // 7. Activité pour le dashboard
  await prisma.activity.create({
    data: {
      type: "MESSAGE_SENT",
      title: "Premier contact Sophie Mercier",
      detail: "Demande de devis Community Management",
      clientId: sophie.id,
      projectId: project.id,
    },
  });

  // 8. Alerte pour Laure (nouveau message)
  await prisma.alert.create({
    data: {
      title: "Nouveau message client",
      message: "Sophie Mercier (BelleVie Cosmétiques) vous a envoyé une demande de devis.",
      level: "WARNING",
      clientId: laure.id,
      actionUrl: `/dashboard/projets/${project.id}`,
    },
  });

  console.log("✅ Simulation seed terminé:");
  console.log("  Sophie Mercier (client): sophie.mercier@bellevie-cosmetiques.fr");
  console.log("  Laure Olivie (gérante):  laure.olivie@iatask.fr");
  console.log("  Amina Benali (agent):    amina@taskflow-solutions.com");
  console.log("  Mot de passe: motdepasse123");
  console.log("  Projet:", project.title);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
