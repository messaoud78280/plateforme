/**
 * Génère le PDF DEMO-2026-0002 pour validation visuelle de la refonte.
 * Run: npx tsx scripts/preview-demo-2026-0002-pdf.ts
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { prisma } from "../src/lib/prisma";
import { generateCurrentQuotePdfPreview } from "../src/lib/commercial/accepted-snapshot";

async function main() {
  const q = await prisma.commercialQuote.findFirst({
    where: { number: "DEMO-2026-0002" },
    select: { id: true, organizationId: true, number: true },
  });
  if (!q) throw new Error("DEMO-2026-0002 introuvable");
  const preview = await generateCurrentQuotePdfPreview(q.organizationId, q.id);
  if (!preview) throw new Error("pdf null");
  const dir = join(process.cwd(), "tmp/devis-pdf-refonte");
  mkdirSync(dir, { recursive: true });
  const out = join(dir, "DEMO-2026-0002-apres.pdf");
  writeFileSync(out, preview.buffer);
  const pages = (preview.buffer.toString("latin1").match(/\/Type\s*\/Page(?!s)/g) || [])
    .length;
  console.log("OK", out, preview.buffer.length, "bytes", pages, "pages");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
