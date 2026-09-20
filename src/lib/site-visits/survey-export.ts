/**
 * Export visite → bework_site_survey_v1 + prompt ChatGPT → bework_quote_bundle_v1
 * Aucune API IA. Distingue mesuré / calculé / déclaré / à confirmer.
 */
import { jsPDF } from "jspdf";
import { DEFAULT_BRAND, INK, MUTED, RULE, SLATE, tint } from "@/lib/commercial/pdf/colors";
import { fmtDate, pdfSafe } from "@/lib/commercial/pdf/format";
import { BEWORK_QUOTE_BUNDLE_FORMAT } from "@/lib/commercial/chatgpt-bundle/types";
import {
  BEWORK_SITE_SURVEY_FORMAT,
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
    measurementId: string | null;
    fileUrl: string | null;
    storagePath?: string | null;
  }>;
};

function qtySource(m: SurveyVisitInput["measurements"][0]): string {
  if (m.lengthM != null && m.widthM != null && m.measureType === "SURFACE") return "calculated";
  if (m.lengthM != null && m.widthM != null && m.heightM != null && m.measureType === "VOLUME")
    return "calculated";
  if (m.quantityValue != null && m.lengthM == null) return "measured";
  if (m.computedQuantity > 0) return "calculated";
  return "to_confirm";
}

