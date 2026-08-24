/**
 * Extraction heuristique PDF/CSV/XLSX → ImportedQuoteDraft.
 * Ne jamais inventer une donnée absente.
 */
import { createHash, randomBytes } from "crypto";
import { parseFrenchNumber } from "@/lib/commercial/import/french-number";
import { extractWorkSectionsFromQuoteText, normalizeUnit } from "@/lib/commercial/import/parse-quote-lines";
import { stripLegalBlocks, stripSignatureZone } from "@/lib/commercial/import/parse-zones";
import { validateImportedDraftMath } from "@/lib/commercial/import/validate-math";
import type {
  ImportedLine,
  ImportedQuoteDraft,
  ImportedSection,
} from "@/lib/commercial/import/types";
import { extractPdfDocument } from "@/lib/pdf/extract-pdf-text";

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
  if (/PDF scanné|texte non extractible/i.test(text) && cleaned.length < 400) {
    return true;
  }
  const letters = (cleaned.match(/[A-Za-zÀ-ÿ]/g) ?? []).length;
  if (letters < 40) return true;
  void pageHint;
  return false;
}

function parseLongFrenchDate(text: string): string | null {
  const long = text.match(
    /\b(?:le\s+)?(?:lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)?\s*(\d{1,2})\s+(janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre)\s+(20\d{2})\b/i,
  );
  if (long) {
    const month = MONTHS_FR[long[2]!.toLowerCase()];
    if (month) {
      return `${long[3]}-${String(month).padStart(2, "0")}-${long[1]!.padStart(2, "0")}`;
    }
  }
  return null;
}

function parseNumericDate(text: string): string | null {
  const iso = text.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  const dmy = text.match(/\b(\d{1,2})[\/.\-](\d{1,2})[\/.\-](20\d{2})\b/);
  if (dmy) {
    const d = dmy[1]!.padStart(2, "0");
    const m = dmy[2]!.padStart(2, "0");
    return `${dmy[3]}-${m}-${d}`;
  }
  return null;
}

/** Date d’émission : priorité en-tête / près de DEVIS N°, jamais signature. */
export function extractIssueDate(text: string): string | null {
  const withoutSig = stripSignatureZone(text);
  const headerZone =
    withoutSig.match(/DEVIS\s+N[°ºo][\s\S]{0,120}/i)?.[0] ??
    withoutSig.slice(0, 2500);

  return (
    parseLongFrenchDate(headerZone) ??
    parseLongFrenchDate(withoutSig) ??
    parseNumericDate(headerZone) ??
    null
  );
}

export function extractReference(text: string): string | null {
  const devisNum =
    text.match(/DEVIS\s+N[°ºo]\s*[\t :]*\s*([A-Z0-9][A-Z0-9\-\/]{2,24})/i) ??
    text.match(
      /(?:n[°ºo]\s*devis|r[eé]f(?:[eé]rence)?\s*devis|devis\s*n[°ºo]?)\s*[:\s]*([A-Z0-9][A-Z0-9\-\/]{2,24})/i,
    );
  if (devisNum?.[1]) {
    const v = devisNum[1].trim();
    if (!/^(TVA|HT|TTC|SIRET|NAF|IMAGE)$/i.test(v)) return v;
  }
  const coded = text.match(/\b(I-\d{2}-\d{2}-\d+)\b/i) ?? text.match(/\b(DEV[- ]?\d{4}[- ]?\d+)\b/i);
  if (coded?.[1]) return coded[1].trim();
  return null;
}

