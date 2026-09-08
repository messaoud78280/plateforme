/**
 * Urban Aménagements — aligne le devis courant sur DEV-2026-0148
 * et fixe le prochain compteur à 149 (→ DEV-2026-0149).
 *
 * Usage: npx tsx scripts/set-urban-quote-seq-0148.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organization.findFirst({
    where: {
      OR: [
        { name: { equals: "URBAN AMÉNAGEMENTS", mode: "insensitive" } },
        { name: { contains: "URBAN", mode: "insensitive" } },
      ],
    },
    select: { id: true, name: true },
  });
  if (!org) throw new Error("Organisation Urban introuvable");

  const settings = await prisma.commercialOrgSettings.upsert({
    where: { organizationId: org.id },
    create: {
      organizationId: org.id,
      quotePrefix: "DEV",
      nextQuoteSeq: 149,
    },
    update: {
      quotePrefix: "DEV",
      nextQuoteSeq: 149,
    },
  });

  const quotes = await prisma.commercialQuote.findMany({
    where: { organizationId: org.id },
    orderBy: { createdAt: "asc" },
    select: { id: true, number: true, status: true, subject: true, createdAt: true },
  });

  console.log("Org:", org.name, org.id);
  console.log("nextQuoteSeq →", settings.nextQuoteSeq, "(aperçu DEV-2026-0149)");
  console.log(
    "Devis existants:",
    quotes.map((q) => `${q.number} [${q.status}] ${q.subject}`),
  );

  const target =
    quotes.find((q) => q.number === "DEV-2026-0002") ??
    quotes.find((q) => /^DEV-2026-\d+$/.test(q.number) && q.number !== "DEV-2026-0148") ??
    quotes[0];

  if (!target) {
    console.log("Aucun devis à renommer — compteur seul mis à jour.");
    return;
  }

  if (target.number === "DEV-2026-0148") {
    console.log("Devis déjà en DEV-2026-0148:", target.id);
    return;
  }

  const clash = await prisma.commercialQuote.findFirst({
    where: { organizationId: org.id, number: "DEV-2026-0148" },
    select: { id: true },
  });
  if (clash && clash.id !== target.id) {
    throw new Error("DEV-2026-0148 déjà pris par un autre devis");
  }

  await prisma.commercialQuote.update({
    where: { id: target.id },
    data: { number: "DEV-2026-0148" },
  });
  console.log(`Renommé ${target.number} → DEV-2026-0148 (${target.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
