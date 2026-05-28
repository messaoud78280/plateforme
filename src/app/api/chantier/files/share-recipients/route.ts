import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccessChantierProject } from "@/lib/chantier-dossier/access";
import { listChantierShareRecipients } from "@/lib/chantier-dossier/share-recipients";

/** GET ?projectId= — Liste des destinataires pour transférer un document chantier */
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const projectId = new URL(request.url).searchParams.get("projectId")?.trim() ?? "";
  if (!projectId) {
    return NextResponse.json({ error: "projectId requis" }, { status: 400 });
  }

  const access = await canAccessChantierProject(session.user, projectId);
  if (!access.ok) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const recipients = await listChantierShareRecipients(
    projectId,
    session.user.id,
    session.user.role
  );

  return NextResponse.json({ recipients });
}
