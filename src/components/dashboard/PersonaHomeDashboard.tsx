import Link from "next/link";
import {
  MESSAGE_CHANNEL_LABELS,
  defaultMessageChannelForPerson,
  personaHomeLabel,
  type MessageChannel,
} from "@/lib/equipe-acces/nav-by-persona";
import { PERSON_TYPE_LABELS, type PersonType } from "@/lib/equipe-acces/types";

type ProjectCard = {
  id: string;
  title: string;
  siteCity: string | null;
  chantierStatus: string | null;
};

type Props = {
  userName: string | null;
  personType: string | null;
  permissionProfile: string | null;
  projects: ProjectCard[];
};

const STATUS_LABEL: Record<string, string> = {
  ETUDE: "Étude",
  EN_COURS: "En cours",
  EN_ATTENTE: "En attente",
  RECEPTION: "Réception",
  TERMINE: "Terminé",
};

function quickLinks(
  personType: string | null
): { href: string; label: string; hint: string }[] {
  if (personType === "SUPPLIER") {
    return [
      { href: "/dashboard/commandes", label: "Commandes", hint: "À confirmer" },
      { href: "/dashboard/livraisons", label: "Livraisons", hint: "Vos créneaux uniquement" },
      { href: "/dashboard/messagerie", label: "Messagerie", hint: "Fil fournisseur uniquement" },
    ];
  }
  if (personType === "CLIENT_EXT") {
    return [
      { href: "/dashboard/projets", label: "Chantiers", hint: "Vos chantiers partagés" },
      { href: "/dashboard/documents", label: "Documents", hint: "Pièces à valider / reçues" },
      { href: "/dashboard/messagerie", label: "Messagerie", hint: "Échanges client" },
      { href: "/dashboard/agenda", label: "Agenda", hint: "RDV et échéances" },
    ];
  }
  if (personType === "SUBCONTRACTOR") {
    return [
      { href: "/dashboard/projets", label: "Chantiers", hint: "Vos interventions" },
      { href: "/dashboard/agenda", label: "Agenda", hint: "Planning terrain" },
      { href: "/dashboard/messagerie", label: "Messagerie", hint: "Échanges chantier" },
      { href: "/dashboard/documents", label: "Documents", hint: "Plans et pièces partagés" },
    ];
  }
  return [
    { href: "/dashboard/projets", label: "Chantiers", hint: "Périmètre partagé" },
    { href: "/dashboard/documents", label: "Documents", hint: "Pièces visibles" },
    { href: "/dashboard/messagerie", label: "Messagerie", hint: "Fil partagé" },
    { href: "/dashboard/parametres", label: "Paramètres", hint: "Compte et sécurité" },
  ];
}

export function PersonaHomeDashboard({
  userName,
  personType,
  permissionProfile,
  projects,
}: Props) {
  const title = personaHomeLabel(personType, permissionProfile);
  const typeLabel =
    personType && personType in PERSON_TYPE_LABELS
      ? PERSON_TYPE_LABELS[personType as PersonType]
      : "Partenaire";
  const channel = defaultMessageChannelForPerson(personType) as MessageChannel;
  const links = quickLinks(personType);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium text-slate-500">{typeLabel}</p>
        <h1 className="mt-1 text-2xl font-bold text-[#1e3a5f]">
          {title}
          {userName ? (
            <span className="font-semibold text-slate-600"> — {userName}</span>
          ) : null}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          {personType === "SUPPLIER"
            ? "Vous ne voyez que les commandes partagées avec votre organisation."
            : "Accès limité aux chantiers partagés avec vous."}{" "}
          La messagerie utilise le fil <strong>{MESSAGE_CHANNEL_LABELS[channel]}</strong> — les
          échanges internes de l&apos;entreprise ne vous sont pas visibles.
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-[#1e3a5f]/30 hover:shadow-md"
          >
            <p className="font-semibold text-[#1e3a5f]">{l.label}</p>
            <p className="mt-1 text-xs text-slate-500">{l.hint}</p>
          </Link>
        ))}
      </section>

      {personType === "SUPPLIER" ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50/50 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[#1e3a5f]">Vos commandes</h2>
          <p className="mt-2 text-sm text-slate-600">
            Confirmez une livraison ou proposez un autre créneau — sans accéder aux données internes
            de l&apos;entreprise.
          </p>
          <Link
            href="/dashboard/commandes"
            className="mt-4 inline-flex rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-bold text-white"
          >
            Ouvrir les commandes
          </Link>
        </section>
      ) : (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-[#1e3a5f]">Chantiers partagés</h2>
            <Link href="/dashboard/projets" className="text-sm font-medium text-[#1d4ed8] hover:underline">
              Voir tous
            </Link>
          </div>
          {projects.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">
              Aucun chantier partagé pour le moment. Contactez le conducteur de travaux si un accès
              manque.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100">
              {projects.slice(0, 8).map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/dashboard/projets/${p.id}`}
                    className="flex items-center justify-between gap-3 py-3 hover:bg-slate-50"
                  >
                    <span>
                      <span className="font-medium text-slate-800">{p.title}</span>
                      {p.siteCity ? (
                        <span className="ml-2 text-sm text-slate-400">{p.siteCity}</span>
                      ) : null}
                    </span>
                    <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600">
                      {STATUS_LABEL[p.chantierStatus ?? ""] ?? p.chantierStatus ?? "—"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        <strong>À retenir :</strong> ne partagez pas d&apos;informations hors de votre fil. En cas de
        doute sur une pièce ou un accès, demandez une validation au conducteur avant d&apos;engager
        le chantier.
      </div>
    </div>
  );
}
