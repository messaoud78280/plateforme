/**
 * Construction de la description devis à partir d'une fiche technique métré.
 */
import type { PrepLineDTO, PrepTechnicalReference } from "@/lib/preparation/types";
import { TECH_REF_KIND_LABELS } from "@/lib/preparation/types";
import { displayUnit, formatQty } from "@/lib/preparation/units";

const MAX_DESC = 12000;

function refLine(r: PrepTechnicalReference): string {
  const kind = TECH_REF_KIND_LABELS[r.kind] ?? r.kind;
  return r.note ? `• ${r.label} (${kind}) — ${r.note}` : `• ${r.label} (${kind})`;
}

/** Texte structuré pour CommercialQuoteLine.description. */
export function buildQuoteDescriptionFromPrepLine(
  line: PrepLineDTO,
  opts?: { quantity?: number | null; characteristics?: { label: string; value: string }[] },
): string {
  const parts: string[] = [];

  if (line.description?.trim()) {
    parts.push(line.description.trim());
  }

  if (line.includedServices.length) {
    parts.push(
      ["Prestations comprises :", ...line.includedServices.map((s) => `• ${s}`)].join("\n"),
    );
  }

  if (opts?.characteristics?.length) {
    parts.push(
      [
        "Caractéristiques :",
        ...opts.characteristics.map((c) => `• ${c.label} : ${c.value}`),
      ].join("\n"),
    );
  }

  if (line.technicalReferences.length) {
    parts.push(
      ["Références techniques :", ...line.technicalReferences.map(refLine)].join("\n"),
    );
  }

  if (line.executionNotes?.trim()) {
    parts.push(`Notes d'exécution : ${line.executionNotes.trim()}`);
  }

  if (line.qualityControls.length) {
    parts.push(["Contrôles :", ...line.qualityControls.map((c) => `• ${c}`)].join("\n"));
  }

  if (line.technicalReservations.length) {
    parts.push(
      ["Réserves / à confirmer :", ...line.technicalReservations.map((r) => `• ${r}`)].join(
        "\n",
      ),
    );
  }

  if (line.notes?.trim()) {
    parts.push(`Note métré : ${line.notes.trim()}`);
  }

  if (opts?.quantity != null) {
    parts.push(`Quantité métré à l'export : ${formatQty(opts.quantity)} ${displayUnit(line.unit)}`);
  }

  parts.push(`Réf. métré : ${line.code}`);

  const text = parts.join("\n\n");
  return text.length > MAX_DESC
    ? `${text.slice(0, MAX_DESC - 40)}\n\n… [suite dans le métré ${line.code}]`
    : text;
}

/** Une ligne métré est-elle candidate au transfert devis ? */
export function isPrepLineTransferable(role: string): boolean {
  return role === "quote" || role === "logistics";
}
