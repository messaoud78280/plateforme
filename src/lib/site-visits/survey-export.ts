/**
 * Export visite → bework_site_survey_v1 + prompt ChatGPT → bework_prep_bundle_v1 (métré).
 * Le devis (bework_quote_bundle_v1) vient APRÈS le métré, pas depuis la visite.
 */
import { jsPDF } from "jspdf";
import { DEFAULT_BRAND, INK, MUTED, RULE, SLATE, tint } from "@/lib/commercial/pdf/colors";
import { fmtDate, pdfSafe } from "@/lib/commercial/pdf/format";
import { PREP_BUNDLE_FORMAT } from "@/lib/preparation/types";
import {
  BEWORK_SITE_SURVEY_FORMAT,
  photoCategoryLabel,
  type SiteVisitCommercialInfo,
  type SiteVisitFinding,
  type SiteVisitProposedWork,
} from "@/lib/site-visits/survey-types";
import type { SiteVisitConstraints } from "@/lib/site-visits/types";

export type SurveyVisitInput = {
  id: string;
  clientName: string;
  siteName: string | null;
  siteAddress: string;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail?: string | null;
  responsibleName?: string | null;
  companyName?: string | null;
  zipCode?: string | null;
  city?: string | null;
  /** Coordonnées client enrichies (prep + fiche ExternalOrganization). */
  clientCivility?: string | null;
  clientFirstName?: string | null;
  clientLastName?: string | null;
  clientCompany?: string | null;
  clientPhone?: string | null;
  clientEmail?: string | null;
  clientAddress?: string | null;
  clientZipCode?: string | null;
  clientCity?: string | null;
  clientCountry?: string | null;
  billingSameAsSite?: boolean;
  siteCountry?: string | null;
  siteContactEmail?: string | null;
  siteContactPhone?: string | null;
  subject: string;
  clientNeed: string | null;
  scheduledAt: string | null;
  status: string;
  lots: string[];
  zones: string[];
  constraints: SiteVisitConstraints;
  findings: SiteVisitFinding[];
  proposedWorks: SiteVisitProposedWork[];
  commercial: SiteVisitCommercialInfo;
  /** Fiches techniques lot (réponses terrain). */
  lotSheets?: Record<string, Record<string, string>>;
  comments?: string | null;
  /** Relevés libres (carnet / dictée) — texte intégral. */
  fieldNotes?: string | null;
  measurements: Array<{
    id: string;
    zone: string | null;
    label: string;
    measureType: string;
    lengthM: number | null;
    widthM: number | null;
    heightM: number | null;
    quantityValue: number | null;
    unit: string;
    computedQuantity: number;
    grossQuantity?: number | null;
    observation: string | null;
    lot: string | null;
  }>;
  missingInfos: Array<{
    id: string;
    label: string;
    comment: string | null;
    open: boolean;
    checkStatus?: string | null;
    category?: string | null;
  }>;
  medias: Array<{
    id: string;
    zone: string | null;
    kind: string;
    name: string;
    caption: string | null;
    category?: string | null;
    observation?: string | null;
    hypothesis?: string | null;
    origin?: string | null;
    measurementId: string | null;
    fileUrl: string | null;
    storagePath?: string | null;
  }>;
};

/** Découpe « Monsieur Marc MOREL » → civilité / prénom / nom. */
export function splitClientDisplayName(raw: string): {
  civility: string | null;
  firstName: string | null;
  lastName: string | null;
  fullName: string;
} {
  let s = raw.trim();
  let civility: string | null = null;
  const civMatch = s.match(
    /^(M\.|Mme\.?|Monsieur|Madame|Mademoiselle|Mlle\.?|Société|Sarl|SAS|EURL)\s+/i,
  );
  if (civMatch) {
    const c = civMatch[1]!;
    if (/^Mme|^Madame/i.test(c)) civility = "Mme";
    else if (/^Mlle|^Mademoiselle/i.test(c)) civility = "Mlle";
    else if (/Société|Sarl|SAS|EURL/i.test(c)) civility = "Société";
    else civility = "M.";
    s = s.slice(civMatch[0].length).trim();
  }
  const parts = s.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return {
      civility,
      firstName: parts[0]!,
      lastName: parts.slice(1).join(" "),
      fullName: s,
    };
  }
  return { civility, firstName: null, lastName: parts[0] || null, fullName: s };
}

