import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  exportProjectDossierZip,
  exportProjectSectionPdf,
  PROJECT_PDF_SECTIONS,
  type ProjectPdfSection,
} from "@/lib/chantier/export-project-section-pdf";

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /api/projets/[id]/export-pdf?section=VISIT|TAKEOFF|QUOTE|PLANNING|FOLLOW_UP|REPORT|NOTICE|DOSSIER
 * &entityId=… (optionnel)
 */
export async function GET(req: NextRequest, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id: projectId } = await ctx.params;
  const sectionRaw = (req.nextUrl.searchParams.get("section") || "").toUpperCase();
  const entityId = req.nextUrl.searchParams.get("entityId");
  const user = { id: session.user.id, role: session.user.role };

  if (sectionRaw === "DOSSIER") {
    const result = await exportProjectDossierZip({ projectId, user });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return new NextResponse(Buffer.from(result.bytes), {
      status: 200,
      headers: {
        "Content-Type": result.contentType,
        "Content-Disposition": `attachment; filename="${result.filename}"`,
        "Cache-Control": "no-store",
      },
    });
  }

  if (!(PROJECT_PDF_SECTIONS as string[]).includes(sectionRaw)) {
    return NextResponse.json(
      {
        error: `Section invalide. Utilisez : ${PROJECT_PDF_SECTIONS.join(", ")} ou DOSSIER.`,
      },
      { status: 400 },
    );
  }

  const result = await exportProjectSectionPdf({
    projectId,
    section: sectionRaw as ProjectPdfSection,
    entityId,
    user,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return new NextResponse(Buffer.from(result.bytes), {
    status: 200,
    headers: {
      "Content-Type": result.contentType,
      "Content-Disposition": `attachment; filename="${result.filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
