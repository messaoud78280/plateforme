import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getReportStats, type PeriodKey } from "@/lib/reportStats";
import { getClientReportingSnapshot } from "@/lib/client-reporting-insights";
import {
  parseReportExportFormatParam,
  parseReportPeriodParam,
} from "@/lib/validation/reportParams";
import { jsPDF } from "jspdf";
import { isAgencyOrManager, isClientRole, isManager as isManagerRole } from "@/lib/authz";

const PERIOD_LABELS: Record<PeriodKey, string> = {
  "7d": "7 jours",
  "30d": "30 jours",
  "3m": "3 mois",
  "6m": "6 mois",
  "1y": "1 an",
};

function safeExportFilenameBase(period: PeriodKey, start: Date, prefix = "rapport"): string {
  const d = start.toISOString().slice(0, 10).replace(/[^0-9-]/g, "");
  return `${prefix}-${period}-${d || "export"}`;
}

function ensureY(doc: jsPDF, y: number, need = 12): number {
  const pageH = doc.internal.pageSize.getHeight();
  if (y + need < pageH - 14) return y;
  doc.addPage();
  return 20;
}

/** GET /api/reports/export?period=30d&format=csv|pdf */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const period = parseReportPeriodParam(request.nextUrl.searchParams.get("period"));
  if (period === null) {
    return NextResponse.json({ error: "Période invalide" }, { status: 400 });
  }

  const format = parseReportExportFormatParam(request.nextUrl.searchParams.get("format"));
  if (format === null) {
    return NextResponse.json({ error: "Format invalide (csv ou pdf)" }, { status: 400 });
  }

  const isAgence = isAgencyOrManager(session.user);
  const isClient = isClientRole(session.user);
  const isManager = isManagerRole(session.user);

  try {
    const [stats, clientSnapshot] = await Promise.all([
      getReportStats(session.user.id, isAgence, period),
      isClient
        ? getClientReportingSnapshot(session.user.id, "client")
        : isManager
          ? getClientReportingSnapshot(session.user.id, "ops")
          : Promise.resolve(null),
    ]);

    const tauxCompletion =
      stats.tasks.total > 0 ? Math.round((stats.tasks.completed / stats.tasks.total) * 100) : 0;
    const hasSnapshot = Boolean(clientSnapshot);
    const reportTitle = isClient
      ? "BeWork — Reporting client"
      : isManager
        ? "BeWork — Reporting activité"
        : "BeWork — Rapport activité";
    const filenamePrefix = isClient ? "reporting-client" : isManager ? "reporting-activite" : "rapport";

    if (format === "csv") {
      const rows: (string | number)[][] = [
        ["Rapport", reportTitle],
        ["Période", PERIOD_LABELS[period] ?? period],
        ["Du", stats.start.toLocaleDateString("fr-FR")],
        ["Au", stats.end.toLocaleDateString("fr-FR")],
        [],
        ["Indicateur", "Valeur"],
        [hasSnapshot ? "Missions créées" : "Tâches créées", String(stats.tasks.total)],
        [hasSnapshot ? "Missions terminées" : "Tâches terminées", String(stats.tasks.completed)],
        ["Taux de complétion (%)", String(tauxCompletion)],
        [
          "Temps moyen de traitement (jours)",
          String(stats.tempsMoyenJours < 1 ? "< 1" : stats.tempsMoyenJours),
        ],
        ["Documents déposés", String(stats.documents.total)],
        ["Chantiers créés", String(stats.projects.total)],
      ];

      if (clientSnapshot) {
        rows.push(
          [],
          ["Synthèse dirigeant", clientSnapshot.executiveDigest.headline],
          ...clientSnapshot.executiveDigest.bullets.map((b) => ["Point", b]),
          [],
          isManager
            ? ["Dossier", "Client", "Signal", "Statut", "Attente (j)", "Prochaine action", "Date souhaitée"]
            : ["Dossier", "Signal", "Statut", "Attente (j)", "Prochaine action", "Date souhaitée"],
          ...clientSnapshot.dossiers.map((d) =>
            isManager
              ? [d.title, d.clientName ?? "", d.flagLabel, d.statusLabel, String(d.daysWaiting), d.nextAction, d.desiredDate ?? ""]
              : [d.title, d.flagLabel, d.statusLabel, String(d.daysWaiting), d.nextAction, d.desiredDate ?? ""],
          ),
          [],
          ["Décision récente", "Libellé", "Date", "Note"],
          ...clientSnapshot.recentDecisions.map((d) => [
            d.title,
            d.decisionLabel,
            d.decidedAt ? new Date(d.decidedAt).toLocaleDateString("fr-FR") : "",
            d.note ?? "",
          ]),
        );
      }

      const csv = rows
        .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";"))
        .join("\n");
      const bom = "\uFEFF";
      const fname = `${safeExportFilenameBase(period, stats.start, filenamePrefix)}.csv`;
      return new NextResponse(bom + csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${fname}"`,
        },
      });
    }

    // PDF
    const doc = new jsPDF();
    let y = 20;
    const pageW = doc.internal.pageSize.getWidth();

    const pdfTitle = isClient
      ? "Reporting client BeWork"
      : isManager
        ? "Reporting activité BeWork"
        : "Rapport d'activité";
    doc.setFontSize(18);
    doc.text(pdfTitle, 14, y);
    y += 10;

    doc.setFontSize(11);
    doc.text(
      `Période : ${PERIOD_LABELS[period] ?? period} (du ${stats.start.toLocaleDateString("fr-FR")} au ${stats.end.toLocaleDateString("fr-FR")})`,
      14,
      y,
    );
    y += 12;

    if (clientSnapshot) {
      doc.setFontSize(12);
      doc.text(isManager ? "Synthèse activité" : "Synthèse dirigeant", 14, y);
      y += 7;
      doc.setFontSize(10);
      const headlineLines = doc.splitTextToSize(clientSnapshot.executiveDigest.headline, pageW - 28);
      doc.text(headlineLines, 14, y);
      y += headlineLines.length * 5 + 4;
      for (const bullet of clientSnapshot.executiveDigest.bullets) {
        y = ensureY(doc, y, 10);
        const lines = doc.splitTextToSize(`• ${bullet}`, pageW - 28);
        doc.text(lines, 14, y);
        y += lines.length * 5 + 2;
      }
      y += 6;

      doc.setFontSize(12);
      y = ensureY(doc, y, 12);
      doc.text("Dossiers prioritaires", 14, y);
      y += 7;
      doc.setFontSize(9);
      for (const d of clientSnapshot.dossiers.filter((x) => x.flag !== "en_cours").slice(0, 8)) {
        y = ensureY(doc, y, 14);
        const clientSuffix = isManager && d.clientName ? ` [${d.clientName}]` : "";
        const line = doc.splitTextToSize(
          `[${d.flagLabel}] ${d.title}${clientSuffix} — ${d.nextAction} (${d.daysWaiting} j)`,
          pageW - 28,
        );
        doc.text(line, 14, y);
        y += line.length * 4.5 + 3;
      }
      y += 6;
    }

    y = ensureY(doc, y, 20);
    doc.setFontSize(12);
    doc.text("Récapitulatif période", 14, y);
    y += 8;

    doc.setFontSize(10);
    const tableData = [
      [hasSnapshot ? "Missions créées" : "Tâches créées", String(stats.tasks.total)],
      [hasSnapshot ? "Missions terminées" : "Tâches terminées", String(stats.tasks.completed)],
      ["Taux de complétion", `${tauxCompletion} %`],
      ["Temps moyen (jours)", stats.tempsMoyenJours < 1 ? "< 1" : String(stats.tempsMoyenJours)],
      ["Documents déposés", String(stats.documents.total)],
      ["Chantiers créés", String(stats.projects.total)],
    ];
    tableData.forEach(([label, value]) => {
      y = ensureY(doc, y, 8);
      doc.text(label, 14, y);
      doc.text(value, pageW - 14 - doc.getTextWidth(value), y);
      y += 7;
    });

    y += 10;
    y = ensureY(doc, y, 10);
    doc.setFontSize(9);
    doc.text(
      `Généré le ${new Date().toLocaleString("fr-FR")} — BeWork. Vous validez ; BeWork prépare et suit.`,
      14,
      y,
    );

    const buf = Buffer.from(doc.output("arraybuffer"));
    const fname = `${safeExportFilenameBase(period, stats.start, filenamePrefix)}.pdf`;
    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fname}"`,
      },
    });
  } catch (e: unknown) {
    console.error("[reports/export]", e);
    return NextResponse.json({ error: "Erreur lors de l'export" }, { status: 500 });
  }
}