function qtySource(m: SurveyVisitInput["measurements"][0]): string {
  if (m.lengthM != null && m.widthM != null && m.measureType === "SURFACE") return "calculated";
  if (m.lengthM != null && m.widthM != null && m.heightM != null && m.measureType === "VOLUME")
    return "calculated";
  if (m.quantityValue != null && m.lengthM == null) return "measured";
  if (m.computedQuantity > 0) return "calculated";
  return "to_confirm";
}

function resolveBillingAddress(visit: SurveyVisitInput): {
  line1: string | null;
  postalCode: string | null;
  city: string | null;
  country: string;
  sameAsSite: boolean;
} {
  const siteLine = visit.siteAddress?.trim() || null;
  const siteZip = visit.zipCode?.trim() || null;
  const siteCity = visit.city?.trim() || null;
  const hasClientAddr = Boolean(
    visit.clientAddress?.trim() ||
      visit.clientZipCode?.trim() ||
      visit.clientCity?.trim(),
  );
  const sameAsSite =
    visit.billingSameAsSite === true ||
    (visit.billingSameAsSite !== false && !hasClientAddr);
  if (sameAsSite) {
    return {
      line1: siteLine,
      postalCode: siteZip,
      city: siteCity,
      country: visit.clientCountry?.trim() || visit.siteCountry?.trim() || "France",
      sameAsSite: true,
    };
  }
  return {
    line1: visit.clientAddress?.trim() || null,
    postalCode: visit.clientZipCode?.trim() || null,
    city: visit.clientCity?.trim() || null,
    country: visit.clientCountry?.trim() || "France",
    sameAsSite: false,
  };
}

