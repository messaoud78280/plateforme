import { NextResponse } from "next/server";
import {
  canAccessDashboardApi,
  canAccessDashboardHref,
} from "@/lib/equipe-acces/dashboard-policy";

export type ApiPersonaUser = {
  personType?: string | null;
  permissionProfile?: string | null;
};

/** 403 JSON si le persona n’a pas le domaine dashboard. */
export function forbiddenUnlessDashboardHref(
  user: ApiPersonaUser | null | undefined,
  href: string,
): NextResponse | null {
  if (!canAccessDashboardHref(href, user?.personType, user?.permissionProfile)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  return null;
}

/** 403 JSON si le chemin API est mappé et interdit au persona. */
export function forbiddenUnlessApiPersona(
  user: ApiPersonaUser | null | undefined,
  apiPath: string,
): NextResponse | null {
  if (!canAccessDashboardApi(apiPath, user?.personType, user?.permissionProfile)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  return null;
}
