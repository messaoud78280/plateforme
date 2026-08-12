import { NextResponse } from "next/server";
import { requireCommercialApiSession } from "@/lib/commercial/access";
import {
  listRetentionGuarantees,
  releaseRetentionGuarantee,
} from "@/lib/commercial/retention";

export async function GET() {
  const auth = await requireCommercialApiSession();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const retentions = await listRetentionGuarantees(auth.orgId);
  return NextResponse.json({ retentions });
}

export async function POST(req: Request) {
  const auth = await requireCommercialApiSession();
  if (auth.error || !auth.session) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || body.action !== "release" || !body.id) {
    return NextResponse.json(
      { error: 'Action invalide — { action: "release", id }' },
      { status: 400 },
    );
  }
  try {
    const retention = await releaseRetentionGuarantee({
      orgId: auth.orgId,
      userId: auth.session.user.id,
      retentionId: String(body.id),
    });
    return NextResponse.json({ retention });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur libération" },
      { status: 400 },
    );
  }
}
