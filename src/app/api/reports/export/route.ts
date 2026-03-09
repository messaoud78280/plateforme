import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getReportStats, type PeriodKey } from "@/lib/reportStats";
import { jsPDF } from "jspdf";

const PERIOD_LABELS: Record<string, string> = {
  "7d": "7 jours",
  "30d": "30 jours",
  "3m": "3 mois",
  "6m": "6 mois",
  "1y": "1 an",
};

/** GET /api/reports/export?period=30d&format=csv|pdf */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const period = (request.nextUrl.searchParams.get("period") || "30d") as PeriodKey;
  const format = request.nextUrl.searchParams.get("format") || "pdf";

  if (!["7d", "30d", "3m", "6m", "1y"].includes(period)) {
    return NextResponse.json({ error: "Période invalide" }, { status: 400 });
  }
  if (format !== "csv" && format !== "pdf") {
    return NextResponse.json({ error: "Format invalide (csv ou pdf)" }, { status: 400 });
  }

  try {
    const stats = await getReportStats(
      session.user.id,
      (session.user.role === "AGENCE" || session.user.role === "MANAGER"),
      period
    );

    const tauxCompletion =
      stats.tasks.total > 0
        ? Math.round((stats.tasks.completed / stats.tasks.total) * 100)
        : 0;

    if (format === "csv") {
      const rows = [
        ["Rapport", "Plateforme Client - Agence"],
        ["Période", PERIOD_LABELS[period] ?? period],
        ["Du", stats.start.toLocaleDateString("fr-FR")],
        ["Au", stats.end.toLocaleDateString("fr-FR")],
        [],
        ["Indicateur", "Valeur"],
        ["Tâches créées", String(stats.tasks.total)],
        ["Tâches terminées", String(stats.tasks.completed)],
        ["Taux de complétion (%)", String(tauxCompletion)],
        ["Temps moyen de traitement (jours)", String(stats.tempsMoyenJours < 1 ? "< 1" : stats.tempsMoyenJours)],
        ["Documents déposés", String(stats.documents.total)],
        ["Projets créés", String(stats.projects.total)],
      ];
      const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
      const bom = "\uFEFF";
      return new NextResponse(bom + csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="rapport-${period}-${stats.start.toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    // PDF
    const doc = new jsPDF();
    
    
    let y = 20;

    doc.setFontSize(18);
    doc.text("Rapport d'activité", 14, y);
    y += 10;

    doc.setFontSize(11);
    doc.text(`Période : ${PERIOD_LABELS[period] ?? period} (du ${stats.start.toLocaleDateString("fr-FR")} au ${stats.end.toLocaleDateString("fr-FR")})`, 14, y);
    y += 15;

    doc.setFontSize(12);
    doc.text("Récapitulatif", 14, y);
    y += 8;

    doc.setFontSize(10);
    const tableData = [
      ["Tâches créées", String(stats.tasks.total)],
      ["Tâches terminées", String(stats.tasks.completed)],
      ["Taux de complétion", `${tauxCompletion} %`],
      ["Temps moyen (jours)", stats.tempsMoyenJours < 1 ? "< 1" : String(stats.tempsMoyenJours)],
      ["Documents déposés", String(stats.documents.total)],
      ["Projets créés", String(stats.projects.total)],
    ];
    tableData.forEach(([label, value]) => {
      doc.text(label, 14, y);
      doc.text(value, pageW - 14 - doc.getTextWidth(value), y);
      y += 7;
    });

    y += 10;
    doc.setFontSize(10);
    doc.text(`Généré le ${new Date().toLocaleString("fr-FR")} - Plateforme Client Agence`, 14, y);

    const buf = Buffer.from(doc.output("arraybuffer"));
    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="rapport-${period}-${stats.start.toISOString().slice(0, 10)}.pdf"`,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erreur lors de l'export" }, { status: 500 });
  }
}
