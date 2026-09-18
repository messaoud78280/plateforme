import { prisma } from "@/lib/prisma";
import { d } from "@/lib/commercial/decimal";

/** Contexte compact pour ChatGPT (item_id / section_id = IDs BeWork stables). */
export async function buildQuotePatchContextForChatgpt(input: {
  orgId: string;
  quoteId: string;
}): Promise<{ text: string; json: unknown } | null> {
  const quote = await prisma.commercialQuote.findFirst({
    where: { id: input.quoteId, organizationId: input.orgId },
    include: {
      currentVersion: {
        include: {
          sections: { orderBy: { sortOrder: "asc" } },
          lines: { orderBy: { sortOrder: "asc" } },
        },
      },
    },
  });
  if (!quote?.currentVersion) return null;

  const version = quote.currentVersion;
  const sections = version.sections.map((s) => ({
    section_id: s.id,
    title: s.title,
    items: version.lines
      .filter((l) => l.sectionId === s.id)
      .map((l) => ({
        item_id: l.id,
        reference: l.reference,
        designation: l.designation,
        description: l.description,
        quantity: d(l.quantity),
        unit: l.unit,
        unit_price_ht: d(l.unitSellHt),
        vat_rate: d(l.vatRate),
        discount_percent: d(l.discountPercent),
        line_ht: d(l.lineSellHt),
      })),
  }));

  const orphanItems = version.lines
    .filter((l) => !l.sectionId)
    .map((l) => ({
      item_id: l.id,
      reference: l.reference,
      designation: l.designation,
      description: l.description,
      quantity: d(l.quantity),
      unit: l.unit,
      unit_price_ht: d(l.unitSellHt),
      vat_rate: d(l.vatRate),
      discount_percent: d(l.discountPercent),
      line_ht: d(l.lineSellHt),
    }));

  const json = {
    type: "bework_quote_context_v1",
    target: {
      quote_number: quote.number,
      base_version: version.versionNumber,
      subject: quote.subject,
    },
    totals: {
      total_ht: d(quote.totalSellHt),
      total_ttc: d(quote.totalTtc),
    },
    sections,
    items_without_section: orphanItems,
    instructions_for_chatgpt: [
      "Réponds UNIQUEMENT avec un JSON de type bework_quote_patch_v1.",
      "Utilise les item_id et section_id fournis pour cibler les postes.",
      "Ne modifie que les champs explicitement demandés (patch sémantique).",
      "Ne calcule pas les totaux : BeWork les recalcule.",
      "Inclus un patch_id unique et stable.",
    ],
  };

  const text = [
    "Contexte devis BeWork pour génération d’un patch JSON.",
    `Devis ${quote.number} — version ${version.versionNumber}`,
    `Objet : ${quote.subject}`,
    `Total HT actuel : ${d(quote.totalSellHt)} €`,
    "",
    "JSON contexte :",
    JSON.stringify(json, null, 2),
    "",
    "Demande attendue : produire un bework_quote_patch_v1 avec les bons item_id / section_id.",
  ].join("\n");

  return { text, json };
}
