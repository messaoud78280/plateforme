import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccessBeWorkSkills } from "@/lib/be-work-skills-access";
import { buildCctpPdfBuffer } from "@/lib/skills/cctp-export-pdf";
import { buildCctpWordBuffer } from "@/lib/skills/cctp-export-word";
import { getPpspsSessionMarkdownForExport } from "@/lib/skills/ppsps-session-service";
import type { PpspsExportFormat } from "@/lib/skills/ppsps-types";

export const runtime = "nodejs";

function safeFilename(base: string): string {
  return base.replace(/[^a-zA-Z0-9-_àâäéèêëïîôùûüçÀÂÄÉÈÊËÏÎÔÙÛÜÇ ]/g, "").slice(0, 60) || "ppsps-bework";
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  }
  if (!canAccessBeWorkSkills(session.user.role)) {
    return NextResponse.json({ error: "Accès non autorisé." }, { status: 403 });
  }

  const sessionId = request.nextUrl.searchParams.get("sessionId");
  const format = request.nextUrl.searchParams.get("format") as PpspsExportFormat | null;
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId requis." }, { status: 400 });
  }
  if (format !== "pdf" && format !== "doc") {
    return NextResponse.json({ error: "Format invalide (pdf ou doc)." }, { status: 400 });
  }

  try {
    const data = await getPpspsSessionMarkdownForExport(session.user.id, sessionId);
    if (!data) {
      return NextResponse.json({ error: "Aucun contenu à exporter pour cette session." }, { status: 404 });
    }

    const title = `PPSPS — ${data.siteName || "Analyse des risques"}`;
    const base = safeFilename(`ppsps-${data.siteName || "export"}-${sessionId.slice(-6)}`);

    if (format === "pdf") {
      const buf = buildCctpPdfBuffer({
        title,
        markdown: data.markdown,
        lot: data.siteAddress ?? undefined,
      });
      return new NextResponse(new Uint8Array(buf), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${base}.pdf"`,
        },
      });
    }

    const buf = buildCctpWordBuffer(data.markdown, title);
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/msword",
        "Content-Disposition": `attachment; filename="${base}.doc"`,
      },
    });
  } catch (e) {
    console.error("[skills/ppsps/export]", e);
    return NextResponse.json({ error: "Export impossible." }, { status: 500 });
  }
}
