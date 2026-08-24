/**
 * Extraction heuristique PDF/CSV/XLSX → ImportedQuoteDraft.
 * Ne jamais inventer une donnée absente.
 */
import { createHash, randomBytes } from "crypto";
import { parseFrenchNumber } from "@/lib/commercial/import/french-number";
import { validateImportedDraftMath } from "@/lib/commercial/import/validate-math";
import type {
  ImportedLine,
  ImportedQuoteDraft,
  ImportedSection,
} from "@/lib/commercial/import/types";
import { extractPdfText } from "@/lib/pdf/extract-pdf-text";

function uid(): string {
  return randomBytes(6).toString("hex");
}

function sha256(buf: Buffer): string {
  return createHash("sha256").update(buf).digest("hex");
}

const MONTHS_FR: Record<string, number> = {
  janvier: 1,
  février: 2,
  fevrier: 2,
  mars: 3,
  avril: 4,
  mai: 5,
  juin: 6,
  juillet: 7,
  août: 8,
  aout: 8,
  septembre: 9,
  octobre: 10,
  novembre: 11,
  décembre: 12,
  decembre: 12,
};

export function detectScannedPdf(text: string, pageHint?: number): boolean {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length < 80) return true;
  // Texte quasi vide hors métadonnées « PDF scanné »
  if (/PDF scanné|texte non extractible/i.test(text) && cleaned.length < 400) {
    return true;
  }
  const letters = (cleaned.match(/[A-Za-zÀ-ÿ]/g) ?? []).length;
  if (letters < 40) return true;
  void pageHint;
  return false;
}

function parseFrenchDate(text: string): string | null {
  const iso = text.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  const dmy = text.match(/\b(\d{1,2})[\/.\-](\d{1,2})[\/.\-](20\d{2})\b/);
  if (dmy) {
    const d = dmy[1]!.padStart(2, "0");
    const m = dmy[2]!.padStart(2, "0");
    return `${dmy[3]}-${m}-${d}`;
  }

  const long = text.match(
    /\b(\d{1,2})\s+(janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre)\s+(20\d{2})\b/i,
  );
  if (long) {
    const month = MONTHS_FR[long[2]!.toLowerCase()];
    if (month) {
      return `${long[3]}-${String(month).padStart(2, "0")}-${long[1]!.padStart(2, "0")}`;
    }
  }
  return null;
}

function extractReference(text: string): string | null {
  const patterns = [
    /(?:n[°ºo]|num[eé]ro|r[eé]f(?:[eé]rence)?|devis)\s*[:\s]*([A-Z0-9][A-Z0-9\-\/]{2,24})/i,
    /\b(I-\d{2}-\d{2}-\d+)\b/i,
    /\b(DEV[- ]?\d{4}[- ]?\d+)\b/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m?.[1]) return m[1].trim();
  }
  return null;
}

function extractTotals(text: string): ImportedQuoteDraft["totals"] {
  const ht =
    parseFrenchNumber(
      text.match(/total\s*(?:h\.?\s*t\.?|ht)\s*[:\s]*([0-9\s\u00a0\u202f.,]+)\s*€?/i)?.[1],
    ) ??
    parseFrenchNumber(
      text.match(/montant\s*(?:h\.?\s*t\.?|ht)\s*[:\s]*([0-9\s\u00a0\u202f.,]+)\s*€?/i)?.[1],
    );

  const vat =
    parseFrenchNumber(
      text.match(/(?:montant\s*)?t\.?\s*v\.?\s*a\.?\s*(?:\([^)]*\))?\s*[:\s]*([0-9\s\u00a0\u202f.,]+)\s*€?/i)?.[1],
    ) ?? null;

  const ttc =
    parseFrenchNumber(
      text.match(/total\s*(?:t\.?\s*t\.?\s*c\.?|ttc)\s*[:\s]*([0-9\s\u00a0\u202f.,]+)\s*€?/i)?.[1],
    ) ?? null;

  let vatRateGuess: number | null = null;
  const vatRateM = text.match(/t\.?\s*v\.?\s*a\.?\s*(?:à\s*)?(\d{1,2}(?:[.,]\d+)?)\s*%/i);
  if (vatRateM) vatRateGuess = parseFrenchNumber(vatRateM[1]);

  if (ht != null && vat != null && ht > 0 && vatRateGuess == null) {
    const r = Math.round((vat / ht) * 1000) / 10;
    if (r > 0 && r < 30) vatRateGuess = r;
  }

  const confidence =
    ht != null || ttc != null ? ("ok" as const) : ("missing" as const);

  return { totalHt: ht, totalVat: vat, totalTtc: ttc, vatRateGuess, confidence };
}