export function buildSiteSurveyJson(visit: SurveyVisitInput) {
  const photos = visit.medias.filter((m) => m.kind === "PHOTO");
  const parsed = splitClientDisplayName(visit.clientName || "");
  const civility = visit.clientCivility?.trim() || parsed.civility;
  const firstName = visit.clientFirstName?.trim() || parsed.firstName;
  const lastName = visit.clientLastName?.trim() || parsed.lastName;
  const company = visit.clientCompany?.trim() || visit.companyName?.trim() || null;
  const fullName =
    [firstName, lastName].filter(Boolean).join(" ") ||
    parsed.fullName ||
    visit.clientName?.trim() ||
    null;
  const clientPhone =
    visit.clientPhone?.trim() ||
    (visit.contactName &&
    visit.contactName.trim() &&
    visit.contactName.trim() !== visit.clientName.trim()
      ? null
      : visit.contactPhone?.trim()) ||
    visit.contactPhone?.trim() ||
    null;
  const clientEmail = visit.clientEmail?.trim() || visit.contactEmail?.trim() || null;
  const billing = resolveBillingAddress(visit);

  const onSiteName =
    visit.contactName?.trim() &&
    visit.contactName.trim() !== (fullName || visit.clientName || "").trim()
      ? visit.contactName.trim()
      : null;
  const onSitePhone = onSiteName
    ? visit.siteContactPhone?.trim() || visit.contactPhone?.trim() || null
    : visit.siteContactPhone?.trim() || null;
  const onSiteEmail = visit.siteContactEmail?.trim() || null;

  return {
    type: BEWORK_SITE_SURVEY_FORMAT,
    format: BEWORK_SITE_SURVEY_FORMAT,
    exported_at: new Date().toISOString(),
    visit: {
      id: visit.id,
      date: visit.scheduledAt,
      purpose: visit.subject,
      status: visit.status,
      client_need: visit.clientNeed,
    },
    client: {
      // Compat rétro
      name: fullName || visit.clientName,
      contact_name: visit.contactName,
      contact_phone: clientPhone,
      // Coordonnées structurées pour ChatGPT / devis
      civilite: civility,
      prenom: firstName,
      nom: lastName,
      nom_complet: fullName,
      raison_sociale: company,
      telephone: clientPhone,
      email: clientEmail,
      adresse: {
        ligne1: billing.line1,
        code_postal: billing.postalCode,
        ville: billing.city,
        pays: billing.country,
      },
      adresse_identique_chantier: billing.sameAsSite,
    },
    chantier: {
      nom: visit.siteName,
      adresse: {
        ligne1: visit.siteAddress?.trim() || null,
        code_postal: visit.zipCode?.trim() || null,
        ville: visit.city?.trim() || null,
        pays: visit.siteCountry?.trim() || "France",
      },
      description: visit.clientNeed,
      lots: visit.lots,
    },
    /** Alias rétrocompat (anciens prompts). */
    project: {
      name: visit.siteName,
      address: visit.siteAddress,
      postal_code: visit.zipCode?.trim() || null,
      city: visit.city?.trim() || null,
      country: visit.siteCountry?.trim() || "France",
      description: visit.clientNeed,
      lots: visit.lots,
    },
    contact_sur_place: {
      nom: onSiteName,
      telephone: onSitePhone,
      email: onSiteEmail,
    },
    zones: visit.zones.map((zoneName) => {
      const zoneMeasures = visit.measurements.filter((m) => (m.zone || "") === zoneName);
      const zonePhotos = photos.filter((p) => (p.zone || "") === zoneName);
      const zoneWorks = visit.proposedWorks.filter((w) => (w.zone || "") === zoneName);
      const zoneFindings = visit.findings.filter((f) => (f.zone || "") === zoneName);
      return {
        name: zoneName,
        measurements: zoneMeasures.map((m) => ({
          measurement_id: m.id,
          name: m.label,
          lot: m.lot,
          measure_type: m.measureType,
          length_m: m.lengthM,
          width_m: m.widthM,
          height_m: m.heightM,
          quantity_value: m.quantityValue,
          value: m.computedQuantity,
          unit: m.unit,
          source: qtySource(m),
          observation: m.observation,
        })),
        proposed_works: zoneWorks,
        findings: zoneFindings,
        photos: zonePhotos.map((p, idx) => ({
          photo_id: `PHOTO-${String(idx + 1).padStart(3, "0")}`,
          media_id: p.id,
          caption: p.caption,
          category: p.category,
          category_label: photoCategoryLabel(p.category),
          observation: p.observation,
          hypothesis: p.hypothesis,
          origin: p.origin === "DEMONSTRATION" ? "DEMONSTRATION" : "TERRAIN",
          measurement_id: p.measurementId,
          // URL privée BeWork — le PDF embarque les bytes ; le JSON référence l’id.
          note: "Image intégrée au PDF d’export ; ne pas inventer de dimension depuis la photo.",
        })),
      };
    }),
    orphan_measurements: visit.measurements
      .filter((m) => !m.zone || !visit.zones.includes(m.zone))
      .map((m) => ({
        measurement_id: m.id,
        name: m.label,
        zone: m.zone,
        value: m.computedQuantity,
        unit: m.unit,
        source: qtySource(m),
        lot: m.lot,
      })),
    constraints: visit.constraints,
    findings: visit.findings,
    proposed_works: visit.proposedWorks,
    commercial: visit.commercial,
    lot_technical_sheets: visit.lotSheets ?? {},
    /** Texte libre des relevés terrain — source principale pour ChatGPT. */
    field_notes: visit.fieldNotes?.trim() || null,
    field_notes_verbatim: true,
    missing_information: visit.missingInfos
      .filter((i) => i.open && i.checkStatus !== "NON_APPLICABLE" && i.checkStatus !== "CONFIRME")
      .map((i) => ({
        label: i.label,
        comment: i.comment,
        status: i.checkStatus || "A_VERIFIER",
        category: i.category,
      })),
    photos: photos.map((p, idx) => ({
      photo_id: `PHOTO-${String(idx + 1).padStart(3, "0")}`,
      media_id: p.id,
      zone: p.zone,
      caption: p.caption,
      category: p.category,
      category_label: photoCategoryLabel(p.category),
      observation: p.observation,
      hypothesis: p.hypothesis,
      origin: p.origin === "DEMONSTRATION" ? "DEMONSTRATION" : "TERRAIN",
      measurement_id: p.measurementId,
    })),
    rules: {
      no_invented_measures: true,
      no_invented_prices: true,
      distinguish_sources: [
        "measured",
        "calculated",
        "observed",
        "declared",
        "estimated",
        "to_confirm",
      ],
    },
  };
}

/**
 * Instructions ChatGPT après export visite → prochaine étape = MÉTRÉ (pas devis).
 * Sortie attendue : bework_prep_bundle_v1.
 */