export function extractTotals(text: string): ImportedQuoteDraft["totals"] {
  // Bloc labels puis montants (souvent sur lignes séparées)
  const block = text.match(
    /Total\s*H\.?\s*T\.?[\s\S]{0,40}?T\.?\s*V\.?\s*A\.?[\s\S]{0,40}?Total\s*T\.?\s*T\.?\s*C\.?[\s\S]{0,80}?([0-9\s\u00a0\u202f]+[.,]\d{2})\s*€[\s\S]{0,40}?([0-9\s\u00a0\u202f]+[.,]\d{2})\s*€[\s\S]{0,40}?([0-9\s\u00a0\u202f]+[.,]\d{2})\s*€/i,
  );

  let ht: number | null = null;
  let vat: number | null = null;
  let ttc: number | null = null;

  if (block) {
    ht = parseFrenchNumber(block[1]);
    vat = parseFrenchNumber(block[2]);
    ttc = parseFrenchNumber(block[3]);
  } else {
    ht =
      parseFrenchNumber(
        text.match(/total\s*(?:h\.?\s*t\.?|ht)\s*[:\s]*([0-9\s\u00a0\u202f.,]+)\s*€?/i)?.[1],
      ) ?? null;
    vat =
      parseFrenchNumber(
        text.match(
          /(?:^|\n)\s*t\.?\s*v\.?\s*a\.?\s*(?:\([^)]*\))?\s*[:\s]*([0-9\s\u00a0\u202f.,]+)\s*€?/im,
        )?.[1],
      ) ?? null;
    ttc =
      parseFrenchNumber(
        text.match(/total\s*(?:t\.?\s*t\.?\s*c\.?|ttc)\s*[:\s]*([0-9\s\u00a0\u202f.,]+)\s*€?/i)?.[1],
      ) ?? null;
  }

  let vatRateGuess: number | null = null;
  const vatRateM = text.match(/t\.?\s*v\.?\s*a\.?\s*\(\s*(\d{1,2}(?:[.,]\d+)?)\s*%\s*\)/i);
  if (vatRateM) vatRateGuess = parseFrenchNumber(vatRateM[1]);
  if (vatRateGuess == null) {
    const alt = text.match(/t\.?\s*v\.?\s*a\.?\s*(?:à\s*)?(\d{1,2}(?:[.,]\d+)?)\s*%/i);
    if (alt) vatRateGuess = parseFrenchNumber(alt[1]);
  }

  if (ht != null && vat != null && ht > 0 && vatRateGuess == null) {
    const r = Math.round((vat / ht) * 1000) / 10;
    if (r > 0 && r < 30) vatRateGuess = r;
  }

  // Garde-fou : ne pas permuter HT/TTC
  if (ht != null && ttc != null && ht > ttc) {
    const swap = ht;
    ht = ttc;
    ttc = swap;
  }

  const confidence =
    ht != null && ttc != null ? ("ok" as const) : ht != null || ttc != null ? ("warn" as const) : ("missing" as const);

  return { totalHt: ht, totalVat: vat, totalTtc: ttc, vatRateGuess, confidence };
}

export function extractPaymentSchedule(
  text: string,
): ImportedQuoteDraft["paymentSchedule"] {
  const zone =
    text.match(/Conditions\s+de\s+paiement\s*:?[\s\S]{0,500}/i)?.[0] ??
    text.match(
      /(?:r[eé]glement|paiement|acompte|situation|solde|[eé]ch[eé]ancier)[\s\S]{0,400}/i,
    )?.[0] ??
    "";

  const fromBullets = [...zone.matchAll(/(\d+(?:[.,]\d+)?)\s*%\s*(?:soit\s+[0-9\s.,]+\s*€\s*)?:?\s*(Acompte|Paiement\s+solde|Solde)?/gi)]
    .map((m) => parseFrenchNumber(m[1]))
    .filter((n): n is number => n != null && n > 0 && n <= 100);

  const zonePcts =
    fromBullets.length >= 2
      ? fromBullets
      : [...zone.matchAll(/\b(\d{1,2}(?:[.,]\d+)?)\s*%/g)]
          .map((m) => parseFrenchNumber(m[1]))
          .filter((n): n is number => n != null && n > 0 && n <= 100);

  for (let i = 0; i < zonePcts.length; i++) {
    for (let len = 2; len <= 5 && i + len <= zonePcts.length; len++) {
      const slice = zonePcts.slice(i, i + len);
      const sum = slice.reduce((a, b) => a + b, 0);
      if (Math.abs(sum - 100) <= 1) {
        return { percents: slice.map((n) => Math.round(n)), confidence: "ok" };
      }
    }
  }
  return null;
}