function extractPaymentSchedule(
  text: string,
): ImportedQuoteDraft["paymentSchedule"] {
  const pcts = [...text.matchAll(/\b(\d{1,2})\s*%/g)]
    .map((m) => parseFrenchNumber(m[1]))
    .filter((n): n is number => n != null && n > 0 && n < 100);

  // Chercher un trio type 30/40/30 dans une zone « règlement / échéance / acompte »
  const zone = text.match(
    /(?:r[eé]glement|paiement|acompte|situation|solde|[eé]ch[eé]ancier)[\s\S]{0,400}/i,
  );
  const zoneText = zone?.[0] ?? text;
  const zonePcts = [...zoneText.matchAll(/\b(\d{1,2})\s*%/g)]
    .map((m) => parseFrenchNumber(m[1]))
    .filter((n): n is number => n != null && n > 0 && n <= 100);

  const candidates = zonePcts.length >= 2 ? zonePcts : pcts;
  // Prendre une séquence qui somme ~100
  for (let i = 0; i < candidates.length; i++) {
    for (let len = 2; len <= 4 && i + len <= candidates.length; len++) {
      const slice = candidates.slice(i, i + len);
      const sum = slice.reduce((a, b) => a + b, 0);
      if (Math.abs(sum - 100) <= 1) {
        return { percents: slice, confidence: "ok" };
      }
    }
  }
  return null;
}

