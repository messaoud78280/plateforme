/**
 * Qualité du dossier de chiffrage — indicateurs distincts de la préparation RDV.
 */
import type { SiteVisitCommercialInfo, SiteVisitFinding, SiteVisitProposedWork } from "@/lib/site-visits/survey-types";
import type { SiteVisitConstraints } from "@/lib/site-visits/types";
import { hasVisitConstraints } from "@/lib/site-visits/completeness";

export type QualityItem = {
  id: string;
  label: string;
  status: "ok" | "watch" | "missing";
  detail: string;
};

export type VisitQuality = {
  items: QualityItem[];
  readyForQuote: boolean;
  label: string;
  openConfirmCount: number;
};

export function buildVisitQuality(opts: {
  clientName?: string | null;
  siteAddress?: string | null;
  subject?: string | null;
  contactName?: string | null;
  zones: string[];
  lots: string[];
  measurementCount: number;
  photoCount: number;
  constraints: SiteVisitConstraints;
  findings: SiteVisitFinding[];
  proposedWorks: SiteVisitProposedWork[];
  commercial: SiteVisitCommercialInfo;
  missingOpenCount: number;
  measurements?: Array<{
    lengthM: number | null;
    widthM: number | null;
    computedQuantity: number;
    measureType: string;
  }>;
}): VisitQuality {
  const coherenceIssues: string[] = [];
  for (const m of opts.measurements ?? []) {
    if (m.measureType === "SURFACE" && m.lengthM != null && m.widthM != null) {
      const calc = Math.round(m.lengthM * m.widthM * 10000) / 10000;
      if (Math.abs(calc - m.computedQuantity) > 0.05) {
        coherenceIssues.push(
          `Surface ${m.computedQuantity} vs L×l=${calc} — à vérifier`,
        );
      }
    }
  }

  const items: QualityItem[] = [
    {
      id: "general",
      label: "Informations générales",
      status:
        opts.clientName && opts.siteAddress && opts.subject ? "ok" : "missing",
      detail:
        opts.clientName && opts.siteAddress && opts.subject
          ? "Complètes"
          : "Client / adresse / objet incomplets",
    },
    {
      id: "contact",
      label: "Contact",
      status: opts.contactName ? "ok" : "watch",
      detail: opts.contactName ? "Renseigné" : "Facultatif — non renseigné",
    },
    {
      id: "zones",
      label: "Zones",
      status: opts.zones.length ? "ok" : "watch",
      detail: opts.zones.length ? `${opts.zones.length} zone(s)` : "À compléter si besoin",
    },
    {
      id: "lots",
      label: "Lots",
      status: opts.lots.length ? "ok" : "watch",
      detail: opts.lots.length ? opts.lots.join(", ") : "À préciser",
    },
    {
      id: "metres",
      label: "Métrés",
      status: opts.measurementCount ? (coherenceIssues.length ? "watch" : "ok") : "missing",
      detail: opts.measurementCount
        ? coherenceIssues[0] || `${opts.measurementCount} relevé(s)`
        : "À compléter",
    },
    {
      id: "photos",
      label: "Photos",
      status: opts.photoCount ? "ok" : "watch",
      detail: opts.photoCount ? `${opts.photoCount} photo(s)` : "Recommandé sur chantier",
    },
    {
      id: "works",
      label: "Description des travaux",
      status: opts.proposedWorks.length || opts.findings.length ? "ok" : "watch",
      detail:
        opts.proposedWorks.length || opts.findings.length
          ? "Renseignée"
          : "À compléter",
    },
    {
      id: "constraints",
      label: "Contraintes",
      status: hasVisitConstraints(opts.constraints) ? "ok" : "watch",
      detail: hasVisitConstraints(opts.constraints) ? "Renseignées" : "À vérifier",
    },
    {
      id: "materials",
      label: "Matériaux",
      status: opts.proposedWorks.some((w) => w.material?.trim()) ? "ok" : "watch",
      detail: opts.proposedWorks.some((w) => w.material?.trim())
        ? "Partiellement précisés"
        : "À préciser",
    },
    {
      id: "confirm",
      label: "Points techniques",
      status: opts.missingOpenCount ? "watch" : "ok",
      detail: opts.missingOpenCount
        ? `${opts.missingOpenCount} élément(s) à confirmer`
        : "Aucun point bloquant ouvert",
    },
  ];

  const criticalMissing = items.filter(
    (i) => i.status === "missing" && (i.id === "general" || i.id === "metres"),
  ).length;
  const readyForQuote =
    criticalMissing === 0 &&
    opts.measurementCount > 0 &&
    Boolean(opts.clientName?.trim()) &&
    Boolean(opts.subject?.trim());

  return {
    items,
    readyForQuote,
    label: readyForQuote ? "PRÊT POUR CHIFFRAGE" : "DOSSIER À COMPLÉTER",
    openConfirmCount: opts.missingOpenCount,
  };
}