export function extractCustomer(text: string): ImportedQuoteDraft["customer"] {
  const cleaned = stripLegalBlocks(text);

  let name: string | null = null;
  const civil =
    cleaned.match(
      /\b(?:Monsieur|Madame|M\.|Mme)\s+([A-ZÀ-Ÿ][A-Za-zÀ-ÿ'’\-]+(?:\s+[A-ZÀ-Ÿ][A-Za-zÀ-ÿ'’\-]+){1,3})\b/,
    ) ??
    cleaned.match(
      /(?:client|destinataire|adress[eé]\s*[àa]|factur[eé]\s*[àa])\s*[:\s]*(?:m(?:onsieur|me|lle)?\.?\s+)?([A-ZÀ-Ÿ][A-Za-zÀ-ÿ'’\-]+(?:\s+[A-ZÀ-Ÿ][A-Za-zÀ-ÿ'’\-]+){0,4})/i,
    );
  if (civil?.[1]) name = civil[1].trim();

  const email =
    cleaned.match(
      /(?:e-?mail)\s*[:\s]*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
    )?.[1] ??
    cleaned.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0] ??
    null;

  // Port. / Tél — ne pas coller « Port » dans la ville
  const phone =
    cleaned
      .match(
        /(?:Port\.?|T[eé]l(?:[eé]phone)?|portable)\s*[:\s]*(\+?\d[\d.\s]{8,20})/i,
      )?.[1]
      ?.replace(/\s+/g, " ")
      .trim() ??
    cleaned.match(/\b(\+33\s*[1-9](?:[\s.]?\d{2}){4})\b/)?.[1]?.replace(/\s+/g, " ").trim() ??
    cleaned.match(/\b(0[1-9](?:[\s.]?\d{2}){4})\b/)?.[1]?.replace(/\s+/g, " ").trim() ??
    null;

  const addrLine = cleaned.match(
    /(\d{1,4}\s+(?:avenue|av\.|rue|boulevard|bd\.|chemin|impasse|place|all[eé]e|route)[^\n,]{3,60})/i,
  )?.[1]?.trim() ?? null;

  const cityBlock = cleaned.match(/\b(\d{5})\s+([A-ZÀ-Ÿ][A-Za-zÀ-ÿ'’\-]+(?:\s+[A-ZÀ-Ÿ][A-Za-zÀ-ÿ'’\-]+)?)\b/);
  let postalCode = cityBlock?.[1] ?? null;
  let city = cityBlock?.[2]?.trim() ?? null;
  if (city && /^(Port|Tel|Tél|Email)$/i.test(city)) city = null;

  // Préférer le bloc client (avant émetteur) si plusieurs CP
  if (name) {
    const clientSlice = cleaned.match(
      new RegExp(
        `${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]{0,220}?(\\d{5})\\s+([A-ZÀ-Ÿ][A-Za-zÀ-ÿ'’\\-]+)`,
        "i",
      ),
    );
    if (clientSlice) {
      postalCode = clientSlice[1] ?? postalCode;
      city = clientSlice[2]?.trim() ?? city;
    }
  }

  const confidence: ImportedQuoteDraft["customer"]["confidence"] = name
    ? "ok"
    : email || phone
      ? "warn"
      : "missing";

  return {
    name,
    addressLine1: addrLine,
    postalCode,
    city,
    email,
    phone,
    confidence,
  };
}

