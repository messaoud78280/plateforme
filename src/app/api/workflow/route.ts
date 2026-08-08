import { NextResponse } from "next/server";
import { requireEquipeAdmin } from "@/lib/equipe-acces/admin";
import { duplicateWorkflow, listWorkflows } from "@/lib/workflow/service";

/** GET — liste des processus métier de l’entreprise (crée le défaut si absent). */
export async function GET() {
  const gate = await requireEquipeAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  const workflows = await listWorkflows(gate.ctx.organizationId);
  return NextResponse.json({ workflows });
}

/** POST — dupliquer un workflow { workflowId, name } */
export async function POST(request: Request) {
  const gate = await requireEquipeAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  const body = await request.json().catch(() => ({}));
  const workflowId = typeof body.workflowId === "string" ? body.workflowId : "";
  const name =
    typeof body.name === "string" && body.name.trim()
      ? body.name.trim()
      : "Processus copié";
  if (!workflowId) {
    return NextResponse.json({ error: "workflowId requis" }, { status: 400 });
  }
  const created = await duplicateWorkflow(workflowId, gate.ctx.organizationId, name);
  if (!created) {
    return NextResponse.json({ error: "Workflow introuvable" }, { status: 404 });
  }
  return NextResponse.json({ workflow: created });
}
