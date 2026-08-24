/**
 * Extraction lignes commerciales depuis texte devis (PDF tabulaire multipage).
 */
import { randomBytes } from "crypto";
import { moneyClose, parseFrenchNumber } from "@/lib/commercial/import/french-number";
import type { ImportedLine, ImportedSection } from "@/lib/commercial/import/types";
import {
  isLegalOrFooterLine,
  isTableHeaderLine,
  MONEY_ROW_RE,
  MONEY_ROW_SPACES_RE,
  normalizeImportLine,
  PAGE_BREAK_RE,
} from "@/lib/commercial/import/parse-zones";

function uid(): string {
  return randomBytes(6).toString("hex");
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
  if (x === "t" || x === "tonne" || x === "tonnes") return "T";
  if (x === "ens" || x === "ensemble") return "Ens";
  return u.toUpperCase();
}

function detectUnitFromText(text: string): string | null {
  if (/\bML\b/.test(text)) return "ML";
  if (/\bForfait\b/i.test(text)) return "Forfait";
  if (/\bTonnes?\b/i.test(text)) return "T";
  const m = text.match(/\b(forfait|ml|m²|m2|m³|m3|tonnes?|u|unité|ens(?:emble)?)\b/i);
  return m?.[1] ? normalizeUnit(m[1]) : null;
}

function shortenDesignation(full: string): { designation: string; description: string | null } {
  const cleaned = full.replace(/\s+/g, " ").trim();
  if (cleaned.length <= 160) {
    return { designation: cleaned, description: null };
  }
  const cut = cleaned.slice(0, 160);
  const at = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf(", "), cut.lastIndexOf(" "));
  const designation = (at > 50 ? cut.slice(0, at) : cut).trim();
  return { designation, description: cleaned };
}

function matchMoneyRow(
  line: string,
): { qty: number; pu: number; mid: number | null; ht: number } | null {
  const t = line.trim();
  const m = t.match(MONEY_ROW_RE) ?? t.match(MONEY_ROW_SPACES_RE);
  if (!m) return null;
  const qty = parseFrenchNumber(m[1]);
  const pu = parseFrenchNumber(m[2]);
  const mid = parseFrenchNumber(m[3]);
  const ht = parseFrenchNumber(m[4]);
  if (qty == null || pu == null || ht == null) return null;
  if (qty <= 0 || pu <= 0 || ht < 0) return null;
  return { qty, pu, mid, ht };
}

function isDetailLine(line: string): boolean {
  return /Minipelle|dimension|g[eé]otextile|implantation|compactage|tuyau|agr[eé]gat|coffrage|chargement|d[eé]charges|Mise en oeuvre|joints?\s+CR|sablon|armature|pente\s+[àa]|Fourniture|raccords|enrobage|terrassier/i.test(
    line,
  );
}

/** Titres de section stricts — évite de couper une désignation en plein milieu. */
function isLikelySectionTitle(line: string): boolean {
  const t = line.replace(/\s+/g, " ").trim();
  if (!t || t.length < 3 || t.length > 90) return false;
  if (/€|\d+[.,]\d{2}|@|\+33/.test(t)) return false;
  if (isDetailLine(t)) return false;
  if (isLegalOrFooterLine(t) || isTableHeaderLine(t)) return false;
  if (/^(DEVIS|Total|TVA|Conditions|Monsieur|Madame|Email|Port\.|ALIA|R[eé]f[eé]rence)/i.test(t)) {
    return false;
  }
  if (/^(Excavation|Evacuation|[EÉ]vacuation)$/i.test(t)) return true;
  if (/^Mise en place des cuves/i.test(t)) return true;
  // Titre court 1–3 mots, pas une phrase tronquée
  const words = t.split(/\s+/);
  if (words.length <= 3 && /^[A-ZÀ-Ÿ]/.test(t) && !/,/.test(t)) {
    if (/(?:de la|des|du|le|la|les|et|pour|de|aux?)$/i.test(t)) return false;
    return true;
  }
  return false;
}

