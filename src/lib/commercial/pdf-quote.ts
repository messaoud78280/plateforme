/**
 * DEVIS PDF — document commercial BTP.
 * Moteur unique (preview + snapshot acceptation). Aucune IA.
 * Calculs = données serveur (QuotePdfInput) — aucun recalcul approximatif.
 */
import { jsPDF } from "jspdf";
import {
  computePaymentScheduleAmounts,
  parsePaymentSchedule,
  type PaymentSchedule,
} from "@/lib/commercial/payment-schedule";
import {
  ACCENT_ORANGE,
  BRAND_BRIGHT,
  DEFAULT_BRAND,
  INK,
  MUTED,
  RULE,
  SLATE,
  WASH_GRAY,
  WHITE,
  parseHexColor,
  tint,
  type Rgb,
} from "@/lib/commercial/pdf/colors";
import {
  compactLines,
  fmtDateLong,
  fmtEur,
  fmtPct,
  fmtQty,
  pdfSafe,
} from "@/lib/commercial/pdf/format";
import { tryDrawLogo } from "@/lib/commercial/pdf/logo";
import { drawDraftWatermark, drawDemoWatermark } from "@/lib/commercial/pdf/architectural-watermark";
import {
  DEFAULT_ACCEPTANCE_TEXT,
  type QuoteDocumentSettings,
} from "@/lib/commercial/pdf/document-settings";
import type { QuotePdfProjectPresentation } from "@/lib/commercial/quote-project-presentation";
import { DEMO_WATERMARK } from "@/lib/preparation/types";

export type QuotePdfSnapshot = {
  name?: string | null;
  tradeName?: string | null;
  activity?: string | null;
  siret?: string | null;
  siren?: string | null;
  vatNumber?: string | null;
  apeCode?: string | null;
  apeLabel?: string | null;
  legalForm?: string | null;
  formeJuridique?: string | null;
  capital?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  address?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  zipCode?: string | null;
  postalCode?: string | null;
  country?: string | null;
  contactName?: string | null;
  /** Chemin public local (ex. /brands/…) ou URL — réutilise DemoEnvironment.logoUrl. */
  logoPath?: string | null;
};

export type QuotePdfVatSlice = {
  rate: number;
  baseHt: number;
  vat: number;
};

export type QuotePdfLine = {
  kind: string;
  reference?: string | null;
  designation: string;
  description?: string | null;
  quantity: number;
  unit: string;
  unitSellHt: number;
  vatRate: number;
  lineSellHt: number;
  isOptional?: boolean;
};

export type QuotePdfInput = {
  number: string;
  subject: string;
  status: string;
  issueDate: Date;
  validityDate?: Date | null;
  paymentTerms?: string | null;
  paymentSchedule?: PaymentSchedule | null;
  clientNotes?: string | null;
  siteAddressSnapshot?: string | null;
  projectTitle?: string | null;
  versionNumber?: number | null;
  /** Devis de démonstration (Métré) — filigrane NON CONTRACTUEL. */
  isDemonstration?: boolean;
  issuer: QuotePdfSnapshot | null;
  client: QuotePdfSnapshot | null;
  currency: string;
  quoteMentions?: string | null;
  legalMentions?: string | null;
  insuranceMentions?: string | null;
  accentColor?: string | null;
  documentSettings?: QuoteDocumentSettings | null;
  bank?: {
    iban?: string | null;
    bic?: string | null;
    name?: string | null;
  } | null;
  acceptedAt?: Date | null;
  particularConditions?: string | null;
  executionDurationNote?: string | null;
  executionStartNote?: string | null;
  consumerContractContext?: string | null;
  vatBreakdown?: QuotePdfVatSlice[];
  /** Présentation projet optionnelle (préconisation, étapes, visuels, réserves). */
  projectPresentation?: QuotePdfProjectPresentation | null;
  /** Logo déjà résolu en data URL (http/https). */
  issuerLogoDataUrl?: string | null;
  totals: {
    totalSellHt: number;
    totalVat: number;
    totalTtc: number;
  };
  sections: Array<{
    title: string;
    lines: QuotePdfLine[];
  }>;
};

const MARGIN = 15;
const FOOTER_H = 13;
const HEADER_CONT_H = 13;
const FS = {
  display: 19,
  company: 12.5,
  title: 10.5,
  section: 9,
  body: 8.1,
  small: 7.1,
  micro: 6.3,
} as const;

/** Largeurs colonnes tableau (% de la zone utile) — grille fixe multi-pages. */
const COL_PCT = {
  ref: 0.08,
  desc: 0.48,
  qty: 0.1,
  unit: 0.08,
  pu: 0.12,
  ht: 0.14,
} as const;

type IssuerGroups = {
  activity: string | null;
  address: string[];
  contact: string[];
  admin: string[];
};

function issuerGroups(s: QuotePdfSnapshot | null): IssuerGroups {
  if (!s) return { activity: null, address: [], contact: [], admin: [] };
  const ape =
    s.apeCode && s.apeLabel
      ? `APE ${s.apeCode} — ${s.apeLabel}`
      : s.apeCode
        ? `APE ${s.apeCode}`
        : null;
  return {
    activity: s.activity?.trim() || null,
    address: compactLines([
      s.addressLine1 || s.address,
      s.addressLine2,
      [s.postalCode || s.zipCode, s.city].filter(Boolean).join(" ") || null,
      s.country && s.country !== "France" ? s.country : null,
    ]),
    contact: compactLines([s.email, s.phone, s.website]),
    admin: compactLines([
      s.siret ? `SIRET ${s.siret}` : null,
      s.vatNumber ? `TVA ${s.vatNumber}` : null,
      ape,
    ]),
  };
}

/** Affichage sujet sans répéter le filigrane déjà porté par le badge. */
function displaySubject(subject: string, isDemo: boolean): string {
  let s = subject.trim();
  if (isDemo) {
    s = s
      .replace(new RegExp(`^${DEMO_WATERMARK}\\s*[—\\-–]*\\s*`, "i"), "")
      .replace(new RegExp(`${DEMO_WATERMARK}\\s*[—\\-–]*\\s*`, "gi"), "")
      .replace(/\s{2,}/g, " ")
      .trim();
  }
  return s || subject.trim();
}

function displayProjectTitle(title: string | null | undefined, isDemo: boolean): string | null {
  if (!title?.trim()) return null;
  let t = title.trim();
  if (isDemo) t = t.replace(/^D[ÉE]MO\s*[—\-–]\s*/i, "").trim();
  return t || title.trim();
}

/** Extrait LOT / PLAN depuis le sujet pour le cartouche contexte (présentation seule). */
function extractLotPlan(subject: string): { lot: string | null; plan: string | null } {
  const clean = displaySubject(subject, true);
  const planMatch =
    clean.match(/\bPlan\s+([A-Z0-9][A-Z0-9._-]*)\b/i) ||
    clean.match(/\b([A-Z]-?\d{2})\b/);
  const plan = planMatch?.[1] ?? null;
  let lot: string | null = null;
  const parts = clean.split(/\s*[—\-–]\s*/).map((p) => p.trim()).filter(Boolean);
  for (const p of parts) {
    if (/plan\b/i.test(p) || /d[ée]monstration/i.test(p) || /formation/i.test(p)) continue;
    if (p.length >= 3 && p.length <= 48) {
      lot = p.replace(/\s*\(.*\)\s*$/, "").trim();
      break;
    }
  }
  return { lot, plan };
}

