import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccessBeWorkSkills } from "@/lib/be-work-skills-access";
import { searchOppbtpKnowledge } from "@/lib/skills/ppsps-oppbtp-search";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !canAccessBeWorkSkills(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const q = request.nextUrl.searchParams.get("q") ?? "";
  const tasksParam = request.nextUrl.searchParams.get("tasks") ?? "";
  const taskIds = tasksParam ? tasksParam.split(",").filter(Boolean) : [];

  const results = searchOppbtpKnowledge({ query: q, taskIds, limit: 12 });

  return NextResponse.json({
    results: results.map(({ score, ...entry }) => ({ ...entry, relevance: score })),
  });
}
