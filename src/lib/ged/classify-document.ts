/**
 * Classification documentaire déterministe — pas d’IA, pas d’OCR.
 * Source connue → type connu. Sinon nom seulement si le signal est certain.
 */

import {
  canOpenGedFileUrl,
  isDemoPlaceholderFileUrl,
} from "@/lib/ged/file-openability";

export const GED_TYPE_LABELS: Record<string, string> = {
  DEVIS: "Devis",
  DEVIS_FOURNISSEUR: "Devis fournisseur",
  FACTURE: "Facture",
  SITUATION: "Situation",
  AVOIR: "Avoir",
  BON_COMMANDE: "Bon de commande",
  BON_LIVRAISON: "Bon de livraison",
  BC: "Bon de commande",
  BL: "Bon de livraison",
  PLAN: "Plan",
  FICHE_TECHNIQUE: "Fiche technique",
  DOE: "DOE",
  COMPTE_RENDU: "Compte rendu",
  ATTESTATION: "Attestation",
  CONTRAT: "Contrat",
  PHOTO: "Photo",
  DOCUMENT: "Document",
  AUTRE: "À classer",
  CONFIRMATION: "Confirmation",
  MARCHE: "Marché",
  "MARCHÉ": "Marché",
};

export function displayGedTypeLabel(code?: string | null): string {
  const k = (code ?? "").trim();
  if (!k) return "Document";
  return GED_TYPE_LABELS[k] ?? GED_TYPE_LABELS[k.toUpperCase()] ?? k;
}

export function classifyDocumentType(opts: {
  sourceEntityType?: string | null;
  poKind?: string | null;
  filename?: string | null;
  category?: string | null;
  currentType?: string | null;
}): { documentType: string; certain: boolean } {
  const src = (opts.sourceEntityType ?? "").toLowerCase();
  if (src === "commercial_quote" || src === "commercial_quote_snapshot") {
    return { documentType: "DEVIS", certain: true };
  }
  if (src === "commercial_invoice") {
    const blob = `${opts.filename ?? ""} ${opts.currentType ?? ""}`.toLowerCase();
    if (blob.includes("avoir") || opts.currentType === "AVOIR") {
      return { documentType: "AVOIR", certain: true };
    }
    return { documentType: "FACTURE", certain: true };
  }
  if (src === "commercial_progress") {
    return { documentType: "SITUATION", certain: true };
  }
  if (src === "doe_item") return { documentType: "DOE", certain: true };
  if (src === "pilotage_photo") return { documentType: "PHOTO", certain: true };

  const po = (opts.poKind ?? "").toUpperCase();
  if (po === "BL") return { documentType: "BON_LIVRAISON", certain: true };
  if (po === "BC") return { documentType: "BON_COMMANDE", certain: true };
  if (po === "FACTURE") return { documentType: "FACTURE", certain: true };
  if (po === "FICHE_TECHNIQUE") return { documentType: "FICHE_TECHNIQUE", certain: true };
  if (po === "DEVIS") return { documentType: "DEVIS_FOURNISSEUR", certain: true };
  if (po === "CONFIRMATION") return { documentType: "CONFIRMATION", certain: true };

  const fromName = classifyFromFilename(opts.filename ?? "");
  if (fromName) return { documentType: fromName, certain: true };

  const cat = (opts.category ?? "").toUpperCase();
  if (cat === "FACTURE") return { documentType: "FACTURE", certain: true };
  if (cat === "CONTRAT") return { documentType: "CONTRAT", certain: false };
  if (cat === "DOE") return { documentType: "DOE", certain: true };
  if (cat === "PHOTOS") return { documentType: "PHOTO", certain: true };
  if (cat === "PLANS") return { documentType: "PLAN", certain: true };

  const current = (opts.currentType ?? "").toUpperCase();
  if (current === "BL") return { documentType: "BON_LIVRAISON", certain: true };
  if (current === "BC") return { documentType: "BON_COMMANDE", certain: true };
  if (current && current !== "AUTRE" && current !== "DOCUMENT" && current !== "CONTRAT") {
    return { documentType: current, certain: false };
  }

  return { documentType: "AUTRE", certain: false };
}

function classifyFromFilename(filename: string): string | null {
  const n = filename
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (!n.trim()) return null;
  if (/\bavoir\b/.test(n)) return "AVOIR";
  if (/\bsituation\b/.test(n)) return "SITUATION";
  if (/\bdevis\b|\bdev-\d/.test(n)) return "DEVIS";
  if (/\bfacture\b|\bfac-\d|\bfact-\d/.test(n)) return "FACTURE";
  if (/\bbon de livraison\b|\bbl[-_ ]?\d|\bbl-\d/.test(n)) return "BON_LIVRAISON";
  if (/\bbon de commande\b|\bbc[-_ ]?\d|\bbc-\d/.test(n)) return "BON_COMMANDE";
  if (/fiche.?technique/.test(n)) return "FICHE_TECHNIQUE";
  if (/\bdoe\b/.test(n)) return "DOE";
  if (/compte.?rendu|\bcr[-_ ]?\d/.test(n)) return "COMPTE_RENDU";
  if (/attestation|decennale|rc pro/.test(n)) return "ATTESTATION";
  if (/\.dwg\b|\.dxf\b|\.ifc\b|\bplan\b/.test(n)) return "PLAN";
  if (/\.(jpe?g|png|webp|heic|gif)\b/.test(n)) return "PHOTO";
  if (/\bcontrat\b/.test(n) && !/\bdevis\b/.test(n)) return "CONTRAT";
  return null;
}

export function isExpectedMissingDocument(opts: {
  status?: string | null;
  name?: string | null;
  fileUrl?: string | null;
}): boolean {
  const st = (opts.status ?? "").toUpperCase();
  if (st === "MANQUANT" || st === "A_RELANCER") return true;
  if (/\(\s*manquante\s*\)/i.test(opts.name ?? "")) return true;
  if (!(opts.fileUrl ?? "").trim()) return true;
  // GED-FIX-1 — placeholder démo / URL non ouvrable ≠ fichier réel
  if (isDemoPlaceholderFileUrl(opts.fileUrl)) return true;
  if (!canOpenGedFileUrl(opts.fileUrl)) return true;
  return false;
}

export function stripMissingTitleSuffix(name: string): string {
  return name.replace(/\s*\(manquante\)\s*/gi, "").trim() || name;
}
