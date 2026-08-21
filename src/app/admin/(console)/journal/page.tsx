import { prisma } from "@/lib/prisma";

export default async function AdminJournalPage() {
  const events = await prisma.platformAdminAuditEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      action: true,
      context: true,
      createdAt: true,
      organization: { select: { id: true, name: true } },
      actor: { select: { name: true, email: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-bework-navy">Journal admin</h2>
        <p className="mt-1 text-[14px] text-slate-600">
          Actions sensibles (trial, suspension, support). Aucun secret journalisé.
        </p>
      </div>
      <ul className="space-y-2">
        {events.map((e) => (
          <li
            key={e.id}
            className="rounded-2xl border border-bework-navy/10 bg-white px-4 py-3 text-[13px] shadow-sm"
          >
            <p className="font-semibold text-bework-ink">
              {e.createdAt.toLocaleString("fr-FR")} — {e.action}
            </p>
            <p className="mt-0.5 text-slate-600">
              {e.actor.name}
              {e.organization ? ` · ${e.organization.name}` : ""}
            </p>
            {e.context ? (
              <p className="mt-1 text-[12px] text-slate-500">{e.context}</p>
            ) : null}
          </li>
        ))}
      </ul>
      {events.length === 0 ? (
        <p className="text-[14px] text-slate-500">Aucune entrée pour l’instant.</p>
      ) : null}
    </div>
  );
}
