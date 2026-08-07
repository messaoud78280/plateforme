import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BackLink } from "@/components/ui/BackLink";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { requireDemoStaffSession } from "@/lib/demo-pilotage/access";
import { prisma } from "@/lib/prisma";
import {
  DEMO_MODULE_LABELS,
  DEMO_TEMPLATES,
  isDemoTemplateKey,
  type DemoModuleKey,
} from "@/lib/demo-environment/constants";
import {
  deletePlatformDemoAction,
  disablePlatformDemoAction,
  duplicatePlatformDemoAction,
  enablePlatformDemoAction,
  extendPlatformDemoAction,
  resetPlatformDemoAction,
  resetPlatformDemoPasswordAction,
} from "@/app/dashboard/demonstrations/plateformes/actions";

export const dynamic = "force-dynamic";

export default async function PlatformDemoDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireDemoStaffSession();
  if ((session.user as { isDemo?: boolean }).isDemo) redirect("/dashboard");

  const { id } = await params;
  const sp = await searchParams;
  const demo = await prisma.demoEnvironment.findUnique({
    where: { id },
    include: { createdBy: { select: { name: true } } },
  });
  if (!demo) notFound();

  const modules = Array.isArray(demo.modulesEnabled) ? (demo.modulesEnabled as string[]) : [];
  const templateLabel = isDemoTemplateKey(demo.templateKey)
    ? DEMO_TEMPLATES[demo.templateKey].label
    : demo.templateKey;

  const passwordOnce = typeof sp.password === "string" ? sp.password : null;
  const created = sp.created === "1";

  return (
    <div className="space-y-6">
      <BackLink href="/dashboard/demonstrations/plateformes">Plateformes démo</BackLink>
      <PageHeader
        eyebrow="Démonstration"
        title={demo.companyName}
        description={demo.internalName}
        actions={
          <Badge tone={demo.status === "ACTIVE" ? "ok" : "critical"}>{demo.status}</Badge>
        }
      />

      {passwordOnce ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p className="font-semibold">{created ? "Démonstration créée" : "Mot de passe réinitialisé"}</p>
          <p className="mt-1 font-mono break-all">Identifiant : {demo.loginIdentifier}</p>
          <p className="font-mono break-all">Mot de passe : {passwordOnce}</p>
          <p className="mt-2 text-xs">Affiché une seule fois — notez-le maintenant.</p>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <dl className="rounded-2xl border border-slate-200 bg-white p-5 text-sm shadow-sm space-y-3">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-bework-muted">Métier</dt>
            <dd>{demo.sector ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-bework-muted">Template</dt>
            <dd>{templateLabel}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-bework-muted">Identifiant</dt>
            <dd className="font-mono">{demo.loginIdentifier}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-bework-muted">Expiration</dt>
            <dd>
              {demo.expiresAt.toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-bework-muted">Créée par</dt>
            <dd>{demo.createdBy?.name ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-bework-muted">Connexion</dt>
            <dd>
              <Link href="/connexion/demo" className="font-semibold text-[#1d4ed8] hover:underline">
                /connexion/demo
              </Link>
            </dd>
          </div>
        </dl>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-bework-ink">Modules</h3>
          <ul className="mt-3 flex flex-wrap gap-2">
            {modules.map((m) => (
              <li key={m}>
                <Badge tone="neutral">
                  {DEMO_MODULE_LABELS[m as DemoModuleKey] ?? m}
                </Badge>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <form action={resetPlatformDemoAction}>
          <input type="hidden" name="id" value={demo.id} />
          <button type="submit" className="btn-cc-secondary">
            Réinitialiser les données
          </button>
        </form>
        <form action={resetPlatformDemoPasswordAction}>
          <input type="hidden" name="id" value={demo.id} />
          <button type="submit" className="btn-cc-secondary">
            Réinitialiser le mot de passe
          </button>
        </form>
        <form action={extendPlatformDemoAction} className="flex items-center gap-2">
          <input type="hidden" name="id" value={demo.id} />
          <input type="hidden" name="days" value="7" />
          <button type="submit" className="btn-cc-secondary">
            Prolonger +7 jours
          </button>
        </form>
        {demo.status === "ACTIVE" ? (
          <form action={disablePlatformDemoAction}>
            <input type="hidden" name="id" value={demo.id} />
            <button type="submit" className="btn-cc-secondary">
              Désactiver
            </button>
          </form>
        ) : (
          <form action={enablePlatformDemoAction}>
            <input type="hidden" name="id" value={demo.id} />
            <button type="submit" className="btn-cc-secondary">
              Réactiver
            </button>
          </form>
        )}
      </div>

      <form
        action={duplicatePlatformDemoAction}
        className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <input type="hidden" name="id" value={demo.id} />
        <label className="block text-sm">
          <span className="mb-1 block font-semibold">Dupliquer vers</span>
          <input
            name="companyName"
            required
            className="rounded-lg border border-slate-200 px-3 py-2"
            placeholder="Dupont Étanchéité"
          />
        </label>
        <button type="submit" className="btn-cc-primary">
          Dupliquer cette démonstration
        </button>
      </form>

      <form
        action={deletePlatformDemoAction}
        className="rounded-2xl border border-red-200 bg-red-50/50 p-5"
      >
        <input type="hidden" name="id" value={demo.id} />
        <h3 className="text-sm font-bold text-red-900">Supprimer définitivement</h3>
        <p className="mt-1 text-xs text-red-800">
          Tapez SUPPRIMER pour confirmer. Cette action efface le tenant démo et ses données fictives.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <input
            name="confirm"
            className="rounded-lg border border-red-200 px-3 py-2 text-sm"
            placeholder="SUPPRIMER"
            required
          />
          <button type="submit" className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white">
            Supprimer
          </button>
        </div>
      </form>
    </div>
  );
}
