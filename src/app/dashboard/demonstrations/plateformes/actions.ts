"use server";

import { DEMO_MODULE_KEYS, defaultModulesForTemplate, isDemoTemplateKey } from "@/lib/demo-environment/constants";
import {
  createDemoEnvironment,
  deleteDemoEnvironment,
  duplicateDemoEnvironment,
  extendDemoEnvironment,
  resetDemoEnvironment,
  resetDemoPassword,
  setDemoEnvironmentStatus,
} from "@/lib/demo-environment/service";
import { requireDemoStaffSession } from "@/lib/demo-pilotage/access";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const LIST_PATH = "/dashboard/demonstrations/plateformes";

async function assertStaff() {
  const session = await requireDemoStaffSession();
  if ((session.user as { isDemo?: boolean }).isDemo) {
    redirect("/dashboard");
  }
  return session;
}

export type CreateDemoActionState = {
  ok?: boolean;
  error?: string;
  demoId?: string;
  loginIdentifier?: string;
  passwordOnce?: string;
  expiresAt?: string;
  companyName?: string;
};

export async function createPlatformDemoAction(
  _prev: CreateDemoActionState,
  formData: FormData,
): Promise<CreateDemoActionState> {
  const session = await assertStaff();

  const companyName = String(formData.get("companyName") ?? "").trim();
  const internalName = String(formData.get("internalName") ?? "").trim();
  const sector = String(formData.get("sector") ?? "").trim();
  const employeeCountRaw = String(formData.get("employeeCount") ?? "").trim();
  const logoUrl = String(formData.get("logoUrl") ?? "").trim();
  const templateKey = String(formData.get("templateKey") ?? "PME_BTP").trim();
  const loginIdentifier = String(formData.get("loginIdentifier") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();
  const meetingAtRaw = String(formData.get("meetingAt") ?? "").trim();
  const expiresAtRaw = String(formData.get("expiresAt") ?? "").trim();
  const accessDays = Number(formData.get("accessDays") ?? "7");

  const modules = DEMO_MODULE_KEYS.filter((k) => formData.get(`module_${k}`) === "on");

  const employeeCount = employeeCountRaw ? Number(employeeCountRaw) : null;
  const meetingAt = meetingAtRaw ? new Date(meetingAtRaw) : null;
  const expiresAt = expiresAtRaw ? new Date(expiresAtRaw) : null;

  const result = await createDemoEnvironment({
    companyName,
    internalName: internalName || undefined,
    sector: sector || undefined,
    employeeCount: Number.isFinite(employeeCount) ? employeeCount : null,
    logoUrl: logoUrl || null,
    templateKey: isDemoTemplateKey(templateKey) ? templateKey : "PME_BTP",
    modulesEnabled:
      modules.length > 0
        ? modules
        : defaultModulesForTemplate(isDemoTemplateKey(templateKey) ? templateKey : "PME_BTP"),
    meetingAt,
    expiresAt,
    accessDaysAfterMeeting: Number.isFinite(accessDays) ? accessDays : 7,
    loginIdentifier: loginIdentifier || null,
    password: password || null,
    createdById: session.user.id,
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  revalidatePath(LIST_PATH);
  return {
    ok: true,
    demoId: result.demoId,
    loginIdentifier: result.loginIdentifier,
    passwordOnce: result.passwordOnce,
    expiresAt: result.expiresAt.toISOString(),
    companyName: result.companyName,
  };
}

export async function resetPlatformDemoAction(formData: FormData) {
  await assertStaff();
  const id = String(formData.get("id") ?? "");
  const res = await resetDemoEnvironment(id);
  if (!res.ok) throw new Error(res.error);
  revalidatePath(LIST_PATH);
  redirect(`${LIST_PATH}?reset=1`);
}

export async function resetPlatformDemoPasswordAction(formData: FormData) {
  await assertStaff();
  const id = String(formData.get("id") ?? "");
  const res = await resetDemoPassword(id);
  if (!res.ok) throw new Error(res.error);
  revalidatePath(LIST_PATH);
  redirect(`${LIST_PATH}/${id}?password=${encodeURIComponent(res.passwordOnce)}`);
}

export async function disablePlatformDemoAction(formData: FormData) {
  await assertStaff();
  const id = String(formData.get("id") ?? "");
  await setDemoEnvironmentStatus(id, "DISABLED");
  revalidatePath(LIST_PATH);
}

export async function enablePlatformDemoAction(formData: FormData) {
  await assertStaff();
  const id = String(formData.get("id") ?? "");
  await setDemoEnvironmentStatus(id, "ACTIVE");
  revalidatePath(LIST_PATH);
}

export async function extendPlatformDemoAction(formData: FormData) {
  await assertStaff();
  const id = String(formData.get("id") ?? "");
  const days = Number(formData.get("days") ?? "7");
  await extendDemoEnvironment(id, Number.isFinite(days) ? days : 7);
  revalidatePath(LIST_PATH);
}

export async function duplicatePlatformDemoAction(formData: FormData) {
  const session = await assertStaff();
  const id = String(formData.get("id") ?? "");
  const companyName = String(formData.get("companyName") ?? "").trim();
  if (!companyName) {
    redirect(`${LIST_PATH}?error=duplicate_name`);
  }
  const res = await duplicateDemoEnvironment(id, {
    companyName,
    createdById: session.user.id,
  });
  if (!res.ok) {
    redirect(`${LIST_PATH}?error=${encodeURIComponent(res.error)}`);
  }
  revalidatePath(LIST_PATH);
  redirect(
    `${LIST_PATH}/${res.demoId}?created=1&login=${encodeURIComponent(res.loginIdentifier)}&password=${encodeURIComponent(res.passwordOnce)}`,
  );
}

export async function deletePlatformDemoAction(formData: FormData) {
  await assertStaff();
  const id = String(formData.get("id") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (confirm !== "SUPPRIMER") {
    redirect(`${LIST_PATH}/${id}?error=confirm`);
  }
  const res = await deleteDemoEnvironment(id);
  if (!res.ok) throw new Error(res.error);
  revalidatePath(LIST_PATH);
  redirect(`${LIST_PATH}?deleted=1`);
}