function clientBlockLines(s: QuotePdfSnapshot | null): string[] {
  if (!s) return [];
  const name = s.tradeName || s.name;
  return compactLines([
    name,
    s.contactName && s.contactName !== name ? s.contactName : null,
    s.addressLine1 || s.address,
    s.addressLine2,
    [s.postalCode || s.zipCode, s.city].filter(Boolean).join(" ") || null,
    s.email || null,
    s.phone || null,
  ]);
}

function footerLegalLine(s: QuotePdfSnapshot | null, extra?: string | null): string {
  if (!s) return (extra ?? "").trim();
  const parts = compactLines([
    s.tradeName || s.name,
    s.legalForm || s.formeJuridique,
    s.capital ? `au capital de ${s.capital}` : null,
    s.siret ? `SIRET ${s.siret}` : null,
    s.vatNumber ? `TVA ${s.vatNumber}` : null,
    extra,
  ]);
  return parts.join(" · ");
}

function isOptionLine(line: QuotePdfLine): boolean {
  return Boolean(line.isOptional) || line.kind === "OPTION";
}

function isPricedWork(line: QuotePdfLine): boolean {
  return line.kind === "WORK" && !isOptionLine(line);
}

/** Désignation / descriptif / observation — parsing présentation (contenu inchangé). */
type DescBlock =
  | { type: "para"; text: string }
  | { type: "list"; title: string; items: string[] }
  | { type: "callout"; variant: "tech" | "hypo"; title: string; text: string };

function softCapDesc(s: string, refHint: string | null): string {
  const MAX_TECH = 1600;
  if (s.length <= MAX_TECH) return s;
  const cut = s.slice(0, MAX_TECH - 60).trimEnd();
  const suffix = refHint
    ? `… [détail complet dans le métré ${refHint}]`
    : "… [détail complet dans BeWork Devis]";
  return `${cut}\n${suffix}`;
}