export function extractIssuer(text: string): ImportedQuoteDraft["issuer"] {
  const m =
    text.match(/\b([A-ZÀ-Ÿ][A-ZÀ-Ÿ0-9 &'\-]{1,40}\s+BTP)\b/) ??
    text.match(/\b([A-ZÀ-Ÿ][A-ZÀ-Ÿ0-9 &'\-]{2,40}(?:\s+SARL|\s+SAS|\s+SA))\b/);
  const name = m?.[1]?.trim() ?? null;
  return {
    name,
    note: name
      ? `Émetteur détecté dans le document source : ${name} (métadonnée — ne remplace pas votre organisation BeWork).`
      : null,
  };
}

function extractSubject(text: string, hint: string | null): string | null {
  if (hint && hint.length >= 8) return hint;
  const m =
    text.match(/(?:objet|désignation\s+des\s+travaux|travaux)\s*[:\-]\s*([^\n]{8,160})/i) ??
    text.match(/R[eé]alisation\s+de\s+travaux[\s\S]{0,120}?eaux\s+pluviales\.?/i);
  return m?.[0]?.replace(/\s+/g, " ").trim() ?? m?.[1]?.trim() ?? null;
}

/** Détection lignes legacy (texte non tabulaire). */
function extractLinesFromText(
  text: string,
  defaultVat: number | null,
): ImportedSection[] {
  const { sections } = extractWorkSectionsFromQuoteText(text, defaultVat);
  const count = sections.reduce((n, s) => n + s.lines.length, 0);
  if (count > 0) return sections;

  // Fallback très prudent : ne jamais créer de ligne depuis une clause juridique
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
    if (/CLAUSE|Pénalité|Escompte|Indemnité|Fait avec|Page\s+\d+/i.test(row)) continue;
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
    if (amounts.length < 2) continue;
    if (/total|t\.?\s*v\.?\s*a|ttc|acompte|solde/i.test(row)) continue;

    const qtyM = row.match(qtyUnitRe);
    let quantity: number | null = qtyM ? parseFrenchNumber(qtyM[1]) : null;
    let unit: string | null = qtyM?.[2] ? normalizeUnit(qtyM[2]) : "U";
    let lineSellHt: number | null = amounts[amounts.length - 1] ?? null;
    let unitSellHt: number | null =
      amounts.length >= 2 ? amounts[amounts.length - 2]! : null;

    if (quantity == null && unitSellHt != null && lineSellHt != null && unitSellHt > 0) {
      const q = Math.round((lineSellHt / unitSellHt) * 1000) / 1000;
      if (q > 0 && q < 10000) quantity = q;
    }
    if (quantity == null) quantity = 1;
    if (unitSellHt == null && lineSellHt != null) unitSellHt = lineSellHt;

    let designation = row
      .replace(moneyRe, " ")
      .replace(qtyUnitRe, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (designation.length < 8) continue;
    if (designation.length > 500) designation = designation.slice(0, 500);

    sectionMap.get(currentSection)!.push({
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
      confidence: "warn",
      warnings: ["Ligne extraite en mode dégradé — à vérifier"],
    });
  }

  const out: ImportedSection[] = [];
  for (const [title, ls] of sectionMap) {
    if (ls.length === 0) continue;
    out.push({ id: uid(), title, lines: ls });
  }
  if (out.length === 0) out.push({ id: uid(), title: "Ouvrages", lines: [] });
  return out;
}

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
    if (/CLAUSE|Pénalité|réserve de propriété/i.test(designation)) continue;
    const quantity = idx.qty >= 0 ? parseFrenchNumber(row[idx.qty] ?? "") : 1;
    const unit = idx.unit >= 0 ? normalizeUnit(row[idx.unit] || "U") : "U";
    const unitSellHt = idx.pu >= 0 ? parseFrenchNumber(row[idx.pu] ?? "") : null;
    const lineSellHt = idx.ht >= 0 ? parseFrenchNumber(row[idx.ht] ?? "") : null;
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

  const workingText = stripSignatureZone(stripLegalBlocks(opts.text));

  const totals = extractTotals(opts.text);
  const customer = extractCustomer(opts.text);
  const issuer = extractIssuer(opts.text);
  const reference = extractReference(opts.text);
  const issueDate = extractIssueDate(opts.text);
  const paymentSchedule = extractPaymentSchedule(opts.text);
  const bonPourAccordMention = /bon\s+pour\s+accord|signature/i.test(opts.text);

  if (!reference) warnings.push("Référence non détectée");
  if (!issueDate) warnings.push("Date non détectée");
  if (customer.confidence === "missing") warnings.push("Client non détecté");

  let sections: ImportedSection[];
  let subjectHint: string | null = null;

  if (opts.format === "xlsx" || opts.format === "csv") {
    sections = extractLinesFromTabular(workingText, totals.vatRateGuess);
  } else {
    const extracted = extractWorkSectionsFromQuoteText(workingText, totals.vatRateGuess);
    sections = extracted.sections;
    subjectHint = extracted.subjectHint;
    if (sections.every((s) => s.lines.length === 0)) {
      sections = extractLinesFromText(workingText, totals.vatRateGuess);
    }
  }

  const subject = extractSubject(opts.text, subjectHint);

  const lineCount = sections.reduce(
    (n, s) => n + s.lines.filter((l) => l.kind === "WORK").length,
    0,
  );
  if (!scanned && lineCount === 0) {
    warnings.push(
      "Aucune ligne chiffrée fiable identifiée — création bloquée tant que des ouvrages ne sont pas détectés ou saisis.",
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
      const doc = await extractPdfDocument(buffer);
      const text = doc.text;
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
