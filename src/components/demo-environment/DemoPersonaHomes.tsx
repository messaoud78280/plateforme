import Link from "next/link";
import type { DemoPersonaKey } from "@/lib/demo-environment/personas";

type ProjectCard = {
  id: string;
  title: string;
  chantierStatus: string | null;
  siteCity: string | null;
};

type AgendaItem = { id: string; title: string; startAt: Date; location?: string | null };
type OrderItem = {
  id: string;
  title: string;
  status: string;
  description?: string | null;
  /** Champs PurchaseOrder (CDE-2A) */
  number?: string;
  subject?: string;
  projectTitle?: string | null;
  hostCompany?: string | null;
  requestedDeliveryAt?: string | Date | null;
  lineSummary?: string | null;
};

const STATUS: Record<string, string> = {
  ETUDE: "Étude",
  EN_COURS: "En cours",
  EN_ATTENTE: "En attente",
  RECEPTION: "Réception",
  TERMINE: "Terminé",
  EN_ATTENTE_INFO: "À confirmer",
  A_VALIDER: "À valider",
  COMPLETE: "Livré",
};

export function DemoHostBadge({ companyName }: { companyName: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#1e3a5f]">{companyName}</p>
      <p className="text-slate-600">Espace collaboratif · Propulsé par BeWork</p>
    </div>
  );
}

