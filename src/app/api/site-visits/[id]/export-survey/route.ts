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
  const prep = visit.prep ?? {};
  return {
    id: visit.id,
    clientName: visit.clientName,
    siteName: visit.siteName,
    siteAddress: visit.siteAddress,
    contactName: visit.contactName,
    contactPhone: visit.contactPhone,
    contactEmail: prep.contactEmail ?? null,
    responsibleName: visit.responsibleName ?? null,
    zipCode: prep.zipCode ?? null,
    city: prep.city ?? null,
    clientCivility: prep.clientCivility ?? null,
    clientFirstName: prep.clientFirstName ?? null,
    clientLastName: prep.clientLastName ?? null,
    clientCompany: prep.clientCompany ?? null,
    clientPhone: visit.contactPhone,
    clientEmail: prep.contactEmail ?? null,
    clientAddress: prep.clientAddress ?? null,
    clientZipCode: prep.clientZipCode ?? null,
    clientCity: prep.clientCity ?? null,
    clientCountry: prep.clientCountry ?? null,
    billingSameAsSite: prep.billingSameAsSite,
    siteCountry: prep.siteCountry ?? "France",
    siteContactEmail: prep.siteContactEmail ?? null,
    siteContactPhone:
      prep.siteContactPhone ??
      (visit.contactName &&
      visit.contactName.trim() &&
      visit.contactName.trim() !== visit.clientName.trim()
        ? visit.contactPhone
        : null),
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
    lotSheets: prep.lotSheets ?? {},
    comments: visit.comments ?? null,
    fieldNotes: prep.fieldNotes ?? null,
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

/** Complète les trous depuis la fiche client liée — sans écraser une saisie visite. */
async function enrichFromLinkedClient(
  visit: NonNullable<Awaited<ReturnType<typeof getSiteVisit>>>,
  base: SurveyVisitInput,
): Promise<SurveyVisitInput> {
  if (!visit.clientExternalOrgId) return base;
  const org = await prisma.externalOrganization.findFirst({
    where: { id: visit.clientExternalOrgId },
    select: {
      name: true,
      tradeName: true,
      email: true,
      phone: true,
      address: true,
      zipCode: true,
      city: true,
      contacts: {
        take: 3,
        orderBy: { isPrimary: "desc" },
        select: {
          firstName: true,
          lastName: true,
          phone: true,
          email: true,
          isPrimary: true,
        },
      },
    },
  });
  if (!org) return base;

  const primary = org.contacts.find((c) => c.isPrimary) ?? org.contacts[0];
  const fill = (cur: string | null | undefined, next: string | null | undefined) =>
    cur?.trim() ? cur : next?.trim() || null;

  const firstName = fill(
    base.clientFirstName,
    primary?.firstName ?? null,
  );
  const lastName = fill(base.clientLastName, primary?.lastName ?? null);
  const company = fill(base.clientCompany, org.tradeName);
  const phone = fill(base.clientPhone, org.phone || primary?.phone);
  const email = fill(base.clientEmail, org.email || primary?.email);
  const clientAddress = fill(base.clientAddress, org.address);
  const clientZip = fill(base.clientZipCode, org.zipCode);
  const clientCity = fill(base.clientCity, org.city);

  // Si pas d'adresse chantier, reprendre la fiche client
  const siteAddress = fill(base.siteAddress, org.address) || base.siteAddress;
  const zipCode = fill(base.zipCode, org.zipCode);
  const city = fill(base.city, org.city);

  return {
    ...base,
    clientName: fill(base.clientName, org.name) || base.clientName,
    clientFirstName: firstName,
    clientLastName: lastName,
    clientCompany: company,
    clientPhone: phone,
    clientEmail: email,
    contactEmail: fill(base.contactEmail, email),
    clientAddress,
    clientZipCode: clientZip,
    clientCity,
    siteAddress,
    zipCode,
    city,
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
  const input = await enrichFromLinkedClient(visit, toSurveyInput(visit));
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
