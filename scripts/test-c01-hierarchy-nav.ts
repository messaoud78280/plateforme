/**
 * Smoke C-01 : hrefs workspace + nav devis → périmètre Fondations.
 */
import { prisma } from "../src/lib/prisma";
import { getProjectWorkspace } from "../src/lib/chantier/project-workspace";
import { moduleChantierNav } from "../src/components/chantier/ChantierHierarchyNav";
import { resolveQuoteChantierNav } from "../src/lib/chantier/quote-chantier-nav";

async function main() {
  const project = await prisma.project.findFirst({
    where: { title: { contains: "C-01" } },
    select: { id: true, title: true, organizationId: true },
  });
  if (!project?.organizationId) throw new Error("C-01 introuvable");

  const ws = await getProjectWorkspace(project.organizationId, project.id);
  if (!ws) throw new Error("workspace null");

  const fond = ws.scopes.find((s) => /fondation/i.test(s.name));
  if (!fond) throw new Error("périmètre Fondations manquant");

  console.log("project", project.id, project.title);
  console.log("scope", fond.id, fond.name, fond.href);
  for (const c of fond.cards) {
    console.log(" card", c.kind, c.label, "→", c.href ?? "(null)");
  }

  const metre = fond.cards.find((c) => c.kind === "metre");
  const planning = fond.cards.find((c) => c.kind === "planning");
  const devis = fond.cards.find((c) => c.kind === "devis");
  const docs = fond.cards.find((c) => c.kind === "plan");

  if (!metre?.href) throw new Error("métré sans href");
  if (!planning?.href) throw new Error("planning sans href");
  if (!devis?.href) throw new Error("devis sans href");
  if (!docs?.href?.includes("scopeId=")) throw new Error("docs sans scopeId");

  const navM = moduleChantierNav({
    projectId: project.id,
    projectTitle: project.title,
    scope: { id: fond.id, name: fond.name },
    currentLabel: "Métré",
  });
  if (navM.backHref !== fond.href) throw new Error("back métré ≠ scope");
  if (navM.backLabel !== `Retour à ${fond.name}`) {
    throw new Error(`label back inattendu: ${navM.backLabel}`);
  }

  const quoteId = devis.href.split("/").pop()!;
  const quote = await prisma.commercialQuote.findFirst({
    where: { id: quoteId },
    select: {
      id: true,
      projectId: true,
      sourcePrepStudyId: true,
      project: { select: { id: true, title: true } },
    },
  });
  if (!quote) throw new Error("quote introuvable");

  const qNav = await resolveQuoteChantierNav(project.organizationId, quote);
  if (!qNav || qNav.backHref !== fond.href) {
    throw new Error(`devis nav back=${qNav?.backHref} attendu=${fond.href}`);
  }

  console.log("OK C-01 parcours hrefs + nav devis →", qNav.backLabel);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