export function DemoClientHome({
  firstName,
  hostCompany,
  projects,
  agenda,
  docs,
  pendingTasks,
}: {
  firstName: string;
  hostCompany: string;
  projects: ProjectCard[];
  agenda: AgendaItem[];
  docs: { id: string; name: string }[];
  pendingTasks: OrderItem[];
}) {
  return (
    <div className="space-y-6">
      <DemoHostBadge companyName={hostCompany} />
      <div>
        <h1 className="text-2xl font-extrabold text-[#1e3a5f]">Bonjour {firstName}</h1>
        <p className="mt-1 text-sm text-slate-600">
          Ce que {hostCompany} partage avec vous — dates, documents et messages.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Vos opérations</h2>
        <ul className="mt-4 space-y-4">
          {projects.map((p) => (
            <li key={p.id} className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
              <Link href={`/dashboard/projets/${p.id}`} className="block">
                <p className="font-semibold text-slate-900">{p.title}</p>
                <p className="mt-1 text-sm text-slate-600">
                  Statut : {STATUS[p.chantierStatus ?? ""] ?? "En cours"}
                </p>
                <p className="mt-1 text-xs text-[#1d4ed8]">Voir le détail →</p>
              </Link>
            </li>
          ))}
          {projects.length === 0 ? (
            <li className="text-sm text-slate-500">Aucune opération partagée pour le moment.</li>
          ) : null}
        </ul>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
            Prochains rendez-vous
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            {agenda.slice(0, 3).map((a) => (
              <li key={a.id}>
                <span className="font-medium text-slate-800">
                  {a.startAt.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                  {" — "}
                  {a.startAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                </span>
                <span className="block text-slate-600">{a.title}</span>
              </li>
            ))}
            {agenda.length === 0 ? <li className="text-slate-500">Aucun RDV partagé</li> : null}
          </ul>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
            Documents / demandes
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            {docs.slice(0, 3).map((d) => (
              <li key={d.id} className="text-slate-700">
                · {d.name}
              </li>
            ))}
            {pendingTasks.slice(0, 2).map((t) => (
              <li key={t.id}>
                <Link href={`/dashboard/taches/${t.id}`} className="text-[#1d4ed8] hover:underline">
                  {t.title} — {STATUS[t.status] ?? t.status}
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/dashboard/messagerie" className="mt-3 inline-block text-sm font-semibold text-[#1d4ed8]">
            Messages →
          </Link>
        </div>
      </section>
    </div>
  );
}

export function DemoFournisseurHome({
  firstName,
  hostCompany,
  orders,
  unreadHint,
}: {
  firstName: string;
  hostCompany: string;
  orders: OrderItem[];
  unreadHint?: number;
}) {
  const toConfirm = orders.filter((o) =>
    ["A_CONFIRMER", "ENVOYEE_FOURNISSEUR", "EN_ATTENTE_INFO", "A_VALIDER"].includes(o.status),
  );
  const upcoming = orders.filter(
    (o) =>
      ["CONFIRMEE", "LIVRAISON_PROGRAMMEE"].includes(o.status) && o.requestedDeliveryAt,
  );

  return (
    <div className="space-y-6">
      <DemoHostBadge companyName={hostCompany} />
      <div>
        <h1 className="text-2xl font-extrabold text-[#1e3a5f]">Bonjour {firstName}</h1>
        <p className="mt-1 text-sm text-slate-600">Commandes et livraisons avec {hostCompany}.</p>
      </div>

      <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
        <h2 className="text-sm font-bold uppercase tracking-wide text-amber-900">
          À confirmer
          {toConfirm.length > 0 ? (
            <span className="ml-2 font-semibold normal-case text-amber-800">
              · {toConfirm.length} commande{toConfirm.length > 1 ? "s" : ""}
            </span>
          ) : null}
        </h2>
        {toConfirm.length === 0 ? (
          <p className="mt-3 text-sm text-amber-900/80">Aucune commande en attente.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {toConfirm.map((o) => (
              <li key={o.id} className="rounded-xl border border-amber-200 bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  {o.number || o.title}
                </p>
                <p className="mt-1 font-semibold text-slate-900">
                  {o.hostCompany || hostCompany}
                </p>
                {o.projectTitle ? (
                  <p className="text-sm text-slate-700">{o.projectTitle}</p>
                ) : null}
                <p className="mt-1 text-sm text-slate-600">
                  {o.lineSummary || o.subject || o.description || o.title}
                </p>
                {o.requestedDeliveryAt ? (
                  <p className="mt-2 text-xs font-semibold text-slate-800">
                    Livraison demandée :{" "}
                    {new Date(o.requestedDeliveryAt).toLocaleString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                ) : null}
                <div className="mt-3">
                  <Link
                    href={`/dashboard/commandes/${o.id}`}
                    className="rounded-lg bg-[#1d4ed8] px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    Voir la commande
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
          Prochaines livraisons
        </h2>
        {upcoming.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">Aucune livraison confirmée pour l’instant.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {upcoming.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/dashboard/commandes/${o.id}`}
                  className="font-semibold text-[#1d4ed8] hover:underline"
                >
                  {o.number || o.title}
                </Link>
                {o.requestedDeliveryAt
                  ? ` — ${new Date(o.requestedDeliveryAt).toLocaleString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}`
                  : ""}
              </li>
            ))}
          </ul>
        )}
        <Link
          href="/dashboard/livraisons"
          className="mt-3 inline-block text-sm font-semibold text-[#1d4ed8]"
        >
          Toutes les livraisons →
        </Link>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Messages</h2>
        <p className="mt-2 text-sm text-slate-600">
          {unreadHint && unreadHint > 0
            ? `${unreadHint} nouveau(x) message(s) — ${hostCompany}`
            : `Échanges avec ${hostCompany}`}
        </p>
        <Link
          href="/dashboard/messagerie?view=chantiers&channel=FOURNISSEUR"
          className="mt-2 inline-block text-sm font-semibold text-[#1d4ed8]"
        >
          Ouvrir la messagerie →
        </Link>
      </section>
    </div>
  );
}

export function resolveDemoPersonaKey(
  permissionProfile: string | null | undefined,
  personType: string | null | undefined
): DemoPersonaKey {
  if (permissionProfile === "FOURNISSEUR" || personType === "SUPPLIER") return "fournisseur";
  if (permissionProfile === "CLIENT" || personType === "CLIENT_EXT") return "client";
  if (permissionProfile === "CONDUCTEUR" || permissionProfile === "CHEF_CHANTIER") return "conducteur";
  return "direction";
}
