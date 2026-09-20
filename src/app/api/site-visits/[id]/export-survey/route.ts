import { NextResponse } from "next/server";
import { getCachedServerSession } from "@/lib/auth/cached-session";
import { decideApiAccess } from "@/lib/equipe-acces/dashboard-policy";
import {
  canAccessSiteVisits,
  resolveSiteVisitsOrgId,
} from "@/lib/site-visits/access";
import { getSiteVisit } from "@/lib/site-visits/service";
import { prisma } from "@/lib/prisma";
import { createServiceRoleClient } from "@/lib/supabase";
import {
  buildChatgptQuoteInstructions,
  buildSiteSurveyJson,
  generateSiteSurveyPdf,
  type SurveyVisitInput,
} from "@/lib/site-visits/survey-export";
import type { SiteVisitConstraints } from "@/lib/site-visits/types";
import type {
  SiteVisitCommercialInfo,
  SiteVisitFinding,
  SiteVisitProposedWork,
} from "@/lib/site-visits/survey-types";

export const dynamic = "force-dynamic";

function toSurveyInput(visit: NonNullable<Awaited<ReturnType<typeof getSiteVisit>>>): SurveyVisitInput {
  return {
    id: visit.id,
    clientName: visit.clientName,
    siteName: visit.siteName,
    siteAddress: visit.siteAddress,
    contactName: visit.contactName,
    contactPhone: visit.contactPhone,
    subject: visit.subject,
    clientNeed: visit.clientNeed,
    scheduledAt: visit.scheduledAt,
    status: visit.status,
    lots: visit.lots ?? [],
    zones: visit.zones ?? [],
    constraints: visit.constraints as SiteVisitConstraints,
    findings: (visit.findings ?? []) as SiteVisitFinding[],
    proposedWorks: (visit.proposedWorks ?? []) as SiteVisitProposedWork[],
    commercial: (visit.commercial ?? {}) as SiteVisitCommercialInfo,
    lotSheets: visit.prep?.lotSheets ?? {},
    measurements: visit.measurements.map((m) => ({
      id: m.id,
      zone: m.zone,
      label: m.label,
      measureType: m.measureType,
      lengthM: m.lengthM,
      widthM: m.widthM,
      heightM: m.heightM,
      quantityValue: m.quantityValue,
      unit: m.unit,
      computedQuantity: m.computedQuantity,
      grossQuantity: m.grossQuantity,
      observation: m.observation,
      lot: m.lot ?? null,
    })),
    missingInfos: visit.missingInfos.map((i) => ({
      id: i.id,
      label: i.label,
      comment: i.comment ?? null,
      open: i.open,
      checkStatus: i.checkStatus ?? null,
      category: i.category ?? null,
    })),
    medias: visit.medias.map((m) => ({
      id: m.id,
      zone: m.zone ?? null,
      kind: m.kind,
      name: m.name,
      caption: m.caption,
      category: m.category ?? null,
      observation: m.observation ?? null,
      hypothesis: m.hypothesis ?? null,
      measurementId: m.measurementId,
      fileUrl: m.fileUrl,
      storagePath: m.storagePath ?? null,
    })),
  };
}

async function loadPhotoBytes(
  medias: SurveyVisitInput["medias"],
): Promise<Array<{ caption: string; bytes: Uint8Array; mime?: string }>> {
  const supabase = createServiceRoleClient();
  if (!supabase) return [];
  const out: Array<{ caption: string; bytes: Uint8Array; mime?: string }> = [];
  for (const m of medias.filter((x) => x.kind === "PHOTO").slice(0, 12)) {
    if (!m.storagePath) continue;
    try {
      const { data, error } = await supabase.storage.from("documents").download(m.storagePath);
      if (error || !data) continue;
      const buf = new Uint8Array(await data.arrayBuffer());
      out.push({
        caption: [m.zone, m.caption, m.observation].filter(Boolean).join(" — ") || m.name,
        bytes: buf,
        mime: undefined,
      });
    } catch {
      /* skip */
    }
  }
  return out;
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await getCachedServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const gate = decideApiAccess(
    "/api/site-visits",
    session.user.personType,
    session.user.permissionProfile,
  );
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  if (!canAccessSiteVisits(session.user)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  const orgId = await resolveSiteVisitsOrgId(session.user);
  if (!orgId) {
    return NextResponse.json({ error: "Organisation introuvable" }, { status: 404 });
  }
  const { id } = await ctx.params;
  const visit = await getSiteVisit(orgId, id);
  if (!visit) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  const format = new URL(req.url).searchParams.get("format") || "json";
  const input = toSurveyInput(visit);
  const survey = buildSiteSurveyJson(input);
  const prompt = buildChatgptQuoteInstructions(survey);

  await prisma.siteVisit.update({
    where: { id: visit.id },
    data: {
      surveyExportedAt: new Date(),
      surveyStage: "EXPORTED",
    },
  });

  if (format === "prompt") {
    return NextResponse.json({ prompt, survey });
  }

  if (format === "pdf") {
    const photoBytes = await loadPhotoBytes(input.medias);
    const pdf = generateSiteSurveyPdf(input, { photoBytes });
    const filename = `visite-${visit.id.slice(0, 8)}.pdf`;
    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  }

  if (format === "zip") {
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    const photoBytes = await loadPhotoBytes(input.medias);
    const pdf = generateSiteSurveyPdf(input, { photoBytes });
    zip.file("compte-rendu.pdf", pdf);
    zip.file("compte-rendu.json", JSON.stringify(survey, null, 2));
    zip.file("instructions-chatgpt.txt", prompt);
    const photosFolder = zip.folder("photos");
    photoBytes.forEach((ph, i) => {
      photosFolder?.file(
        `PHOTO-${String(i + 1).padStart(3, "0")}.jpg`,
        ph.bytes,
      );
    });
    const zipBuf = await zip.generateAsync({ type: "uint8array" });
    return new NextResponse(Buffer.from(zipBuf), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="visite-${visit.id.slice(0, 8)}.zip"`,
        "Cache-Control": "no-store",
      },
    });
  }

  // json (default)
  return NextResponse.json({
    survey,
    prompt,
    format: survey.format,
  });
}
