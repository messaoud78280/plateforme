import { NextResponse } from "next/server";
import { requireCommercialApiSession } from "@/lib/commercial/access";
import { prisma } from "@/lib/prisma";
import { ensureCommercialOrgSettings } from "@/lib/commercial/settings";
import {
  mergeCompanyProfileIntoDocSettings,
  parseCompanyProfile,
  type CompanyProfile,
  withKnownOrgDefaults,
} from "@/lib/commercial/company-profile";

export const runtime = "nodejs";

/** GET — profil commercial / légal de l’organisation. */
export async function GET() {
  const auth = await requireCommercialApiSession({
    requiredHref: "/dashboard/devis-facturation",
  });
  if (auth.error || !auth.session || !auth.orgId) {
    return NextResponse.json(
      { error: auth.error ?? "Non autorisé" },
      { status: auth.status },
    );
  }

  await ensureCommercialOrgSettings(auth.orgId);
  const org = await prisma.organization.findUnique({
    where: { id: auth.orgId },
    select: {
      name: true,
      siret: true,
      commercialOrgSettings: { select: { quoteDocumentSettingsJson: true } },
    },
  });
  const profile = withKnownOrgDefaults(
    org?.name,
    parseCompanyProfile(org?.commercialOrgSettings?.quoteDocumentSettingsJson),
  );
  if (!profile.name) profile.name = org?.name ?? null;
  if (!profile.siret) profile.siret = org?.siret ?? null;

  return NextResponse.json({ profile, organizationName: org?.name ?? null });
}

/** PATCH — met à jour le profil organisation (nouveaux devis). */
export async function PATCH(req: Request) {
  const auth = await requireCommercialApiSession({
    requiredHref: "/dashboard/devis-facturation",
    requireWrite: true,
  });
  if (auth.error || !auth.session || !auth.orgId) {
    return NextResponse.json(
      { error: auth.error ?? "Non autorisé" },
      { status: auth.status },
    );
  }

  const body = (await req.json().catch(() => null)) as {
    profile?: Partial<CompanyProfile>;
  } | null;
  if (!body?.profile || typeof body.profile !== "object") {
    return NextResponse.json({ error: "Profil requis" }, { status: 400 });
  }

  await ensureCommercialOrgSettings(auth.orgId);
  const settings = await prisma.commercialOrgSettings.findUnique({
    where: { organizationId: auth.orgId },
    select: { quoteDocumentSettingsJson: true },
  });
  const org = await prisma.organization.findUnique({
    where: { id: auth.orgId },
    select: { name: true, siret: true },
  });

  const current = withKnownOrgDefaults(
    org?.name,
    parseCompanyProfile(settings?.quoteDocumentSettingsJson),
  );
  const next: CompanyProfile = {
    ...current,
    ...Object.fromEntries(
      Object.entries(body.profile).map(([k, v]) => [
        k,
        v === undefined ? current[k as keyof CompanyProfile] : v === "" ? null : v,
      ]),
    ),
  } as CompanyProfile;

  await prisma.commercialOrgSettings.update({
    where: { organizationId: auth.orgId },
    data: {
      quoteDocumentSettingsJson: mergeCompanyProfileIntoDocSettings(
        settings?.quoteDocumentSettingsJson,
        next,
      ),
    },
  });

  if (next.siret && next.siret !== org?.siret) {
    await prisma.organization.update({
      where: { id: auth.orgId },
      data: { siret: next.siret },
    });
  }
  if (next.name && next.name !== org?.name) {
    await prisma.organization.update({
      where: { id: auth.orgId },
      data: { name: next.name },
    });
  }

  return NextResponse.json({ ok: true, profile: next });
}