function extractCustomer(text: string): ImportedQuoteDraft["customer"] {
  const warnings: string[] = [];
  void warnings;
  let name: string | null = null;
  const civil =
    text.match(
      /(?:client|destinataire|adress[eé]\s*[àa]|factur[eé]\s*[àa])\s*[:\s]*(?:m(?:onsieur|me|lle)?\.?\s+)?([A-ZÀ-Ÿ][A-Za-zÀ-ÿ'’\-]+(?:\s+[A-ZÀ-Ÿ][A-Za-zÀ-ÿ'’\-]+){0,4})/i,
    ) ??
    text.match(
      /\b(?:Monsieur|Madame|M\.|Mme)\s+([A-ZÀ-Ÿ][A-Za-zÀ-ÿ'’\-]+(?:\s+[A-ZÀ-Ÿ][A-Za-zÀ-ÿ'’\-]+){1,3})\b/,
    );
  if (civil?.[1]) name = civil[1].trim();

  const email = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0] ?? null;
  const phone =
    text.match(/(?:t[eé]l(?:[eé]phone)?|portable)\s*[:\s]*([0-9.\s]{8,18})/i)?.[1]?.replace(/\s+/g, " ").trim() ??
    text.match(/\b(0[1-9](?:[\s.]?\d{2}){4})\b/)?.[1]?.replace(/\s+/g, " ").trim() ??
    null;

  const addr = text.match(
    /(\d{1,4}\s+(?:avenue|av\.|rue|boulevard|bd\.|chemin|impasse|place|all[eé]e|route)[^\n,]{3,60})[,\s]+(\d{5})\s+([A-ZÀ-Ÿ][A-Za-zÀ-ÿ'’\-\s]{2,40})/i,
  );

  const confidence: ImportedQuoteDraft["customer"]["confidence"] = name
    ? "ok"
    : email || phone
      ? "warn"
      : "missing";

  return {
    name,
    addressLine1: addr?.[1]?.trim() ?? null,
    postalCode: addr?.[2]?.trim() ?? null,
    city: addr?.[3]?.trim() ?? null,
    email,
    phone,
    confidence,
  };
}

function extractIssuer(text: string): ImportedQuoteDraft["issuer"] {
  const head = text.slice(0, 800);
  // Éviter de prendre le client pour l’émetteur
  const m = head.match(
    /^[\s\S]{0,200}?([A-ZÀ-Ÿ][A-ZÀ-Ÿ0-9 &'\-]{2,40}(?:\s+BTP|\s+SARL|\s+SAS|\s+SA)?)/m,
  );
  const name = m?.[1]?.trim() ?? null;
  return {
    name,
    note: name
      ? `Émetteur détecté dans le document source : ${name} (métadonnée — ne remplace pas votre organisation BeWork).`
      : null,
  };
}

function extractSubject(text: string): string | null {
  const m =
    text.match(/(?:objet|désignation\s+des\s+travaux|travaux)\s*[:\-]\s*([^\n]{8,120})/i) ??
    text.match(/devis\s+(?:pour|relatif\s+[àa])\s+([^\n]{8,120})/i);
  return m?.[1]?.trim() ?? null;
}

/** Détection lignes : blocs se terminant par montants monétaires. */
function extractLinesFromText(
  text: string,
  defaultVat: number | null,
): ImportedSection[] {
  const lines: ImportedLine[] = [];
  const rawLines = text
    .split(/\n+/)
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const moneyRe = /([0-9\s\u00a0\u202f]+[.,]\d{2})\s*€?/g;
  const qtyUnitRe =
    /(\d+(?:[.,]\d+)?)\s*(u|unité|forfait|ft|ml|m²|m2|m³|m3|t|tonne|h|heure|j|jour|ens|ensemble)\b/i;

  let currentSection = "Ouvrages";
  const sectionMap = new Map<string, ImportedLine[]>();
  sectionMap.set(currentSection, []);

  for (const row of rawLines) {
    // Titre de section probable : majuscules, sans prix
    if (
      /^[A-ZÀ-Ÿ0-9][A-ZÀ-Ÿ0-9\s\-']{6,80}$/.test(row) &&
      !/€|\d+[.,]\d{2}/.test(row) &&
      !/SIRET|TVA|TOTAL|DEVIS|PAGE/i.test(row)
    ) {
      currentSection = row.trim();
      if (!sectionMap.has(currentSection)) sectionMap.set(currentSection, []);
      continue;
    }

    const monies = [...row.matchAll(moneyRe)].map((m) => parseFrenchNumber(m[1]));
    const amounts = monies.filter((n): n is number => n != null && n > 0);
    if (amounts.length === 0) continue;
    if (/total|t\.?\s*v\.?\s*a|ttc|acompte|solde/i.test(row) && amounts.length <= 2) {
      continue;
    }

    const qtyM = row.match(qtyUnitRe);
    let quantity: number | null = qtyM ? parseFrenchNumber(qtyM[1]) : null;
    let unit: string | null = qtyM?.[2] ? normalizeUnit(qtyM[2]) : null;

    // Dernier montant = HT ligne ; avant-dernier = PU si 2+
    let lineSellHt: number | null = amounts[amounts.length - 1] ?? null;
    let unitSellHt: number | null =
      amounts.length >= 2 ? amounts[amounts.length - 2]! : null;

    if (quantity == null && unitSellHt != null && lineSellHt != null && unitSellHt > 0) {
      const q = Math.round((lineSellHt / unitSellHt) * 1000) / 1000;
      if (q > 0 && q < 10000) quantity = q;
    }
    if (quantity == null) quantity = 1;
    if (unitSellHt == null && lineSellHt != null) {
      unitSellHt = lineSellHt;
    }

    let designation = row
      .replace(moneyRe, " ")
      .replace(qtyUnitRe, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (designation.length < 4) continue;
    if (designation.length > 500) designation = designation.slice(0, 500);

    const warnings: string[] = [];
    let confidence: ImportedLine["confidence"] = "ok";
    if (!unit) {
      unit = "U";
      warnings.push("Unité non détectée — U par défaut");
      confidence = "warn";
    }

    const line: ImportedLine = {
      id: uid(),
      kind: "WORK",
      designation,
      description: null,
      quantity,
      unit,
      unitSellHt,
      discountPercent: null,
      vatRate: defaultVat,
      lineSellHt,
      confidence,
      warnings,
    };
    sectionMap.get(currentSection)!.push(line);
  }

  const sections: ImportedSection[] = [];
  for (const [title, ls] of sectionMap) {
    if (ls.length === 0 && title === "Ouvrages") continue;
    if (ls.length === 0) continue;
    sections.push({ id: uid(), title, lines: ls });
  }
  if (sections.length === 0) {
    sections.push({ id: uid(), title: "Ouvrages", lines: [] });
  }
  return sections;
}

function normalizeUnit(u: string): string {
  const x = u.toLowerCase();
  if (x === "m2" || x === "m²") return "M²";
  if (x === "m3" || x === "m³") return "M³";
  if (x === "ml") return "ML";
  if (x === "ft" || x === "forfait") return "Forfait";
  if (x === "u" || x === "unité" || x === "unite") return "U";
  if (x === "h" || x === "heure") return "H";
  if (x === "j" || x === "jour") return "J";
  if (x === "t" || x === "tonne") return "T";
  if (x === "ens" || x === "ensemble") return "Ens";
  return u.toUpperCase();
}

/** Parse CSV/TSV tableur déjà extrait en texte. */
function extractLinesFromTabular(
  text: string,
  defaultVat: number | null,
): ImportedSection[] {
  const rows = text
    .split(/\n/)
    .map((r) => r.split(/\t|;|,/).map((c) => c.trim()))
    .filter((r) => r.some((c) => c.length > 0));
  if (rows.length < 2) return extractLinesFromText(text, defaultVat);

  const header = rows[0]!.map((h) => h.toLowerCase());
  const idx = {
    designation: header.findIndex((h) => /d[eé]sign|libell|description|ouvrage/.test(h)),
    qty: header.findIndex((h) => /qté|qte|quantit/.test(h)),
    unit: header.findIndex((h) => /unit/.test(h)),
    pu: header.findIndex((h) => /p\.?\s*u|prix|unitaire/.test(h)),
    ht: header.findIndex((h) => /montant|total|ht/.test(h)),
    discount: header.findIndex((h) => /remise|discount/.test(h)),
  };
  if (idx.designation < 0) return extractLinesFromText(text, defaultVat);

  const lines: ImportedLine[] = [];
  for (const row of rows.slice(1)) {
    const designation = row[idx.designation] ?? "";
    if (!designation || designation.length < 2) continue;
    const quantity =
      idx.qty >= 0 ? parseFrenchNumber(row[idx.qty] ?? "") : 1;
    const unit = idx.unit >= 0 ? normalizeUnit(row[idx.unit] || "U") : "U";
    const unitSellHt =
      idx.pu >= 0 ? parseFrenchNumber(row[idx.pu] ?? "") : null;
    const lineSellHt =
      idx.ht >= 0 ? parseFrenchNumber(row[idx.ht] ?? "") : null;
    const discountPercent =
      idx.discount >= 0 ? parseFrenchNumber(row[idx.discount] ?? "") : null;
    lines.push({
      id: uid(),
      kind: "WORK",
      designation,
      description: null,
      quantity,
      unit,
      unitSellHt,
      discountPercent,
      vatRate: defaultVat,
      lineSellHt,
      confidence: unitSellHt != null ? "ok" : "warn",
      warnings: unitSellHt == null ? ["PU non détecté"] : [],
    });
  }
  return [{ id: uid(), title: "Ouvrages", lines }];
}

export function buildDraftFromExtractedText(opts: {
  text: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  buffer?: Buffer;
  format: ImportedQuoteDraft["source"]["format"];
}): ImportedQuoteDraft {
  const scanned = opts.format === "pdf" && detectScannedPdf(opts.text);
  const warnings: string[] = [];
  if (scanned) {
    warnings.push(
      "Ce document semble être un PDF numérisé. L’import automatique des documents scannés sera prochainement disponible.",
    );
  }

  const totals = extractTotals(opts.text);
  const customer = extractCustomer(opts.text);
  const issuer = extractIssuer(opts.text);
  const reference = extractReference(opts.text);
  const issueDate = parseFrenchDate(opts.text);
  const subject = extractSubject(opts.text);
  const paymentSchedule = extractPaymentSchedule(opts.text);
  const bonPourAccordMention = /bon\s+pour\s+accord|signature/i.test(opts.text);

  if (!reference) warnings.push("Référence non détectée");
  if (!issueDate) warnings.push("Date non détectée");
  if (customer.confidence === "missing") warnings.push("Client non détecté");

  const sections =
    opts.format === "xlsx" || opts.format === "csv"
      ? extractLinesFromTabular(opts.text, totals.vatRateGuess)
      : extractLinesFromText(opts.text, totals.vatRateGuess);

  const lineCount = sections.reduce((n, s) => n + s.lines.length, 0);
  if (!scanned && lineCount === 0) {
    warnings.push(
      "Aucune ligne chiffrée identifiée automatiquement — vérifiez le document ou saisissez manuellement.",
    );
  }

  const draft: ImportedQuoteDraft = {
    source: {
      fileName: opts.fileName,
      mimeType: opts.mimeType,
      fileSize: opts.fileSize,
      sha256: opts.buffer ? sha256(opts.buffer) : null,
      storageKey: null,
      format: opts.format,
      scannedPdf: scanned,
    },
    reference,
    issueDate,
    subject,
    issuer,
    customer,
    sections,
    paymentSchedule,
    totals,
    warnings,
    flags: {
      bonPourAccordMention,
      mathOk: true,
      discountAmbiguity: false,
    },
  };

  if (scanned) return draft;
  return validateImportedDraftMath(draft);
}

export async function extractQuoteFileText(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
): Promise<{ text: string; format: ImportedQuoteDraft["source"]["format"]; warning?: string }> {
  const name = fileName.toLowerCase();
  const lower = mimeType.toLowerCase();

  if (lower === "application/pdf" || name.endsWith(".pdf")) {
    try {
      const text = await extractPdfText(buffer);
      return {
        text,
        format: "pdf",
        warning: text
          ? undefined
          : "PDF sans texte extractible (scanné ou image) — essayez Excel/CSV ou ressaisie",
      };
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      console.error("[import-quote] lecture PDF échouée:", detail);
      return {
        text: "",
        format: "pdf",
        warning: "Impossible de lire le PDF — fichier corrompu ou format non supporté",
      };
    }
  }

  if (name.endsWith(".csv") || lower.includes("csv") || lower === "text/plain") {
    return { text: buffer.toString("utf-8"), format: "csv" };
  }

  if (
    /\.(xlsx?|ods)$/i.test(name) ||
    lower.includes("spreadsheet") ||
    lower.includes("excel")
  ) {
    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.read(buffer, { type: "buffer", cellDates: true });
      const parts: string[] = [];
      for (const sheetName of wb.SheetNames.slice(0, 5)) {
        const sheet = wb.Sheets[sheetName];
        if (!sheet) continue;
        const csv = XLSX.utils.sheet_to_csv(sheet, { FS: "\t" });
        if (csv.trim()) parts.push(csv.trim());
      }
      return { text: parts.join("\n\n"), format: "xlsx" };
    } catch {
      return { text: "", format: "xlsx", warning: "Lecture Excel impossible" };
    }
  }

  return { text: "", format: "unknown", warning: "Format non supporté" };
}