function parseDescriptionBlocks(raw: string, refHint: string | null): DescBlock[] {
  const text = softCapDesc(raw.trim(), refHint);
  if (!text) return [];
  const blocks: DescBlock[] = [];
  const chunks = text
    .split(/\n\s*\n/)
    .map((p) => p.replace(/[ \t]+/g, " ").trim())
    .filter(Boolean);

  const listTitleRe =
    /^(Prestations comprises|Inclus|Compris|Caractéristiques(?:\s+de\s+d[ée]monstration)?|Références?\s+techniques?|Contr[ôo]les|R[ée]serves(?:\s*\/\s*[àa]\s*confirmer)?|Notes d['’]ex[ée]cution|Hypoth[èe]ses?(?:\s+[ée]conomiques)?)\s*[:：]?\s*$/i;

  for (const chunk of chunks) {
    const lines = chunk.split("\n").map((l) => l.trim()).filter(Boolean);
    const first = lines[0] ?? "";
    const listMatch = first.match(listTitleRe);
    const bulletLines = lines.filter((l) => /^[•\-\*·]\s+/.test(l));
    if (
      listMatch ||
      (bulletLines.length >= 2 &&
        /prestations|compris|inclus|caract[ée]ristiques|r[ée]f[ée]rences|contr[ôo]les|r[ée]serves|notes/i.test(
          first,
        ))
    ) {
      const title = (listMatch?.[1] || first.replace(/\s*[:：]\s*$/, "")).trim();
      const items = lines
        .slice(listMatch || /[:：]\s*$/.test(first) ? 1 : 0)
        .map((l) => l.replace(/^[•\-\*·]\s+/, "").trim())
        .filter(Boolean);
      if (items.length) {
        const isCallout =
          /r[ée]f[ée]rences?\s+techniques?/i.test(title) ||
          /hypoth/i.test(title) ||
          /r[ée]serves/i.test(title);
        if (isCallout && items.length <= 3 && items.every((i) => i.length < 220)) {
          blocks.push({
            type: "callout",
            variant: /hypoth/i.test(title) || /r[ée]serves/i.test(title) ? "hypo" : "tech",
            title,
            text: items.map((i) => `• ${i}`).join("\n"),
          });
        } else {
          blocks.push({ type: "list", title, items });
        }
        continue;
      }
    }

    const techMatch = chunk.match(
      /^(Références?\s+techniques?|Référence\s+technique(?:\s+indicative)?)\s*[:：]\s*([\s\S]+)$/i,
    );
    if (techMatch) {
      blocks.push({
        type: "callout",
        variant: "tech",
        title: techMatch[1]!.trim(),
        text: techMatch[2]!.trim(),
      });
      continue;
    }

    const hypoMatch = chunk.match(
      /^(Hypothèses?(?:\s+de\s+d[ée]monstration)?(?:\s+[ée]conomiques)?)\s*[:：]\s*([\s\S]+)$/i,
    );
    if (hypoMatch) {
      blocks.push({
        type: "callout",
        variant: "hypo",
        title: hypoMatch[1]!.trim(),
        text: hypoMatch[2]!.trim(),
      });
      continue;
    }

    // Pied de fiche métré — typo secondaire discrète
    if (/^(Quantité métré|Réf\.\s*métré|Note métré)\b/i.test(first)) {
      blocks.push({
        type: "callout",
        variant: "tech",
        title: "Métré",
        text: chunk.replace(/\n+/g, " · "),
      });
      continue;
    }

    blocks.push({ type: "para", text: chunk.replace(/\n+/g, " ") });
  }
  return blocks;
}

function splitLineCopy(line: QuotePdfLine): {
  title: string;
  blocks: DescBlock[];
} {
  const title = (line.designation || "").trim();
  const raw = (line.description || "").trim();
  if (!raw) return { title, blocks: [] };
  const refMatch = raw.match(/Réf\. métré\s*:\s*([A-Z0-9._-]+)/i);
  const refHint = refMatch?.[1] ?? line.reference ?? null;
  return { title, blocks: parseDescriptionBlocks(raw, refHint) };
}

function stabilizePdfDocumentIds(pdf: Buffer): Buffer {
  const latin = pdf.toString("latin1");
  const fixed =
    "/ID[<00000000000000000000000000000000><00000000000000000000000000000000>]";
  const next = latin.replace(/\/ID\s*\[[^\]]*\]/g, fixed);
  return Buffer.from(next, "latin1");
}

/** PDF devis client — sans logo BeWork. Moteur unique (preview + snapshot). */
export function generateQuotePdfBuffer(input: QuotePdfInput): Buffer {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  if (typeof doc.setCreationDate === "function") {
    doc.setCreationDate(input.issueDate);
  }
  doc.setProperties({
    title: `Devis ${input.number}`,
    subject: input.subject,
    creator: "BeWork Devis & Facturation",
  });

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const contentW = pageW - MARGIN * 2;
  const brand = parseHexColor(input.accentColor, DEFAULT_BRAND);
  const wash = tint(brand, 0.94);
  const washSoft = WASH_GRAY;
  const orangeWash = tint(ACCENT_ORANGE, 0.9);
  const docSettings = input.documentSettings ?? {};
  const isDraft = input.status === "DRAFT" || input.status === "TO_VALIDATE";
  const isDemo = input.isDemonstration === true;

  let y = MARGIN;
  let inTable = false;

  const contentBottom = () => pageH - FOOTER_H - 3;

  const paintDraftIfNeeded = () => {
    if (isDemo) drawDemoWatermark(doc, pageW, pageH);
    else if (isDraft) drawDraftWatermark(doc, pageW, pageH);
  };

  const startNewPage = () => {
    doc.addPage();
    paintDraftIfNeeded();
    y = MARGIN;
    drawContinuationHeader();
    if (inTable) drawTableHeader();
  };

  const ensureSpace = (need: number) => {
    if (y + need <= contentBottom()) return;
    startNewPage();
  };

  const displayNumber =
    input.versionNumber != null && input.versionNumber > 1
      ? `${input.number}-R${input.versionNumber - 1}`
      : input.number;

  const issuerName = input.issuer?.tradeName || input.issuer?.name || "";
  const projectLabel = displayProjectTitle(input.projectTitle, isDemo);
  const subjectDisplay = displaySubject(input.subject || "", isDemo);
  const { lot: lotHint, plan: planHint } = extractLotPlan(input.subject || "");

  function drawContinuationHeader() {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(FS.small);
    doc.setTextColor(...brand);
    const left =
      issuerName && displayNumber
        ? `${issuerName}  |  ${displayNumber}`
        : issuerName || `Devis ${displayNumber}`;
    doc.text(left, MARGIN, y + 3.2);
    if (projectLabel) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(FS.micro);
      doc.setTextColor(...SLATE);
      doc.text(pdfSafe(projectLabel), MARGIN, y + 7.2);
    }
    doc.setDrawColor(...brand);
    doc.setLineWidth(0.35);
    doc.line(MARGIN, y + 9.5, pageW - MARGIN, y + 9.5);
    doc.setDrawColor(...ACCENT_ORANGE);
    doc.setLineWidth(0.7);
    doc.line(MARGIN, y + 9.5, MARGIN + 18, y + 9.5);
    y += HEADER_CONT_H;
  }

  paintDraftIfNeeded();

  // ——— PAGE 1 HEADER (2 zones) ———
  if (isDemo) {
    const badge = "DÉMONSTRATION  ·  NON CONTRACTUEL";
    doc.setFillColor(...orangeWash);
    doc.roundedRect(MARGIN, y, contentW, 6.2, 0.8, 0.8, "F");
    doc.setDrawColor(...ACCENT_ORANGE);
    doc.setLineWidth(0.35);
    doc.roundedRect(MARGIN, y, contentW, 6.2, 0.8, 0.8, "S");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(FS.small);
    doc.setTextColor(...ACCENT_ORANGE);
    doc.text(badge, pageW / 2, y + 4.1, { align: "center" });
    y += 8.5;
  }

  const headerTop = y;
  const logoSource = input.issuerLogoDataUrl || input.issuer?.logoPath;
  const logoH = tryDrawLogo(doc, logoSource, MARGIN, y, 36, 14);
  let leftY = logoH > 0 ? y + logoH + 2.5 : y;
  const groups = issuerGroups(input.issuer);

  if (issuerName) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(FS.company);
    doc.setTextColor(...brand);
    doc.text(issuerName.toUpperCase(), MARGIN, leftY + 4);
    leftY += 7.2;
  }
  if (groups.activity) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(FS.small);
    doc.setTextColor(...BRAND_BRIGHT);
    const actLines = doc.splitTextToSize(pdfSafe(groups.activity), contentW * 0.52);
    doc.text(actLines, MARGIN, leftY);
    leftY += actLines.length * 3.5 + 2.2;
  }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(FS.small);
  doc.setTextColor(...SLATE);
  for (const line of groups.address) {
    doc.text(pdfSafe(line), MARGIN, leftY);
    leftY += 3.55;
  }
  if (groups.address.length && groups.contact.length) leftY += 1.8;
  for (const line of groups.contact) {
    doc.text(pdfSafe(line), MARGIN, leftY);
    leftY += 3.55;
  }
  if ((groups.address.length || groups.contact.length) && groups.admin.length) {
    leftY += 2.2;
  }
  doc.setFontSize(FS.micro);
  doc.setTextColor(...MUTED);
  for (const line of groups.admin) {
    doc.text(pdfSafe(line), MARGIN, leftY);
    leftY += 3.15;
  }

  // Zone droite — DEVIS
  const rightX = pageW - MARGIN;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(FS.display);
  doc.setTextColor(...brand);
  doc.text("DEVIS", rightX, headerTop + 7, { align: "right" });
  doc.setFillColor(...ACCENT_ORANGE);
  doc.rect(rightX - 28, headerTop + 9.2, 28, 0.7, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...INK);
  doc.text(displayNumber, rightX, headerTop + 15.5, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(FS.small);
  doc.setTextColor(...SLATE);
  let ry = headerTop + 20.5;
  doc.text(fmtDateLong(input.issueDate), rightX, ry, { align: "right" });
  ry += 4;
  if (input.validityDate) {
    doc.text(`Valable jusqu’au ${fmtDateLong(input.validityDate)}`, rightX, ry, {
      align: "right",
    });
    ry += 4;
  }
  if (input.acceptedAt && input.status === "ACCEPTED") {
    doc.setTextColor(...brand);
    doc.text(`Accepté le ${fmtDateLong(input.acceptedAt)}`, rightX, ry, {
      align: "right",
    });
    ry += 4;
  }
  if (docSettings.quoteFeeLabel?.trim()) {
    doc.setTextColor(...SLATE);
    doc.text(docSettings.quoteFeeLabel.trim(), rightX, ry, {
      align: "right",
    });
    ry += 4;
  }

  y = Math.max(leftY + 4, ry + 3, headerTop + 32);

  // ——— Client / Contexte chantier ———
  const clientLines = clientBlockLines(input.client);
  const showClient = clientLines.length > 0;
  const contextRows = compactLines([
    projectLabel ? `CHANTIER|${projectLabel}` : null,
    lotHint ? `LOT|${lotHint}` : null,
    planHint ? `PLAN|${planHint}` : null,
    !projectLabel && input.siteAddressSnapshot
      ? `ADRESSE|${input.siteAddressSnapshot}`
      : input.siteAddressSnapshot && projectLabel
        ? `ADRESSE|${input.siteAddressSnapshot}`
        : null,
  ]);
  const showContext = contextRows.length > 0;

  if (showClient || showContext) {
    const gap = 4;
    const fullW = contentW;
    const cardW = showClient && showContext ? (fullW - gap) / 2 : fullW;
    const lineH = 3.6;
    const padX = 3.5;
    const labelH = 5;

    const measureContext = () => {
      let h = 3;
      for (const row of contextRows) {
        const [, val] = row.split("|");
        doc.setFontSize(FS.body);
        const wrapped = doc.splitTextToSize(pdfSafe(val || ""), cardW - padX * 2 - 2);
        h += 3.5 + Math.max(1, wrapped.length) * lineH + 2.2;
      }
      return h + 2;
    };
    const measureClient = () => {
      let h = labelH;
      clientLines.forEach((line, i) => {
        doc.setFontSize(i === 0 ? FS.body : FS.small);
        const wrapped = doc.splitTextToSize(pdfSafe(line), cardW - padX * 2);
        h += wrapped.length * lineH;
      });
      return h + 3.5;
    };

    const cardH = Math.max(
      showClient ? measureClient() : 0,
      showContext ? measureContext() : 0,
      14,
    );

    const drawClientCard = (x: number, width: number) => {
      doc.setFillColor(...washSoft);
      doc.roundedRect(x, y, width, cardH, 1, 1, "F");
      doc.setFillColor(...brand);
      doc.rect(x, y, 1.2, cardH, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(FS.micro);
      doc.setTextColor(...brand);
      doc.text("CLIENT", x + padX, y + 4.2);
      let cy = y + 9;
      clientLines.forEach((line, i) => {
        const isName = i === 0;
        doc.setFont("helvetica", isName ? "bold" : "normal");
        doc.setFontSize(isName ? FS.body : FS.small);
        doc.setTextColor(...(isName ? INK : SLATE));
        const wrapped = doc.splitTextToSize(pdfSafe(line), width - padX * 2);
        doc.text(wrapped, x + padX, cy);
        cy += wrapped.length * lineH;
      });
    };

    const drawContextCard = (x: number, width: number) => {
      doc.setFillColor(...wash);
      doc.roundedRect(x, y, width, cardH, 1, 1, "F");
      doc.setFillColor(...ACCENT_ORANGE);
      doc.rect(x, y, 1.2, cardH, "F");
      let cy = y + 5;
      for (const row of contextRows) {
        const [lab, val] = row.split("|");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(FS.micro);
        doc.setTextColor(...ACCENT_ORANGE);
        doc.text(lab || "", x + padX, cy);
        cy += 3.5;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(FS.body);
        doc.setTextColor(...INK);
        const wrapped = doc.splitTextToSize(
          pdfSafe(val || ""),
          width - padX * 2 - 2,
        );
        doc.text(wrapped, x + padX, cy);
        cy += wrapped.length * lineH + 2.2;
      }
    };

    if (showClient && showContext) {
      drawClientCard(MARGIN, cardW);
      drawContextCard(MARGIN + cardW + gap, cardW);
    } else if (showClient) {
      drawClientCard(MARGIN, cardW);
    } else {
      drawContextCard(MARGIN, cardW);
    }
    y += cardH + 5;
  }

  // ——— Objet ———
  if (subjectDisplay) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(FS.micro);
    doc.setTextColor(...MUTED);
    doc.text("OBJET", MARGIN, y);
    y += 4.4;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(FS.title);
    doc.setTextColor(...INK);
    const subjectLines = doc.splitTextToSize(pdfSafe(subjectDisplay), contentW);
    doc.text(subjectLines, MARGIN, y);
    y += subjectLines.length * 4.8 + 4.5;
  }

  // Colonnes tableau — largeurs % fixes
  const colW = {
    ref: contentW * COL_PCT.ref,
    desc: contentW * COL_PCT.desc,
    qty: contentW * COL_PCT.qty,
    unit: contentW * COL_PCT.unit,
    pu: contentW * COL_PCT.pu,
    ht: contentW * COL_PCT.ht,
  };
  const colRef = MARGIN;
  const colDesc = colRef + colW.ref;
  const colQtyL = colDesc + colW.desc;
  const colUnitL = colQtyL + colW.qty;
  const colPuL = colUnitL + colW.unit;
  const colHtL = colPuL + colW.pu;
  const colQty = colQtyL + colW.qty - 1.2;
  const colUnit = colUnitL + colW.unit / 2;
  const colPu = colPuL + colW.pu - 1.2;
  const colHt = pageW - MARGIN;
  const descW = colW.desc - 2.5;

  const vatRates = new Set<number>();
  for (const sec of input.sections) {
    for (const l of sec.lines) {
      if (isPricedWork(l) || isOptionLine(l)) vatRates.add(l.vatRate);
    }
  }
  const multiVat = vatRates.size > 1;

  function drawTableHeader() {
    const h = 7;
    doc.setFillColor(...brand);
    doc.rect(MARGIN, y, contentW, h, "F");
    doc.setFillColor(...ACCENT_ORANGE);
    doc.rect(MARGIN, y + h - 0.7, contentW, 0.7, "F");
    // Séparateurs de colonnes numériques (lisibilité Qté / U / montants)
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.2);
    for (const x of [colQtyL, colUnitL, colPuL, colHtL]) {
      doc.line(x, y + 1.2, x, y + h - 1.2);
    }
    doc.setTextColor(...WHITE);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(FS.small);
    const hy = y + 4.6;
    doc.text("Réf.", colRef + 1.2, hy);
    doc.text("Désignation", colDesc, hy);
    doc.text("Qté", colQty, hy, { align: "right" });
    doc.text("U", colUnit, hy, { align: "center" });
    doc.text("P.U. HT", colPu, hy, { align: "right" });
    doc.text("Total HT", colHt, hy, { align: "right" });
    y += h + 1.2;
  }

  function wrapBlockText(text: string, width: number, style: "normal" | "bold" | "italic" = "normal", size = FS.small): string[] {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    return doc.splitTextToSize(pdfSafe(text), width) as string[];
  }

  function measureBlocksH(blocks: DescBlock[]): number {
    let h = 0;
    for (const b of blocks) {
      if (b.type === "para") {
        h += wrapBlockText(b.text, descW).length * 3.1 + 0.8;
      } else if (b.type === "list") {
        h += 3.3;
        for (const item of b.items) {
          h += wrapBlockText(`• ${item}`, descW - 1).length * 3.0 + 0.25;
        }
        h += 1.0;
      } else {
        const body = wrapBlockText(b.text, descW - 3);
        h += 3.1 + body.length * 2.95 + 1.6;
      }
    }
    return h;
  }

  function measureCommentH(line: QuotePdfLine): number {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(FS.small);
    const t = doc.splitTextToSize(pdfSafe(line.designation), contentW - 4);
    return t.length * 3.4 + 2;
  }

  function measureWorkRow(line: QuotePdfLine): {
    titleLines: string[];
    blocks: DescBlock[];
    headerH: number;
    totalH: number;
  } {
    const copy = splitLineCopy(line);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(FS.body);
    const titleLines = doc.splitTextToSize(pdfSafe(copy.title), descW) as string[];
    const blocksH = measureBlocksH(copy.blocks);
    const headerH = 2.4 + titleLines.length * 3.55 + (multiVat ? 3.2 : 0);
    const totalH = Math.max(8, headerH + blocksH + 2);
    return { titleLines, blocks: copy.blocks, headerH, totalH };
  }

  const optionLines: QuotePdfLine[] = [];
  const workSections = input.sections.map((sec) => {
    const work: QuotePdfLine[] = [];
    for (const line of sec.lines) {
      if (isOptionLine(line) && line.kind !== "COMMENT" && line.kind !== "SUBTOTAL") {
        optionLines.push(line);
      } else {
        work.push(line);
      }
    }
    return { title: sec.title, lines: work };
  });

  drawTableHeader();
  inTable = true;

  for (const section of workSections) {
    if (section.lines.length === 0) continue;

    const first = section.lines[0]!;
    const firstH =
      first.kind === "COMMENT" || first.kind === "SUBTOTAL"
        ? measureCommentH(first)
        : measureWorkRow(first).totalH;
    ensureSpace(7.5 + firstH + 2);

    // Bandeau lot
    const lotH = 6.8;
    doc.setFillColor(...wash);
    doc.rect(MARGIN, y, contentW, lotH, "F");
    doc.setFillColor(...ACCENT_ORANGE);
    doc.rect(MARGIN, y, 2.2, lotH, "F");
    doc.setTextColor(...brand);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(FS.body);
    doc.text(pdfSafe(section.title.toUpperCase()), MARGIN + 4.5, y + 4.5);
    y += lotH + 1.5;

    let sectionHt = 0;
    const pricedCount = section.lines.filter((l) => isPricedWork(l)).length;
    let pricedDrawn = 0;

    for (const line of section.lines) {
      if (line.kind === "COMMENT" || line.kind === "SUBTOTAL") {
        const t = doc.splitTextToSize(pdfSafe(line.designation), contentW - 4);
        ensureSpace(t.length * 3.4 + 3);
        doc.setFont("helvetica", "italic");
        doc.setFontSize(FS.small);
        doc.setTextColor(...SLATE);
        doc.text(t, MARGIN + 1, y);
        y += t.length * 3.4 + 1.5;
        continue;
      }

      const measured = measureWorkRow(line);
      const isLastPriced = isPricedWork(line) && pricedDrawn + 1 === pricedCount;
      const subtotalH = isLastPriced ? 7 : 0;
      const pageBodyH = contentBottom() - MARGIN - HEADER_CONT_H - 8;
      const keepTogether = measured.totalH + subtotalH <= pageBodyH;

      if (keepTogether) {
        ensureSpace(measured.totalH + subtotalH);
      } else {
        ensureSpace(measured.headerH + 4);
      }

      const priceY = y + 3.4;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(FS.micro);
      doc.setTextColor(...MUTED);
      if (line.reference) {
        doc.text(String(line.reference).slice(0, 14), colRef + 1.2, priceY);
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(FS.body);
      doc.setTextColor(...INK);
      doc.text(measured.titleLines, colDesc, priceY, { maxWidth: descW });

      // Chiffres — colonnes distinctes, Total HT mis en avant
      doc.setFont("helvetica", "bold");
      doc.setFontSize(FS.body);
      doc.setTextColor(...INK);
      doc.text(fmtQty(line.quantity), colQty, priceY, { align: "right" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(FS.small);
      doc.setTextColor(...BRAND_BRIGHT);
      doc.text(pdfSafe(line.unit), colUnit, priceY, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(FS.body);
      doc.setTextColor(...INK);
      doc.text(fmtEur(line.unitSellHt), colPu, priceY, { align: "right" });
      doc.setFont("helvetica", "bold");
      doc.setFontSize(FS.body);
      doc.setTextColor(...brand);
      doc.text(fmtEur(line.lineSellHt), colHt, priceY, { align: "right" });
      if (multiVat) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6.3);
        doc.setTextColor(...MUTED);
        doc.text(`TVA ${fmtPct(line.vatRate)} %`, colHt, priceY + 3.2, {
          align: "right",
        });
      }

      y = priceY + measured.titleLines.length * 3.55;

      const drawBlocks = (blocks: DescBlock[]) => {
        for (const b of blocks) {
          if (b.type === "para") {
            const lines = wrapBlockText(b.text, descW);
            for (const ln of lines) {
              ensureSpace(3.3);
              doc.setFont("helvetica", "normal");
              doc.setFontSize(FS.small);
              doc.setTextColor(...SLATE);
              doc.text(ln, colDesc, y);
              y += 3.1;
            }
            y += 0.7;
          } else if (b.type === "list") {
            ensureSpace(3.8);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(FS.micro);
            doc.setTextColor(...brand);
            doc.text(`${b.title} :`, colDesc, y);
            y += 3.2;
            for (const item of b.items) {
              const lines = wrapBlockText(`• ${item}`, descW - 1);
              for (const ln of lines) {
                ensureSpace(3.2);
                doc.setFont("helvetica", "normal");
                doc.setFontSize(FS.small);
                doc.setTextColor(...SLATE);
                doc.text(ln, colDesc, y);
                y += 3.0;
              }
              y += 0.2;
            }
            y += 0.8;
          } else {
            const body = wrapBlockText(b.text, descW - 3.5);
            const boxH = 2.8 + body.length * 2.95 + 1.2;
            ensureSpace(boxH + 0.8);
            const bg = b.variant === "hypo" ? orangeWash : wash;
            const accent = b.variant === "hypo" ? ACCENT_ORANGE : BRAND_BRIGHT;
            doc.setFillColor(...bg);
            doc.roundedRect(colDesc - 0.5, y - 2.0, descW + 1, boxH, 0.5, 0.5, "F");
            doc.setFillColor(...accent);
            doc.rect(colDesc - 0.5, y - 2.0, 0.85, boxH, "F");
            doc.setFont("helvetica", "bold");
            doc.setFontSize(FS.micro);
            doc.setTextColor(...accent);
            doc.text(`${b.title} :`, colDesc + 2, y);
            y += 3.0;
            doc.setFont("helvetica", "italic");
            doc.setFontSize(FS.small);
            doc.setTextColor(...SLATE);
            for (const ln of body) {
              ensureSpace(3.1);
              doc.text(ln, colDesc + 2, y);
              y += 2.95;
            }
            y += 1.4;
          }
        }
      };
      drawBlocks(measured.blocks);
      y += 1.4;

      doc.setDrawColor(...RULE);
      doc.setLineWidth(0.18);
      doc.line(MARGIN, y - 0.6, pageW - MARGIN, y - 0.6);

      if (isPricedWork(line)) {
        sectionHt += line.lineSellHt;
        pricedDrawn += 1;
      }
    }

    if (sectionHt > 0.004) {
      ensureSpace(7);
      doc.setDrawColor(...RULE);
      doc.setLineWidth(0.3);
      doc.line(colPuL, y, pageW - MARGIN, y);
      y += 4;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(FS.small);
      doc.setTextColor(...SLATE);
      doc.text(`Sous-total ${section.title}`, colPu, y, { align: "right" });
      doc.setTextColor(...brand);
      doc.text(fmtEur(sectionHt), colHt, y, { align: "right" });
      y += 5.8;
    }
  }

  inTable = false;

  // ——— Options ———
  if (optionLines.length > 0) {
    const firstOpt = optionLines[0]!;
    const firstTitle = doc.splitTextToSize(
      pdfSafe(firstOpt.designation),
      pageW - MARGIN * 2 - 46,
    );
    ensureSpace(14 + firstTitle.length * 3.4 + 8);
    y += 1.5;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(FS.section);
    doc.setTextColor(...brand);
    doc.text("Options", MARGIN, y);
    y += 4;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(FS.small);
    doc.setTextColor(...SLATE);
    const optNote = doc.splitTextToSize(
      "Non comprises dans le montant du devis sauf acceptation.",
      pageW - MARGIN * 2,
    );
    doc.text(optNote, MARGIN, y);
    y += optNote.length * 3.2 + 3;

    for (const line of optionLines) {
      const main = doc.splitTextToSize(
        pdfSafe(line.designation),
        pageW - MARGIN * 2 - 48,
      );
      ensureSpace(main.length * 3.4 + 9);
      doc.setFillColor(...wash);
      doc.roundedRect(MARGIN, y - 2.2, 14, 4.2, 0.6, 0.6, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6);
      doc.setTextColor(...brand);
      doc.text("Option", MARGIN + 7, y + 0.6, { align: "center" });
      doc.setFont("helvetica", "bold");
      doc.setFontSize(FS.body);
      doc.setTextColor(...INK);
      doc.text(main, MARGIN + 16, y);
      doc.text(`${fmtEur(line.lineSellHt)} HT`, pageW - MARGIN, y, {
        align: "right",
      });
      y += main.length * 3.4 + 0.4;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(FS.small);
      doc.setTextColor(...SLATE);
      doc.text(
        `${fmtQty(line.quantity)} ${pdfSafe(line.unit)} × ${fmtEur(line.unitSellHt)}`,
        MARGIN + 16,
        y,
      );
      y += 5.5;
    }
  }

  // ——— Récapitulatif ———
  type RecapSlice = { rate: number | null; baseHt: number; vat: number };
  const vatSlices: RecapSlice[] =
    input.vatBreakdown && input.vatBreakdown.length > 0
      ? input.vatBreakdown
      : vatRates.size > 0
        ? [
            {
              rate: [...vatRates][0] ?? null,
              baseHt: input.totals.totalSellHt,
              vat: input.totals.totalVat,
            },
          ]
        : [
            {
              rate: null,
              baseHt: input.totals.totalSellHt,
              vat: input.totals.totalVat,
            },
          ];

  const recapRows = 2 + (vatSlices.length > 1 ? vatSlices.length * 2 : 1);
  const recapH = 8 + recapRows * 5.2 + 12;
  ensureSpace(recapH);
  y += 2;
  const boxW = 76;
  const boxX = pageW - MARGIN - boxW;

  doc.setFillColor(...washSoft);
  doc.roundedRect(boxX - 3.5, y - 2.5, boxW + 7, recapH - 2, 1, 1, "F");
  doc.setDrawColor(...RULE);
  doc.setLineWidth(0.25);
  doc.roundedRect(boxX - 3.5, y - 2.5, boxW + 7, recapH - 2, 1, 1, "S");

  let ty = y + 1.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(FS.body);
  doc.setTextColor(...SLATE);
  doc.text("Sous-total HT", boxX, ty);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...INK);
  doc.text(fmtEur(input.totals.totalSellHt), boxX + boxW, ty, { align: "right" });
  ty += 5.2;

  if (vatSlices.length > 1) {
    for (const slice of vatSlices) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(FS.small);
      doc.setTextColor(...SLATE);
      const rateBit = slice.rate != null ? ` ${fmtPct(slice.rate)} %` : "";
      doc.text(`Base HT${rateBit}`, boxX, ty);
      doc.text(fmtEur(slice.baseHt), boxX + boxW, ty, { align: "right" });
      ty += 3.8;
      doc.text(`TVA${rateBit}`, boxX, ty);
      doc.text(fmtEur(slice.vat), boxX + boxW, ty, { align: "right" });
      ty += 4.2;
    }
  } else {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(FS.body);
    doc.setTextColor(...SLATE);
    const rateLabel =
      vatSlices[0]?.rate != null ? `TVA ${fmtPct(vatSlices[0].rate)} %` : "TVA";
    doc.text(rateLabel, boxX, ty);
    doc.text(fmtEur(input.totals.totalVat), boxX + boxW, ty, { align: "right" });
    ty += 5.5;
  }

  doc.setFillColor(...brand);
  doc.roundedRect(boxX - 3.5, ty - 1.5, boxW + 7, 10, 0.9, 0.9, "F");
  doc.setFillColor(...ACCENT_ORANGE);
  doc.rect(boxX - 3.5, ty - 1.5, 2, 10, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(FS.title);
  doc.setTextColor(...WHITE);
  doc.text("TOTAL TTC", boxX, ty + 4.6);
  doc.setFontSize(11.5);
  doc.text(fmtEur(input.totals.totalTtc), boxX + boxW, ty + 4.6, {
    align: "right",
  });
  y = ty + 12;

  // ——— Paiement ———
  const schedule = input.paymentSchedule ?? parsePaymentSchedule(null);
  const scheduleLines = computePaymentScheduleAmounts(
    schedule && schedule.lines.length ? schedule : null,
    input.totals.totalTtc,
  );
  const paymentMode = docSettings.paymentModeLabel?.trim() || "";
  const paymentTerms = input.paymentTerms?.trim() || "";
  const showPaymentMode =
    Boolean(paymentMode) &&
    !paymentTerms.toLowerCase().includes(paymentMode.toLowerCase());

  if (scheduleLines.length > 0 || paymentTerms || showPaymentMode) {
    const payH =
      8 +
      scheduleLines.length * 5 +
      (paymentTerms ? 8 : 0) +
      (showPaymentMode ? 5 : 0);
    ensureSpace(Math.min(payH, 36));
    doc.setFont("helvetica", "bold");
    doc.setFontSize(FS.section);
    doc.setTextColor(...brand);
    doc.text("Conditions de paiement", MARGIN, y);
    y += 5.2;

    const pctX = pageW - MARGIN - 48;
    for (const row of scheduleLines) {
      ensureSpace(6);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(FS.body);
      doc.setTextColor(...INK);
      doc.text(pdfSafe(row.label), MARGIN, y);
      doc.setTextColor(...SLATE);
      doc.text(`${fmtPct(row.percent)} %`, pctX, y, { align: "right" });
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...INK);
      doc.text(fmtEur(row.amountTtc), pageW - MARGIN, y, { align: "right" });
      y += 4.8;
    }

    if (showPaymentMode) {
      ensureSpace(5);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(FS.small);
      doc.setTextColor(...SLATE);
      doc.text(`Règlement par ${paymentMode.toLowerCase()}.`, MARGIN, y);
      y += 4.2;
    }
    if (paymentTerms) {
      ensureSpace(10);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(FS.small);
      doc.setTextColor(...SLATE);
      const pt = doc.splitTextToSize(pdfSafe(paymentTerms), pageW - MARGIN * 2);
      doc.text(pt, MARGIN, y);
      y += pt.length * 3.3 + 2;
    }
    y += 1.5;
  }

  if (docSettings.showBankOnQuote && (input.bank?.iban || input.bank?.bic)) {
    ensureSpace(10);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(FS.small);
    doc.setTextColor(...SLATE);
    if (input.bank?.name) {
      doc.text(pdfSafe(input.bank.name), MARGIN, y);
      y += 3.4;
    }
    if (input.bank?.iban) doc.text(`IBAN ${pdfSafe(input.bank.iban)}`, MARGIN, y);
    y += 3.4;
    if (input.bank?.bic) doc.text(`BIC ${pdfSafe(input.bank.bic)}`, MARGIN, y);
    y += 5;
  }

  const drawTextSection = (title: string, body: string) => {
    const lines = doc.splitTextToSize(pdfSafe(body), pageW - MARGIN * 2);
    ensureSpace(10 + Math.min(lines.length, 3) * 3.3);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(FS.section);
    doc.setTextColor(...brand);
    doc.text(title, MARGIN, y);
    y += 4.5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(FS.small);
    doc.setTextColor(...SLATE);
    for (const line of lines) {
      ensureSpace(4);
      doc.text(line, MARGIN, y);
      y += 3.3;
    }
    y += 2.5;
  };

  if (input.executionStartNote || input.executionDurationNote) {
    const bits = compactLines([
      input.executionStartNote
        ? `Début prévu : ${input.executionStartNote}`
        : null,
      input.executionDurationNote
        ? `Durée estimée : ${input.executionDurationNote}`
        : null,
    ]);
    drawTextSection("Exécution des travaux", bits.join("\n"));
  }

  if (docSettings.wasteManagementText?.trim()) {
    const waste = compactLines([
      docSettings.wasteManagementText,
      docSettings.wasteCostLabel?.trim()
        ? `Coût : ${docSettings.wasteCostLabel.trim()}`
        : null,
    ]).join("\n");
    drawTextSection("Gestion des déchets", waste);
  }

  if (input.insuranceMentions?.trim() || docSettings.decennaleInsurer) {
    const insParts = compactLines([
      docSettings.decennaleInsurer
        ? `Assureur : ${docSettings.decennaleInsurer}`
        : null,
      docSettings.decennalePolicyNumber
        ? `Police : ${docSettings.decennalePolicyNumber}`
        : null,
      docSettings.decennaleCoverage
        ? `Couverture : ${docSettings.decennaleCoverage}`
        : null,
      docSettings.decennaleValidFrom || docSettings.decennaleValidTo
        ? `Validité : ${[docSettings.decennaleValidFrom, docSettings.decennaleValidTo].filter(Boolean).join(" → ")}`
        : null,
      input.insuranceMentions,
      docSettings.decennaleDocumentPath
        ? "Attestation décennale : document annexé séparément selon paramétrage (fusion PDF non automatique)."
        : null,
    ]);
    drawTextSection("Assurance professionnelle", insParts.join("\n"));
  }

  const particular =
    input.particularConditions?.trim() ||
    docSettings.defaultParticularConditions?.trim();
  if (particular) {
    drawTextSection("Conditions particulières", particular);
  }

  // ——— Présentation du projet (structurée, sans ===) ———
  const presentation = input.projectPresentation;
  const drawKeepTitleBody = (title: string, bodyLines: string[]) => {
    if (!bodyLines.length) return;
    const firstChunk = Math.min(bodyLines.length, 4);
    ensureSpace(10 + firstChunk * 3.3);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(FS.section);
    doc.setTextColor(...brand);
    doc.text(title, MARGIN, y);
    y += 4.5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(FS.small);
    doc.setTextColor(...SLATE);
    for (const line of bodyLines) {
      ensureSpace(4);
      doc.text(line, MARGIN, y);
      y += 3.3;
    }
    y += 2.5;
  };

  if (presentation) {
    const hasVisualStages = presentation.stages.some((s) => s.imageDataUrl);
    const remaining = contentBottom() - y;
    // Visuels : démarrer la présentation sur une page dédiée si l’espace restant est trop juste
    // (évite page 3 quasi vide + titre orphelin).
    if (
      presentation.stages.length >= 2 &&
      (hasVisualStages || remaining < 95) &&
      y > MARGIN + HEADER_CONT_H + 20
    ) {
      startNewPage();
    }

    ensureSpace(12);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(FS.title);
    doc.setTextColor(...brand);
    doc.text("Présentation du projet", MARGIN, y);
    y += 6;

    if (presentation.intro?.trim()) {
      const introLines = doc.splitTextToSize(
        pdfSafe(presentation.intro.trim()),
        pageW - MARGIN * 2,
      ) as string[];
      drawKeepTitleBody("Objet des travaux", introLines);
    }

    if (presentation.adviceParagraphs.length) {
      const body = presentation.adviceParagraphs.join("\n\n");
      const lines = doc.splitTextToSize(
        pdfSafe(body),
        pageW - MARGIN * 2,
      ) as string[];
      drawKeepTitleBody("Notre préconisation", lines);
    }

    if (presentation.stages.length) {
      const colGap = 4;
      const colW = (pageW - MARGIN * 2 - colGap) / 2;
      const imgH = 38;
      const cardBase = 8 + imgH + 3 + 4 + 8;

      // Mesure 1re rangée pour garder titre + cartes ensemble (pas de titre orphelin).
      const firstLeft = presentation.stages[0]!;
      const firstRight = presentation.stages[1];
      const measureDesc = (s: typeof firstLeft | undefined) =>
        s?.description
          ? (doc.splitTextToSize(pdfSafe(s.description), colW) as string[]).length
          : 0;
      const measureDisc = (s: typeof firstLeft | undefined) =>
        s && (s.mediaType === "ai_preview" || s.disclaimer)
          ? (doc.splitTextToSize(
              pdfSafe(
                s.disclaimer ||
                  "Illustration non contractuelle — aperçu indicatif du principe d'intervention.",
              ),
              colW,
            ) as string[]).length
          : 0;
      const firstRowH = Math.max(
        cardBase + measureDesc(firstLeft) * 2.8 + measureDisc(firstLeft) * 2.6,
        firstRight
          ? cardBase + measureDesc(firstRight) * 2.8 + measureDisc(firstRight) * 2.6
          : 0,
      );
      ensureSpace(10 + firstRowH);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(FS.section);
      doc.setTextColor(...brand);
      doc.text("Déroulement prévisionnel des travaux", MARGIN, y);
      y += 5;

      for (let i = 0; i < presentation.stages.length; i += 2) {
        const left = presentation.stages[i];
        const right = presentation.stages[i + 1];
        const descLeft = left.description
          ? (doc.splitTextToSize(pdfSafe(left.description), colW) as string[])
          : [];
        const descRight = right?.description
          ? (doc.splitTextToSize(pdfSafe(right.description), colW) as string[])
          : [];
        const discLeft =
          left.mediaType === "ai_preview" || left.disclaimer
            ? (doc.splitTextToSize(
                pdfSafe(
                  left.disclaimer ||
                    "Illustration non contractuelle — aperçu indicatif du principe d'intervention.",
                ),
                colW,
              ) as string[])
            : [];
        const discRight =
          right && (right.mediaType === "ai_preview" || right.disclaimer)
            ? (doc.splitTextToSize(
                pdfSafe(
                  right.disclaimer ||
                    "Illustration non contractuelle — aperçu indicatif du principe d'intervention.",
                ),
                colW,
              ) as string[])
            : [];
        const cardH = Math.max(
          cardBase + descLeft.length * 2.8 + discLeft.length * 2.6,
          right
            ? cardBase + descRight.length * 2.8 + discRight.length * 2.6
            : 0,
        );
        if (i > 0) ensureSpace(cardH + 2);

        const drawStageCard = (
          stage: typeof left,
          x: number,
          descs: string[],
          discs: string[],
        ) => {
          let cy = y;
          if (stage.imageDataUrl && stage.imageFormat) {
            try {
              doc.addImage(
                stage.imageDataUrl,
                stage.imageFormat,
                x,
                cy,
                colW,
                imgH,
              );
            } catch {
              doc.setFillColor(...tint(brand, 0.92));
              doc.rect(x, cy, colW, imgH, "F");
            }
          } else {
            doc.setFillColor(...tint(brand, 0.94));
            doc.setDrawColor(...RULE);
            doc.setLineWidth(0.2);
            doc.rect(x, cy, colW, imgH, "FD");
            doc.setFont("helvetica", "normal");
            doc.setFontSize(FS.small);
            doc.setTextColor(...MUTED);
            doc.text("Visuel à joindre", x + colW / 2, cy + imgH / 2, {
              align: "center",
            });
          }
          cy += imgH + 3;
          doc.setFont("helvetica", "bold");
          doc.setFontSize(FS.body);
          doc.setTextColor(...brand);
          doc.text(`${stage.order}`, x, cy);
          cy += 3.5;
          doc.setTextColor(...INK);
          const titleLines = doc.splitTextToSize(pdfSafe(stage.title), colW) as string[];
          doc.text(titleLines, x, cy);
          cy += titleLines.length * 3.5;
          doc.setFont("helvetica", "normal");
          doc.setFontSize(FS.small);
          doc.setTextColor(...SLATE);
          for (const line of descs) {
            doc.text(line, x, cy);
            cy += 2.8;
          }
          if (discs.length) {
            cy += 0.8;
            doc.setTextColor(...MUTED);
            doc.setFontSize(6.2);
            for (const line of discs) {
              doc.text(line, x, cy);
              cy += 2.6;
            }
          }
        };

        drawStageCard(left, MARGIN, descLeft, discLeft);
        if (right) {
          drawStageCard(right, MARGIN + colW + colGap, descRight, discRight);
        }
        y += cardH + 3;
      }
      y += 1;
    }

    if (presentation.reserves.length) {
      const body = presentation.reserves.join("\n\n");
      const lines = doc.splitTextToSize(
        pdfSafe(body),
        pageW - MARGIN * 2,
      ) as string[];
      // Garder réserves + début Bon pour accord ensemble si possible
      const signaturePreviewH = 42;
      ensureSpace(10 + Math.min(lines.length, 3) * 3.3 + Math.min(signaturePreviewH, 20));
      drawKeepTitleBody("Réserves techniques", lines);
    }
  } else if (input.clientNotes?.trim()) {
    // Fallback : notes libres sans sections — strip === visibles
    const cleaned = input.clientNotes
      .replace(/={2,}[^=\n]*={2,}/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    if (cleaned) {
      drawTextSection("Observations", cleaned);
    }
  }

  const mentions = [input.quoteMentions, input.legalMentions]
    .map((m) => m?.trim())
    .filter(Boolean) as string[];
  if (mentions.length) {
    drawTextSection("Mentions", mentions.join("\n\n"));
  }

  const ctx =
    input.consumerContractContext ||
    docSettings.consumerContractContextDefault ||
    null;
  if (
    docSettings.showRetractionAnnex &&
    docSettings.retractionAnnexText?.trim() &&
    (ctx === "A_DISTANCE" || ctx === "HORS_ETABLISSEMENT")
  ) {
    drawTextSection(
      "Informations relatives au droit de rétractation",
      docSettings.retractionAnnexText,
    );
  }

  // ——— Bon pour accord (compact ; dernière page seulement si la place manque) ———
  const accText = pdfSafe(
    docSettings.acceptanceText?.trim() || DEFAULT_ACCEPTANCE_TEXT,
  );
  const accLines = doc.splitTextToSize(accText, pageW - MARGIN * 2);
  const signatureH =
    5 + 4.5 + accLines.length * 3.2 + 4 + 5.5 + 5.5 + 13;
  ensureSpace(signatureH);

  doc.setDrawColor(...RULE);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y, pageW - MARGIN, y);
  y += 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(FS.section);
  doc.setTextColor(...brand);
  doc.text("Bon pour accord", MARGIN, y);
  y += 4.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(FS.small);
  doc.setTextColor(...SLATE);
  doc.text(accLines, MARGIN, y);
  y += accLines.length * 3.2 + 4;
  doc.setFontSize(FS.body);
  doc.setTextColor(...INK);
  doc.text("Date : ______________________", MARGIN, y);
  y += 5.5;
  doc.text("Nom / qualité : _________________________________", MARGIN, y);
  y += 5.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(FS.small);
  doc.setTextColor(...SLATE);
  doc.text(
    "Signature précédée de la mention « Bon pour accord » :",
    MARGIN,
    y,
  );
  y += 13;

  // ——— CGV annex ———
  if (docSettings.cgvText?.trim()) {
    doc.addPage();
    paintDraftIfNeeded();
    y = MARGIN;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(FS.title);
    doc.setTextColor(...brand);
    doc.text("Conditions générales", MARGIN, y);
    y += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(FS.small);
    doc.setTextColor(...SLATE);
    const cgv = doc.splitTextToSize(
      pdfSafe(docSettings.cgvText),
      pageW - MARGIN * 2,
    );
    for (const line of cgv) {
      if (y > contentBottom()) {
        doc.addPage();
        paintDraftIfNeeded();
        y = MARGIN;
      }
      doc.text(line, MARGIN, y);
      y += 3.3;
    }
  }

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setDrawColor(...RULE);
    doc.setLineWidth(0.25);
    doc.line(MARGIN, pageH - FOOTER_H, pageW - MARGIN, pageH - FOOTER_H);
    doc.setDrawColor(...ACCENT_ORANGE);
    doc.setLineWidth(0.55);
    doc.line(MARGIN, pageH - FOOTER_H, MARGIN + 14, pageH - FOOTER_H);
    const footer = footerLegalLine(input.issuer, docSettings.footerText);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.2);
    doc.setTextColor(...MUTED);
    if (footer) {
      const fl = doc.splitTextToSize(footer, contentW - 52);
      doc.text(fl.slice(0, 1), MARGIN, pageH - 8.5);
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(FS.small);
    doc.setTextColor(...SLATE);
    doc.text(`${displayNumber}  ·  Page ${i} / ${pages}`, pageW - MARGIN, pageH - 8.5, {
      align: "right",
    });
  }

  const ab = doc.output("arraybuffer");
  return stabilizePdfDocumentIds(Buffer.from(ab));
}

export function generateCommercialQuotePdf(input: QuotePdfInput): Buffer {
  return generateQuotePdfBuffer(input);
}

/** Re-export types utiles facture future */
export type { Rgb };
