/**
 * Régénère uniquement le PDF DEV-2026-0148 (sans mutation).
 * Run: node --import tsx scripts/regen-dev-2026-0148-pdf.ts
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { prisma } from "../src/lib/prisma";
import { generateCurrentQuotePdfPreview } from "../src/lib/commercial/accepted-snapshot";

async function main() {
  const q = await prisma.commercialQuote.findFirst({
    where: { number: "DEV-2026-0148" },
    select: { id: true, organizationId: true },
  });
  if (!q) throw new Error("introuvable");
  const preview = await generateCurrentQuotePdfPreview(q.organizationId, q.id);
  if (!preview) throw new Error("pdf null");
  const dir = join(process.cwd(), "tmp/devis-pdf-refonte");
  mkdirSync(dir, { recursive: true });
  const out = join(dir, "DEV-2026-0148-apres.pdf");
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
