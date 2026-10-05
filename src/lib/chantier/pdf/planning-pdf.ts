import { fmtDate, pdfSafe } from "@/lib/commercial/pdf/format";
import { DEFAULT_BRAND, MUTED, RULE, SLATE, WASH_GRAY, WHITE } from "@/lib/commercial/pdf/colors";
import {
  createDoc,
  drawDocFooter,
  drawDocHeader,
  kv,
  metaSubtitle,
  sectionTitle,
  type ProjectPdfMeta,
} from "@/lib/chantier/pdf/shared";

export type PlanningPdfTask = {
  name: string;
  lot?: string | null;
  team?: string | null;
  startDate: Date | null;
  endDate: Date | null;
  durationDays: number | null;
  kind?: string | null;
  alert?: string | null;
};

function dayMs(d: Date) {
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function generatePlanningPdf(input: {
  meta: ProjectPdfMeta;
  revisionLabel: string;
  startDate: Date | null;
  endDate: Date | null;
  tasks: PlanningPdfTask[];
  alerts?: string[];
}): Uint8Array {
  const doc = createDoc("landscape", "a3");
  const headerBottom = drawDocHeader(
    doc,
    "PLANNING CHANTIER",
    metaSubtitle(input.meta),
  );
  let y = headerBottom + 6;
  y = kv(doc, y, "Chantier", input.meta.projectTitle);
  y = kv(doc, y, "Client", input.meta.clientLabel);
  y = kv(
    doc,
    y,
    "Adresse",
    [input.meta.siteAddress, input.meta.siteCity].filter(Boolean).join(", "),
  );
  y = kv(doc, y, "Révision", input.revisionLabel);
  y = kv(
    doc,
    y,
    "Période",
    [
      input.startDate ? fmtDate(input.startDate) : null,
      input.endDate ? fmtDate(input.endDate) : null,
    ]
      .filter(Boolean)
      .join(" → ") || "—",
  );
  y = kv(doc, y, "Édition", fmtDate(input.meta.editedAt ?? new Date()));
  y += 2;

  if (input.alerts?.length) {
    y = sectionTitle(doc, y, "Alertes utiles");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...SLATE);
    for (const a of input.alerts.slice(0, 8)) {
      doc.text(`• ${pdfSafe(a)}`, 14, y);
      y += 4.5;
    }
    y += 2;
  }

  y = sectionTitle(doc, y, "Légende");
  doc.setFontSize(8);
  doc.setTextColor(...SLATE);
  doc.setFillColor(...DEFAULT_BRAND);
  doc.rect(14, y - 2.5, 6, 3.5, "F");
  doc.text("Tâche / phase", 22, y);
  doc.setFillColor(196, 110, 42);
  doc.rect(58, y - 2.5, 6, 3.5, "F");
  doc.text("Point d’attention", 66, y);
  y += 8;

  const dated = input.tasks.filter((t) => t.startDate && t.endDate);
  const rangeStart =
    input.startDate ??
    dated.reduce<Date | null>(
      (min, t) => (!min || (t.startDate && t.startDate < min) ? t.startDate : min),
      null,
    ) ??
    new Date();
  const rangeEnd =
    input.endDate ??
    dated.reduce<Date | null>(
      (max, t) => (!max || (t.endDate && t.endDate > max) ? t.endDate : max),
      null,
    ) ??
    addDays(rangeStart, 28);

  const totalDays = Math.max(1, Math.round((dayMs(rangeEnd) - dayMs(rangeStart)) / 86400000) + 1);
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const labelW = 92;
  const ganttX = 14 + labelW;
  const ganttW = pageW - ganttX - 14;
  const rowH = 6.2;
  const daysPerPage = Math.min(totalDays, Math.max(14, Math.floor(ganttW / 4.2)));
  const pagePeriods = Math.ceil(totalDays / daysPerPage);

  for (let period = 0; period < pagePeriods; period++) {
    if (period > 0 || y > 60) {
      doc.addPage();
      const hb = drawDocHeader(
        doc,
        "PLANNING CHANTIER",
        `${metaSubtitle(input.meta)} · période ${period + 1}/${pagePeriods}`,
      );
      y = hb + 6;
    }

    const periodStart = addDays(rangeStart, period * daysPerPage);
    const periodDays = Math.min(daysPerPage, totalDays - period * daysPerPage);
    const dayW = ganttW / periodDays;

    // En-tête calendrier
    doc.setFillColor(...WASH_GRAY);
    doc.rect(14, y - 3, pageW - 28, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...SLATE);
    doc.text("Tâche / équipe", 16, y + 1.5);
    for (let d = 0; d < periodDays; d++) {
      const day = addDays(periodStart, d);
      if (d % 2 === 0 || periodDays <= 21) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6.5);
        doc.setTextColor(...MUTED);
        doc.text(String(day.getDate()), ganttX + d * dayW + 0.8, y + 1.5);
      }
    }
    y += 8;

    for (const task of input.tasks) {
      if (y + rowH > pageH - 16) {
        doc.addPage();
        y = 16;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(...DEFAULT_BRAND);
        doc.text(pdfSafe(`Suite — ${input.meta.projectTitle}`), 14, y);
        y += 8;
      }

      doc.setDrawColor(...RULE);
      doc.line(14, y + rowH - 0.5, pageW - 14, y + rowH - 0.5);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...SLATE);
      const label = [task.name, task.team ? `(${task.team})` : null, task.lot]
        .filter(Boolean)
        .join(" · ");
      const labelLines = doc.splitTextToSize(pdfSafe(label), labelW - 4) as string[];
      doc.text(labelLines[0] ?? "—", 16, y + 3.8);

      if (task.startDate && task.endDate) {
        const s = Math.max(0, Math.round((dayMs(task.startDate) - dayMs(periodStart)) / 86400000));
        const e = Math.min(
          periodDays - 1,
          Math.round((dayMs(task.endDate) - dayMs(periodStart)) / 86400000),
        );
        if (e >= 0 && s < periodDays) {
          const x0 = ganttX + Math.max(0, s) * dayW;
          const w = Math.max(dayW * 0.6, (e - Math.max(0, s) + 1) * dayW - 0.4);
          const barColor: [number, number, number] = task.alert
            ? [196, 110, 42]
            : DEFAULT_BRAND;
          doc.setFillColor(barColor[0], barColor[1], barColor[2]);
          doc.roundedRect(x0, y + 1.2, w, 3.6, 0.8, 0.8, "F");
          doc.setTextColor(...WHITE);
          doc.setFontSize(6);
          if (w > 12 && task.durationDays != null) {
            doc.text(pdfSafe(`${task.durationDays}j`), x0 + 1.2, y + 3.8);
          }
        }
      } else {
        doc.setFontSize(7);
        doc.setTextColor(...MUTED);
        doc.text("Dates à préciser", ganttX + 2, y + 3.8);
      }
      y += rowH;
    }
  }

  // Tableau récapitulatif lisible
  doc.addPage();
  const detailHeader = drawDocHeader(
    doc,
    "PLANNING — DETAIL DES TACHES",
    metaSubtitle(input.meta),
  );
  y = detailHeader + 6;
  doc.setFillColor(...WASH_GRAY);
  doc.rect(12, y - 3.5, pageW - 24, 7, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...SLATE);
  doc.text("Tâche", 14, y);
  doc.text("Équipe", 120, y);
  doc.text("Début", 160, y);
  doc.text("Fin", 185, y);
  doc.text("Durée", 210, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  for (const task of input.tasks) {
    if (y > pageH - 14) {
      doc.addPage();
      y = 16;
    }
    doc.setFontSize(7.5);
    doc.setTextColor(...SLATE);
    const name = doc.splitTextToSize(pdfSafe(task.name), 100) as string[];
    doc.text(name[0] ?? "—", 14, y);
    doc.text(pdfSafe(task.team || "—"), 120, y);
    doc.text(task.startDate ? fmtDate(task.startDate) : "—", 160, y);
    doc.text(task.endDate ? fmtDate(task.endDate) : "—", 185, y);
    doc.text(task.durationDays != null ? `${task.durationDays} j` : "—", 210, y);
    y += Math.max(5.5, name.length * 3.8);
  }

  drawDocFooter(doc, `${input.meta.projectTitle} · Planning ${input.revisionLabel}`);
  return new Uint8Array(doc.output("arraybuffer"));
}
