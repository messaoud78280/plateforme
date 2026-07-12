"use server";

import { revalidatePath } from "next/cache";
import { requireDemoStaffSession } from "@/lib/demo-pilotage/access";
import { generateDemoToken, hashAccessCode } from "@/lib/demo-pilotage/token";
import type { DemoPersonalization, DemoScenarioId } from "@/lib/demo-pilotage/types";
import { getDemoScenario } from "@/lib/demo-pilotage/scenarios";
import { prisma } from "@/lib/prisma";

const ADMIN_PATH = "/dashboard/demonstrations";

function parseDays(v: FormDataEntryValue | null, fallback: number) {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 1 || n > 90) return fallback;
  return Math.floor(n);
}

export async function createDemoPilotageLink(formData: FormData) {
  const session = await requireDemoStaffSession();
  const scenarioId = String(formData.get("scenarioId") ?? "go-logements-public");
  getDemoScenario(scenarioId); // validate exists via fallback ok

  const expiresInDays = parseDays(formData.get("expiresInDays"), 14);
  const maxViewsRaw = String(formData.get("maxViews") ?? "").trim();
  const maxViews = maxViewsRaw ? Math.min(500, Math.max(1, Number(maxViewsRaw) || 0)) || null : null;
  const accessCode = String(formData.get("accessCode") ?? "").trim() || null;
  const token = generateDemoToken();

  const personalization: DemoPersonalization = {
    prospectName: String(formData.get("prospectName") ?? "").trim() || undefined,
    prospectCompany: String(formData.get("prospectCompany") ?? "").trim() || undefined,
    corpsEtat: String(formData.get("corpsEtat") ?? "").trim() || undefined,
    marketType: String(formData.get("marketType") ?? "").trim() || undefined,
    chantierCountApprox: String(formData.get("chantierCountApprox") ?? "").trim() || undefined,
    mainPain: String(formData.get("mainPain") ?? "").trim() || undefined,
    commercialName: String(formData.get("commercialName") ?? "").trim() || session.user.name || undefined,
    meetingDate: String(formData.get("meetingDate") ?? "").trim() || undefined,
    logoAuthorized: formData.get("logoAuthorized") === "1",
    logoUrl: formData.get("logoAuthorized") === "1" ? String(formData.get("logoUrl") ?? "").trim() || undefined : undefined,
  };

  const link = await prisma.demoPilotageLink.create({
    data: {
      token,
      scenarioId: scenarioId as DemoScenarioId,
      prospectName: personalization.prospectName ?? null,
      prospectCompany: personalization.prospectCompany ?? null,
      accessCodeHash: accessCode ? hashAccessCode(accessCode, token) : null,
      expiresAt: new Date(Date.now() + expiresInDays * 86400000),
      maxViews,
      status: "ACTIVE",
      personalization,
      createdById: session.user.id,
    },
  });

  revalidatePath(ADMIN_PATH);
  return { ok: true as const, id: link.id, token: link.token };
}

export async function revokeDemoPilotageLink(formData: FormData) {
  await requireDemoStaffSession();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { ok: false as const, error: "Identifiant manquant." };

  await prisma.demoPilotageLink.update({
    where: { id },
    data: { status: "REVOKED", revokedAt: new Date() },
  });
  revalidatePath(ADMIN_PATH);
  return { ok: true as const };
}

export async function resetDemoPilotageLink(formData: FormData) {
  await requireDemoStaffSession();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { ok: false as const, error: "Identifiant manquant." };

  await prisma.demoPilotageLink.update({
    where: { id },
    data: {
      sandboxResetAt: new Date(),
    },
  });
  revalidatePath(ADMIN_PATH);
  return { ok: true as const };
}

export async function updateDemoCommercialNotes(formData: FormData) {
  await requireDemoStaffSession();
  const id = String(formData.get("id") ?? "").trim();
  const notes = String(formData.get("commercialNotes") ?? "").trim().slice(0, 5000);
  if (!id) return { ok: false as const, error: "Identifiant manquant." };

  await prisma.demoPilotageLink.update({
    where: { id },
    data: { commercialNotes: notes || null },
  });
  revalidatePath(ADMIN_PATH);
  return { ok: true as const };
}

export async function archiveDemoPilotageLink(formData: FormData) {
  await requireDemoStaffSession();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { ok: false as const, error: "Identifiant manquant." };
  await prisma.demoPilotageLink.update({
    where: { id },
    data: { status: "ARCHIVED" },
  });
  revalidatePath(ADMIN_PATH);
  return { ok: true as const };
}