function isNoiseMetaLine(line: string): boolean {
  const t = line.trim();
  if (!t) return true;
  if (PAGE_BREAK_RE.test(t)) return true;
  if (isTableHeaderLine(t)) return true;
  if (isLegalOrFooterLine(t)) return true;
  if (/^Page\s+\d+\s*\/\s*\d+/i.test(t)) return true;
  if (/^DEVIS\s+N/i.test(t)) return true;
  if (/^Le\s+(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\b/i.test(t)) return true;
  if (/^(Monsieur|Madame|M\.|Mme)\b/i.test(t)) return true;
  if (/^(Port\.?|T[ée]l(?:[eé]phone)?|portable|Email|E-mail)\b/i.test(t)) return true;
  if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(t)) return true;
  if (/^\d{1,4}\s+(?:avenue|av\.|rue|boulevard|bd\.|chemin|impasse|place|all[eé]e|route)\b/i.test(t)) {
    return true;
  }
  if (/^\d{5}\s+[A-ZÀ-Ÿ]/i.test(t)) return true;
  if (/^(Total\s+HT|Total\s+TTC|TVA\s*\(|Conditions\s+de\s+paiement)/i.test(t)) return true;
  if (/^•?\s*\d+[.,]\d+\s*%\s+soit/i.test(t)) return true;
  if (/^\d[\d\s\u00a0.,]+\s*€\s*$/.test(t) && !t.includes("\t")) return true;
  if (/^[A-ZÀ-Ÿ0-9 &'\-]{2,40}$/.test(t) && /BTP|SARL|SAS|\bSA\b/.test(t)) return true;
  if (/^N[°º]\s*(TVA|SIRET)/i.test(t)) return true;
  if (/^Code\s+NAF/i.test(t)) return true;
  return false;
}

function isSubjectBuffer(buffer: string[]): boolean {
  const joined = buffer.join(" ").replace(/\s+/g, " ").trim();
  return (
    buffer.length > 0 &&
    /r[eé]alisation|travaux de|installation de cuves|eaux\s+pluviales/i.test(joined) &&
    !isDetailLine(joined)
  );
}

function continueSectionTitle(line: string): boolean {
  const t = line.replace(/\s+/g, " ").trim();
  if (!t || isDetailLine(t) || isNoiseMetaLine(t)) return false;
  if (/^(Excavation pour|Evacuation des|Mise en place de la|Mise en oeuvre des|Apport d|Dalle de)/i.test(t)) {
    return false;
  }
  return t.length < 55 && !/€/.test(t);
}

/**
 * Reconstitue les lignes d’ouvrage sur plusieurs pages.
 */
export function extractWorkSectionsFromQuoteText(
  text: string,
  defaultVat: number | null,
): { sections: ImportedSection[]; subjectHint: string | null } {
  const raw = text.split(/\n/).map(normalizeImportLine);
  const sections: ImportedSection[] = [];
  let currentTitle = "Ouvrages";
  let currentLines: ImportedLine[] = [];
  let buffer: string[] = [];
  let subjectHint: string | null = null;
  /** Accumulation d’un titre de section multiligne (ex. Mise en place des cuves…). */
  let sectionAcc: string[] | null = null;

  const flushSection = () => {
    if (currentLines.length === 0) return;
    sections.push({ id: uid(), title: currentTitle, lines: currentLines });
    currentLines = [];
  };

  const startSection = (title: string) => {
    const t = title.replace(/\s+/g, " ").trim();
    if (!t) return;
    flushSection();
    currentTitle = t;
  };

  const finalizeSectionAcc = () => {
    if (!sectionAcc || sectionAcc.length === 0) return;
    startSection(sectionAcc.join(" "));
    sectionAcc = null;
  };

  for (const line of raw) {
    if (isNoiseMetaLine(line)) continue;

    const money = matchMoneyRow(line);
    if (money) {
      finalizeSectionAcc();

      // Si le buffer contient encore un objet, le sortir
      if (isSubjectBuffer(buffer) && !subjectHint) {
        subjectHint = buffer.join(" ").replace(/\s+/g, " ").replace(/\.\s*$/, "").trim();
        buffer = [];
      }

      const full = buffer.join(" ").replace(/\s+/g, " ").trim();
      buffer = [];
      if (!full || full.length < 4) continue;

      const unit = detectUnitFromText(full) ?? "U";
      const { designation, description } = shortenDesignation(full);
      const warnings: string[] = [];
      let confidence: ImportedLine["confidence"] = "ok";
      let discountPercent: number | null = null;

      const gross = money.qty * money.pu;
      if (!moneyClose(gross, money.ht, 0.05)) {
        if (money.mid != null && money.mid > 0 && money.mid < 100) {
          const withDisc = gross * (1 - money.mid / 100);
          if (moneyClose(withDisc, money.ht, 0.05)) {
            discountPercent = money.mid;
            warnings.push(
              "⚠ taux / remise ligne à confirmer (colonne « TVA » du document ≠ TVA document)",
            );
            confidence = "warn";
          } else {
            const inferred = Math.round((1 - money.ht / gross) * 10000) / 100;
            if (
              inferred > 0 &&
              inferred < 100 &&
              moneyClose(gross * (1 - inferred / 100), money.ht, 0.05)
            ) {
              discountPercent = inferred;
              warnings.push("⚠ taux / remise ligne à confirmer");
              confidence = "warn";
            } else {
              warnings.push("Montant HT incohérent avec quantité × PU — à vérifier");
              confidence = "warn";
            }
          }
        } else {
          warnings.push("Montant HT ≠ quantité × PU — à vérifier");
          confidence = "warn";
        }
      }

      currentLines.push({
        id: uid(),
        kind: "WORK",
        designation,
        description,
        quantity: money.qty,
        unit,
        unitSellHt: money.pu,
        discountPercent,
        vatRate: defaultVat,
        lineSellHt: money.ht,
        confidence,
        warnings,
      });
      continue;
    }

    const t = line.replace(/\s+/g, " ").trim();
    if (!t) continue;

    // Suite d’un titre multiligne en cours
    if (sectionAcc) {
      if (continueSectionTitle(t)) {
        sectionAcc.push(t);
        continue;
      }
      finalizeSectionAcc();
      // retomber sur le traitement normal de t
    }

    if (isLikelySectionTitle(t)) {
      if (isSubjectBuffer(buffer) && !subjectHint) {
        subjectHint = buffer.join(" ").replace(/\s+/g, " ").replace(/\.\s*$/, "").trim();
        buffer = [];
      } else if (buffer.length > 0) {
        // Texte résiduel non classé : rattacher à la désignation suivante
      }

      if (/^Mise en place des cuves/i.test(t)) {
        sectionAcc = [t];
        continue;
      }
      startSection(t);
      continue;
    }

    buffer.push(t);
  }

  finalizeSectionAcc();
  flushSection();
  if (sections.length === 0) {
    sections.push({ id: uid(), title: "Ouvrages", lines: [] });
  }
  return { sections, subjectHint };
}

export { normalizeUnit, matchMoneyRow };