export function buildChatgptTakeoffFromSurveyInstructions(
  survey: ReturnType<typeof buildSiteSurveyJson>,
): string {
  return [
    "Analyse ce compte rendu de visite de chantier BeWork (format bework_site_survey_v1).",
    "",
    "Tu prépares le MÉTRÉ / QUANTITATIF (section TAKEOFF), PAS un devis commercial.",
    "",
    "Analyse les relevés de chantier fournis.",
    "Identifie les ouvrages, les travaux demandés, les dimensions, les quantités,",
    "les matériaux et les contraintes.",
    "",
    "Utilise les valeurs effectivement renseignées.",
    "Lorsque des dimensions permettent un calcul simple et non ambigu, vérifie leur cohérence.",
    "Exemple : 8 m × 5 m = 40 m² (CALCULATION).",
    "",
    "Provenance obligatoire pour chaque cote / quantité :",
    "- MEASURE = relevé terrain réel",
    "- PLAN = cote explicitement lisible sur un plan",
    "- MANUAL = validation / saisie professionnelle",
    "- CALCULATION = calcul déterministe à partir de sources fiables",
    "- HYPOTHESIS = hypothèse clairement déclarée (jamais une mesure)",
    "- UNKNOWN = information absente → null / « à confirmer »",
    "",
    "N'invente AUCUNE dimension.",
    "PHOTO n'est PAS une mesure : ne déduis jamais une cote depuis une photo.",
    "Un plan fourni dans la discussion (hors BeWork) → provenance PLAN uniquement si la cote est lisible.",
    "Ne confonds pas une épaisseur existante et une épaisseur envisagée.",
    "",
    "Quand les informations sont suffisantes, génère UNIQUEMENT un JSON",
    `au format ${PREP_BUNDLE_FORMAT}, compatible avec l'import métré BeWork.`,
    "",
    "NE PRODUIS PAS de bework_quote_bundle_v1.",
    "NE PRODUIS PAS de prix, marge, TVA ni conditions commerciales (étape DEVIS ultérieure).",
    "",
    "IMPORTANT — COORDONNÉES CLIENT / CHANTIER :",
    "- Reprends EXACTEMENT les champs client, chantier et contact_sur_place du survey.",
    "- N'invente aucune coordonnée manquante : laisse null / vide et signale dans warnings.",
    "",
    "Règles :",
    "- Chaque paramètre / ligne de métré doit avoir une provenance explicite.",
    "- Si une quantité est ambiguë : null + « à confirmer », ne l'invente pas.",
    "- Le champ field_notes est le récit terrain : respecte-le intégralement.",
    "- Photos : références utiles, jamais comme source de dimensions.",
    "",
    "DONNÉES DE VISITE (bework_site_survey_v1) :",
    JSON.stringify(survey, null, 2),
  ].join("\n");
}

/**
 * @deprecated Alias — le parcours standard est métré (bework_prep_bundle_v1), pas devis.
 * Conservé pour appels historiques ; délègue vers buildChatgptTakeoffFromSurveyInstructions.
 */
export function buildChatgptQuoteInstructions(
  survey: ReturnType<typeof buildSiteSurveyJson>,
): string {
  return buildChatgptTakeoffFromSurveyInstructions(survey);
}

function ensureSpace(doc: jsPDF, y: number, need: number): number {
  const pageH = doc.internal.pageSize.getHeight();
  if (y + need > pageH - 16) {
    doc.addPage();
    return 18;
  }
  return y;
}

function section(doc: jsPDF, y: number, title: string): number {
  y = ensureSpace(doc, y, 12);
  const bg = tint(DEFAULT_BRAND, 0.9);
  doc.setFillColor(...bg);
  doc.roundedRect(14, y - 4, doc.internal.pageSize.getWidth() - 28, 8, 1.5, 1.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...DEFAULT_BRAND);
  doc.text(pdfSafe(title), 16, y + 1.5);
  doc.setTextColor(...INK);
  return y + 10;
}

function lines(doc: jsPDF, y: number, items: string[]): number {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...SLATE);
  const maxW = doc.internal.pageSize.getWidth() - 36;
  for (const item of items) {
    const wrapped = doc.splitTextToSize(pdfSafe(`• ${item}`), maxW) as string[];
    for (const row of wrapped) {
      y = ensureSpace(doc, y, 5);
      doc.text(row, 18, y);
      y += 4.5;
    }
  }
  return y + 2;
}

function prose(doc: jsPDF, y: number, text: string): number {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...SLATE);
  const maxW = doc.internal.pageSize.getWidth() - 36;
  const wrapped = doc.splitTextToSize(pdfSafe(text), maxW) as string[];
  for (const row of wrapped) {
    y = ensureSpace(doc, y, 5);
    doc.text(row, 18, y);
    y += 4.5;
  }
  return y + 2;
}

