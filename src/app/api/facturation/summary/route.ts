import { NextResponse } from "next/server";
import { getCachedServerSession } from "@/lib/auth/cached-session";
import { canAccessFacturation } from "@/lib/facturation/access";
import { forbiddenUnlessDashboardHref } from "@/lib/equipe-acces/assert-api-dashboard-access";
import { getBillingSnapshot } from "@/lib/facturation/snapshot";

export const dynamic = "force-dynamic";

/** Résumé léger Accueil — pas de montants. */
export async function GET() {
  const session = await getCachedServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  if (
    !canAccessFacturation({
      role: session.user.role,
      personType: session.user.personType,
      permissionProfile: session.user.permissionProfile,
    })
  ) {
    return NextResponse.json({ error: "Interdit" }, { status: 403 });
  }
  const personaDeny = forbiddenUnlessDashboardHref(
    session.user,
    "/dashboard/facturation",
  );
  if (personaDeny) return personaDeny;

  const snap = await getBillingSnapshot({
    user: {
      id: session.user.id,
      role: session.user.role,
      personType: session.user.personType ?? null,
    },
  });

  return NextResponse.json({
    attention: snap.totals.attention,
    aFacturer: snap.totals.aFacturer,
    enRetard: snap.totals.enRetard,
    aSurveiller: snap.totals.aSurveiller,
  });
}
