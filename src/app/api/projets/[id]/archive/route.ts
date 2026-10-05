import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  archiveProject,
  assessProjectArchive,
  hardDeleteProject,
  restoreProject,
} from "@/lib/chantier/project-archive";

type Action = "archive" | "restore" | "hard-delete" | "assess";

/**
 * POST /api/projets/[id]/archive
 * body: { action: "archive" | "restore" | "hard-delete" | "assess", confirmation?: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as {
    action?: Action;
    confirmation?: string;
  };
  const action = body.action ?? "archive";
  const user = { id: session.user.id, role: session.user.role };

  if (action === "assess") {
    const result = await assessProjectArchive({ projectId: id, user });
    if (!result.ok) {
      const status =
        result.code === "NOT_FOUND" ? 404 : result.code === "FORBIDDEN" ? 403 : 400;
      return NextResponse.json({ error: result.error, code: result.code }, { status });
    }
    return NextResponse.json({ ok: true, assessment: result.assessment });
  }

  if (action === "archive") {
    const result = await archiveProject({ projectId: id, user });
    if (!result.ok) {
      const status =
        result.code === "NOT_FOUND" ? 404 : result.code === "FORBIDDEN" ? 403 : 400;
      return NextResponse.json({ error: result.error, code: result.code }, { status });
    }
    return NextResponse.json(result);
  }

  if (action === "restore") {
    const result = await restoreProject({ projectId: id, user });
    if (!result.ok) {
      const status =
        result.code === "NOT_FOUND" ? 404 : result.code === "FORBIDDEN" ? 403 : 400;
      return NextResponse.json({ error: result.error, code: result.code }, { status });
    }
    return NextResponse.json(result);
  }

  if (action === "hard-delete") {
    const result = await hardDeleteProject({
      projectId: id,
      user,
      confirmation: body.confirmation ?? "",
    });
    if (!result.ok) {
      const status =
        result.code === "NOT_FOUND"
          ? 404
          : result.code === "FORBIDDEN"
            ? 403
            : result.code === "COMMERCIAL_LOCK"
              ? 409
              : 400;
      return NextResponse.json({ error: result.error, code: result.code }, { status });
    }
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: "Action invalide." }, { status: 400 });
}