export function generateSiteSurveyPdf(
  visit: SurveyVisitInput,
  opts?: { photoBytes?: Array<{ caption: string; bytes: Uint8Array; mime?: string }> },
): Uint8Array {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const w = doc.internal.pageSize.getWidth();
  doc.setFillColor(...DEFAULT_BRAND);
  doc.rect(0, 0, w, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("COMPTE RENDU DE VISITE DE CHANTIER", 16, 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    pdfSafe(
      `${visit.companyName || "BeWork"} · ${visit.scheduledAt ? fmtDate(new Date(visit.scheduledAt)) : "Date à confirmer"}${visit.responsibleName ? ` · ${visit.responsibleName}` : ""}`,
    ),
    16,
    20,
  );
  doc.setTextColor(...INK);

  let y = 36;
  const billing = resolveBillingAddress(visit);
  const parsedName = splitClientDisplayName(visit.clientName || "");
  y = section(doc, y, "Informations client");
  y = lines(doc, y, [
    visit.clientCivility || parsedName.civility
      ? `Civilité : ${visit.clientCivility || parsedName.civility}`
      : null,
    `Nom : ${
      [visit.clientFirstName || parsedName.firstName, visit.clientLastName || parsedName.lastName]
        .filter(Boolean)
        .join(" ") || visit.clientName
    }`,
    visit.clientCompany ? `Raison sociale : ${visit.clientCompany}` : null,
    `Téléphone : ${visit.clientPhone || visit.contactPhone || "—"}`,
    `Email : ${visit.clientEmail || visit.contactEmail || "—"}`,
    `Adresse facturation : ${
      [
        billing.line1,
        [billing.postalCode, billing.city].filter(Boolean).join(" "),
        billing.country,
      ]
        .filter(Boolean)
        .join(", ") || "—"
    }`,
    billing.sameAsSite ? "Adresse facturation = adresse chantier" : null,
    visit.contactName && visit.contactName !== visit.clientName
      ? `Contact sur place : ${visit.contactName}${
          visit.siteContactPhone || visit.contactPhone
            ? ` · ${visit.siteContactPhone || visit.contactPhone}`
            : ""
        }${visit.siteContactEmail ? ` · ${visit.siteContactEmail}` : ""}`
      : null,
  ].filter(Boolean) as string[]);

  y = section(doc, y, "Chantier");
  y = lines(doc, y, [
    `Adresse : ${visit.siteAddress}`,
    visit.zipCode || visit.city
      ? `CP / Ville : ${[visit.zipCode, visit.city].filter(Boolean).join(" ")}`
      : null,
    `Pays : ${visit.siteCountry?.trim() || "France"}`,
    visit.siteName ? `Nom du site : ${visit.siteName}` : null,
  ].filter(Boolean) as string[]);

  y = section(doc, y, "Objet de la visite");
  y = lines(doc, y, [
    visit.clientNeed || visit.subject || "Non renseigné",
    ...(visit.lots.length ? [`Type de travaux : ${visit.lots.join(", ")}`] : []),
  ]);

  if (visit.fieldNotes?.trim()) {
    y = section(doc, y, "Relevés et métrés de chantier");
    y = prose(doc, y, visit.fieldNotes.trim());
  }

  if (visit.measurements.length) {
    y = section(doc, y, "Mesures structurées (facultatif)");
    y = lines(
      doc,
      y,
      visit.measurements.map((m) => {
        const dims = [
          m.lengthM != null ? `L ${m.lengthM} m` : null,
          m.widthM != null ? `l ${m.widthM} m` : null,
          m.heightM != null ? `H/P ${m.heightM} m` : null,
        ]
          .filter(Boolean)
          .join(" × ");
        return `${m.label} — ${dims || "dimensions non saisies"} → ${m.computedQuantity > 0 ? `${m.computedQuantity} ${m.unit}` : "quantité à confirmer"}${m.observation ? ` · ${m.observation}` : ""}`;
      }),
    );
  } else if (!visit.fieldNotes?.trim()) {
    y = section(doc, y, "Relevés et métrés de chantier");
    y = lines(doc, y, ["Aucun relevé saisi."]);
  }

  if (visit.findings.length) {
    y = section(doc, y, "Constats sur place");
    y = lines(
      doc,
      y,
      visit.findings.map((f) => {
        const parts = [`Constat : ${f.fact}`];
        if (f.hypothesis) parts.push(`Hypothèse (à confirmer) : ${f.hypothesis}`);
        if (f.toVerify) parts.push(`À vérifier : ${f.toVerify}`);
        return parts.join(" | ");
      }),
    );
  }

  if (visit.proposedWorks.length) {
    y = section(doc, y, "Travaux à chiffrer");
    y = lines(
      doc,
      y,
      visit.proposedWorks.map((w) => {
        const qty =
          w.quantity != null
            ? `${w.quantity} ${w.unit || ""} (${w.quantitySource || "to_confirm"})`
            : "Quantité à confirmer";
        return `[${w.lot || "Lot"}] ${w.designation} — ${qty}${w.description ? ` — ${w.description}` : ""}`;
      }),
    );
  }

  const obsLines = [
    visit.comments?.trim() || null,
    ...[
      visit.constraints.accessLevel && `Accès : ${visit.constraints.accessLevel}`,
      ...(visit.constraints.access ?? []).map((x) => `Accès · ${x}`),
      ...(visit.constraints.occupation ?? []).map((x) => `Occupation · ${x}`),
      visit.constraints.supportState && `Support : ${visit.constraints.supportState}`,
      ...(visit.constraints.supportObservations ?? []).map((x) => `Support · ${x}`),
      visit.constraints.asbestosStatus && `Amiante / diagnostic : ${visit.constraints.asbestosStatus}`,
      ...(visit.constraints.waste ?? []).map((x) => `Déchets · ${x}`),
      ...(visit.constraints.means ?? []).map((x) => `Moyens · ${x}`),
      visit.constraints.estimatedDifficulty && `Difficulté estimée : ${visit.constraints.estimatedDifficulty}`,
      visit.constraints.otherComment && `Autre : ${visit.constraints.otherComment}`,
    ].filter(Boolean),
  ].filter(Boolean) as string[];
  if (obsLines.length) {
    y = section(doc, y, "Observations techniques");
    y = lines(doc, y, obsLines);
  }

  const commercialLines = [
    visit.commercial.supplyByClient && `Matériaux souhaités : ${visit.commercial.supplyByClient}`,
    visit.commercial.budgetAnnounced && `Budget communiqué : ${visit.commercial.budgetAnnounced}`,
    visit.commercial.desiredDelay && `Délai souhaité : ${visit.commercial.desiredDelay}`,
    visit.commercial.specialExpectations && `Attentes : ${visit.commercial.specialExpectations}`,
  ].filter(Boolean) as string[];
  if (commercialLines.length) {
    y = section(doc, y, "Informations complémentaires");
    y = lines(doc, y, commercialLines);
  }

  const missing = visit.missingInfos.filter(
    (i) => i.open && i.checkStatus !== "CONFIRME" && i.checkStatus !== "NON_APPLICABLE",
  );
  if (missing.length) {
    y = section(doc, y, "Points à confirmer");
    y = lines(
      doc,
      y,
      missing.map((i) => `${i.label}${i.comment ? ` — ${i.comment}` : ""}`),
    );
  }

  if (opts?.photoBytes?.length) {
    y = section(doc, y, "Photographies");
    for (const ph of opts.photoBytes) {
      y = ensureSpace(doc, y, 55);
      try {
        const fmt = ph.mime?.includes("png") ? "PNG" : "JPEG";
        doc.addImage(ph.bytes, fmt, 18, y, 70, 45);
        doc.setFontSize(8);
        doc.setTextColor(...MUTED);
        doc.text(pdfSafe(ph.caption || "Photo"), 92, y + 8, { maxWidth: w - 110 });
        y += 50;
      } catch {
        y = lines(doc, y, [`[Photo non intégrable] ${ph.caption || ""}`]);
      }
    }
  } else if (visit.medias.some((m) => m.kind === "PHOTO")) {
    y = section(doc, y, "Photographies (légendes)");
    y = lines(
      doc,
      y,
      visit.medias
        .filter((m) => m.kind === "PHOTO")
        .map(
          (m, i) =>
            `PHOTO-${String(i + 1).padStart(3, "0")} · ${m.caption || m.name}${m.observation ? ` — ${m.observation}` : ""}`,
        ),
    );
  }

  y = ensureSpace(doc, y, 20);
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.setDrawColor(...RULE);
  doc.line(16, y, w - 16, y);
  doc.text(
    "Document basé uniquement sur les données saisies. Aucune mesure ni prix inventés. Prochaine étape : métré / quantitatif.",
    16,
    y + 6,
  );

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(`${i} / ${pageCount}`, w - 16, doc.internal.pageSize.getHeight() - 8, {
      align: "right",
    });
  }

  return new Uint8Array(doc.output("arraybuffer"));
}