export function buildSiteSurveyJson(visit: SurveyVisitInput) {
  const photos = visit.medias.filter((m) => m.kind === "PHOTO");
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
      name: visit.clientName,
      contact_name: visit.contactName,
      contact_phone: visit.contactPhone,
    },
    project: {
      name: visit.siteName,
      address: visit.siteAddress,
      description: visit.clientNeed,
      lots: visit.lots,
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
          observation: p.observation,
          hypothesis: p.hypothesis,
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
      observation: p.observation,
      hypothesis: p.hypothesis,
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

export function buildChatgptQuoteInstructions(survey: ReturnType<typeof buildSiteSurveyJson>): string {
  return [
    "Analyse ce compte rendu de visite de chantier BeWork (format bework_site_survey_v1).",
    "",
    "Examine les informations techniques, les relevés et les photographies (légendes / observations).",
    "Identifie les prestations nécessaires pour répondre à la demande du client.",
    "Vérifie la cohérence des quantités (ex. longueur × largeur ≈ surface).",
    "Distingue les données mesurées, calculées, déclarées, estimées et les informations manquantes.",
    "",
    "Propose une décomposition des travaux par lots et par postes.",
    "N'invente aucune donnée technique manquante (épaisseur, profondeur, réseaux, etc.).",
    "Signale clairement les hypothèses nécessaires.",
    "",
    "Si les informations sont suffisantes, prépare un devis estimatif détaillé.",
    "Génère ensuite UNIQUEMENT un bloc JSON compatible avec l'import BeWork.",
    "",
    `Utilise exclusivement le format ${BEWORK_QUOTE_BUNDLE_FORMAT}.`,
    "",
    "Schéma attendu (propriétés reconnues par le parser BeWork) :",
    JSON.stringify(
      {
        format: BEWORK_QUOTE_BUNDLE_FORMAT,
        client: {
          first_name: "",
          last_name: "",
          company: "",
          phone: "",
          emails: [{ email: "", role: "primary" }],
          address: { line1: "", postal_code: "", city: "", country: "FR" },
        },
        site: {
          same_as_client_address: false,
          address: { line1: "", postal_code: "", city: "", country: "FR" },
          project_type: "",
          surface_value: null,
          surface_unit: "m²",
          access_notes: "",
          constraints: "",
        },
        quote: {
          title: "",
          description: "",
          validity_days: 30,
          pricing_strategy: "",
          vat_suggested_rate: 20,
          vat_requires_confirmation: true,
        },
        sections: [
          {
            title: "Lot",
            items: [
              {
                designation: "",
                description: "",
                quantity: 0,
                unit: "m²",
                unit_price_ht: 0,
                vat_rate: 20,
              },
            ],
          },
        ],
        client_advice: [],
        reservations: [],
        internal_notes: [],
        warnings: [],
      },
      null,
      2,
    ),
    "",
    "Règles :",
    "- Chaque ligne doit avoir designation, quantity ≥ 0, unit_price_ht ≥ 0.",
    "- Les totaux du JSON ne sont PAS une source de vérité (BeWork recalcule).",
    "- Si une quantité est « to_confirm », mets-la dans warnings / reservations, ne l'invente pas.",
    "- Photos : référence les photo_id dans les descriptions si utile.",
    "",
    "DONNÉES DE VISITE (bework_site_survey_v1) :",
    JSON.stringify(survey, null, 2),
  ].join("\n");
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
  doc.text("COMPTE RENDU DE VISITE / MÉTRÉ", 16, 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    pdfSafe(
      `${visit.subject} · ${visit.scheduledAt ? fmtDate(new Date(visit.scheduledAt)) : "Date à confirmer"}`,
    ),
    16,
    20,
  );
  doc.setTextColor(...INK);

  let y = 36;
  y = section(doc, y, "Identification");
  y = lines(doc, y, [
    `Client : ${visit.clientName}`,
    `Chantier : ${visit.siteName || "—"}`,
    `Adresse : ${visit.siteAddress}`,
    `Contact : ${[visit.contactName, visit.contactPhone].filter(Boolean).join(" · ") || "Non renseigné"}`,
    `Objet : ${visit.subject}`,
  ]);

  if (visit.clientNeed) {
    y = section(doc, y, "Demande du client");
    y = lines(doc, y, [visit.clientNeed]);
  }

  if (visit.lots.length || visit.zones.length) {
    y = section(doc, y, "Lots & zones");
    y = lines(doc, y, [
      ...(visit.lots.length ? [`Lots : ${visit.lots.join(", ")}`] : []),
      ...(visit.zones.length ? [`Zones : ${visit.zones.join(", ")}`] : []),
    ]);
  }

  if (visit.measurements.length) {
    y = section(doc, y, "Relevés dimensionnels");
    y = lines(
      doc,
      y,
      visit.measurements.map((m) => {
        const dims = [
          m.lengthM != null ? `L=${m.lengthM}` : null,
          m.widthM != null ? `l=${m.widthM}` : null,
          m.heightM != null ? `H=${m.heightM}` : null,
        ]
          .filter(Boolean)
          .join(" × ");
        const src = qtySource(m);
        return `${m.zone ? `[${m.zone}] ` : ""}${m.label} : ${m.computedQuantity} ${m.unit} (${src})${dims ? ` [${dims}]` : ""}${m.lot ? ` · ${m.lot}` : ""}`;
      }),
    );
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

  const c = visit.constraints;
  const constraintLines = [
    c.accessLevel && `Accès : ${c.accessLevel}`,
    ...(c.access ?? []).map((x) => `Accès · ${x}`),
    ...(c.occupation ?? []).map((x) => `Occupation · ${x}`),
    c.supportState && `Support : ${c.supportState}`,
    ...(c.supportObservations ?? []).map((x) => `Support · ${x}`),
    c.asbestosStatus && `Amiante / diagnostic : ${c.asbestosStatus}`,
    ...(c.waste ?? []).map((x) => `Déchets · ${x}`),
    ...(c.means ?? []).map((x) => `Moyens · ${x}`),
    c.estimatedDifficulty && `Difficulté estimée : ${c.estimatedDifficulty}`,
    c.otherComment && `Autre : ${c.otherComment}`,
  ].filter(Boolean) as string[];
  if (constraintLines.length) {
    y = section(doc, y, "Contraintes");
    y = lines(doc, y, constraintLines);
  }

  const commercialLines = Object.entries(visit.commercial)
    .filter(([, v]) => v && String(v).trim())
    .map(([k, v]) => `${k} : ${v}`);
  if (commercialLines.length) {
    y = section(doc, y, "Informations commerciales");
    y = lines(doc, y, commercialLines);
  }

  const missing = visit.missingInfos.filter(
    (i) => i.open && i.checkStatus !== "CONFIRME" && i.checkStatus !== "NON_APPLICABLE",
  );
  if (missing.length) {
    y = section(doc, y, "Points à confirmer avant chiffrage");
    y = lines(
      doc,
      y,
      missing.map((i) => `${i.label}${i.comment ? ` — ${i.comment}` : ""} [${i.checkStatus || "A_VERIFIER"}]`),
    );
  }

  if (opts?.photoBytes?.length) {
    y = section(doc, y, "Photos");
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
    y = section(doc, y, "Photos (légendes)");
    y = lines(
      doc,
      y,
      visit.medias
        .filter((m) => m.kind === "PHOTO")
        .map(
          (m, i) =>
            `PHOTO-${String(i + 1).padStart(3, "0")} · ${m.zone || "Zone ?"} · ${m.caption || m.name}${m.observation ? ` — ${m.observation}` : ""}`,
        ),
    );
  }

  y = ensureSpace(doc, y, 20);
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.setDrawColor(...RULE);
  doc.line(16, y, w - 16, y);
  doc.text(
    "Document basé uniquement sur les données saisies. Aucune mesure inventée. À vérifier avant devis.",
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
