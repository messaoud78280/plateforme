"use client";

import { useState } from "react";
import Link from "next/link";
import { BEWORK_CC } from "@/lib/design-tokens";
import { Button } from "@/components/ui/Button";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Card, CardHeader } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { KpiTile } from "@/components/ui/KpiTile";
import { Modal } from "@/components/ui/Modal";
import { Drawer } from "@/components/ui/Drawer";
import { Skeleton, TableSkeleton } from "@/components/ui/Skeleton";
import { FilterBar, FilterChip } from "@/components/ui/FilterBar";
import {
  DataTable,
  DataTableBody,
  DataTableHead,
  DataTableRow,
  DataTableTd,
  DataTableTh,
} from "@/components/ui/DataTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { TrustBadge, TrustContextBanner } from "@/components/system/TrustContextBanner";
import { PERFORMANCE_BUDGETS, HEAVY_MODULES_LAZY } from "@/lib/design-system/performance-budgets";
import { DESIGN_SYSTEM_MIGRATION, MIGRATION_STRATEGY } from "@/lib/design-system/migration";
import { VOLUME_TARGETS, VOLUME_UI_RULES, VOLUME_TEST_CHECKLIST } from "@/lib/design-system/volume-guidelines";
import { UX_SCENARIOS, FINAL_VALIDATION_CRITERIA } from "@/lib/design-system/scenarios";
import {
  UX_ACTIONS,
  UX_ACTION_DISTINCTIONS,
  UX_STATUS,
  UX_EMPTY,
  UX_ERRORS,
  UX_AVOID_TERMS,
} from "@/lib/design-system/vocabulary";
import { FEATURE_FLAG_DOCS, isFeatureEnabled } from "@/lib/feature-flags";
import { getEnvironmentIdentity } from "@/lib/environment";

function Section({
  id,
  title,
  usage,
  a11y,
  avoid,
  children,
}: {
  id: string;
  title: string;
  usage: string;
  a11y: string;
  avoid: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="cc-card scroll-mt-24 space-y-4 p-5">
      <div>
        <h2 className="font-heading text-xl font-bold text-bework-ink">{title}</h2>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-wide text-bework-muted">Usage</dt>
            <dd className="mt-0.5 text-bework-ink/90">{usage}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-wide text-bework-muted">Accessibilité</dt>
            <dd className="mt-0.5 text-bework-ink/90">{a11y}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-wide text-bework-muted">À éviter</dt>
            <dd className="mt-0.5 text-bework-critical">{avoid}</dd>
          </div>
        </dl>
      </div>
      {children}
    </section>
  );
}

const NAV = [
  { href: "#tokens", label: "Tokens" },
  { href: "#boutons", label: "Boutons" },
  { href: "#champs", label: "Champs" },
  { href: "#badges", label: "Badges" },
  { href: "#cartes", label: "Cartes" },
  { href: "#tableaux", label: "Tableaux" },
  { href: "#overlays", label: "Overlays" },
  { href: "#etats", label: "États" },
  { href: "#confiance", label: "Confiance" },
  { href: "#gouvernance", label: "Gouvernance" },
] as const;

export function DesignSystemCatalog() {
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const env = getEnvironmentIdentity();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Gouvernance UI"
        title="Design system BeWork Command Center"
        description="Catalogue interne des composants officiels, règles d’usage, migration et critères de validation. Accès staff uniquement."
      />

      <nav className="cc-card flex flex-wrap gap-1.5 p-2" aria-label="Sections du design system">
        {NAV.map((n) => (
          <a key={n.href} href={n.href} className="btn-cc-ghost !px-2.5 !py-1.5 text-xs">
            {n.label}
          </a>
        ))}
      </nav>

      <Section
        id="tokens"
        title="Palette, typo, rayons, ombres"
        usage="Utiliser les tokens --cc-* / utilities bework-*. Source CSS : globals.css."
        a11y="Contraste texte ink sur surface ≥ AA ; ne pas poser muted sur muted."
        avoid="Hex hardcodés (#1e3a5f) hors bridge marketing ; violet décoratif excessif."
      >
        <div className="grid gap-2 sm:grid-cols-4 lg:grid-cols-6">
          {Object.entries(BEWORK_CC).map(([name, hex]) => (
            <div key={name} className="rounded-[var(--cc-radius)] border border-[color:var(--cc-chrome-border)] p-2">
              <div className="h-10 rounded-md" style={{ background: hex }} />
              <p className="mt-1 text-[11px] font-semibold text-bework-ink">{name}</p>
              <p className="font-mono text-[10px] text-bework-muted">{hex}</p>
            </div>
          ))}
        </div>
        <p className="text-sm text-bework-muted">
          Typo : Inter (corps) + Rajdhani (titres <code className="font-mono">font-heading</code>). Espacements :
          échelle Tailwind. Radius : <code className="font-mono">--cc-radius</code> /{" "}
          <code className="font-mono">--cc-radius-lg</code>. Ombres : <code className="font-mono">--cc-shadow</code>.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <KpiTile label="Exemple KPI" value={12} tone="watch" hint="À surveiller" />
          <KpiTile label="OK" value={3} tone="ok" />
          <KpiTile label="Critique" value={1} tone="critical" />
        </div>
      </Section>

      <Section
        id="boutons"
        title="Boutons"
        usage="Une action primaire par zone. Verbes du vocabulaire UX (Créer, Enregistrer, Valider…)."
        a11y="Focus visible ; disabled avec opacity ; pas de bouton sans libellé textuel."
        avoid="Boutons décoratifs, double primaire, icône seule sans aria-label."
      >
        <div className="flex flex-wrap gap-2">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="intel">Intel</Button>
          <Button size="sm">Small</Button>
          <Button disabled>Disabled</Button>
        </div>
      </Section>

      <Section
        id="champs"
        title="Champs, sélecteurs, filtres"
        usage="Input / Select / Textarea pour formulaires ; FilterBar pour listes GET."
        a11y="Label visible ; erreur associée ; pas de placeholder comme seul label."
        avoid="Champs sans label ; filtres uniquement client sur gros volumes."
      >
        <div className="grid max-w-xl gap-3 sm:grid-cols-2">
          <Input label="Désignation" placeholder="ex. Drainage périphérique" />
          <Select label="Statut" defaultValue="">
            <option value="">Tous</option>
            <option value="a_verifier">À vérifier</option>
          </Select>
          <div className="sm:col-span-2">
            <Textarea label="Observations" rows={2} />
          </div>
        </div>
        <FilterBar as="div">
          <FilterChip href="#champs" active>
            Tous
          </FilterChip>
          <FilterChip href="#champs">Urgents</FilterChip>
        </FilterBar>
      </Section>

      <Section
        id="badges"
        title="Badges et statuts"
        usage="Badge / StatusBadge pour états métier. Aligner sur UX_STATUS."
        a11y="Ne pas coder l’info uniquement par la couleur."
        avoid="Plus de 6 tons différents sur une même ligne."
      >
        <div className="flex flex-wrap gap-2">
          <Badge tone="ok">Validé</Badge>
          <Badge tone="watch">À vérifier</Badge>
          <Badge tone="critical">Bloquant</Badge>
          <Badge tone="intel">Analyse IA</Badge>
          <StatusBadge status="En cours" />
          <TrustBadge kind="confidential" />
        </div>
        <ul className="mt-2 grid gap-1 text-xs text-bework-muted sm:grid-cols-2">
          {Object.entries(UX_STATUS).map(([k, v]) => (
            <li key={k}>
              <code className="font-mono">{k}</code> → {v}
            </li>
          ))}
        </ul>
      </Section>

      <Section
        id="cartes"
        title="Cartes et en-têtes"
        usage="Card / PageHeader pour structure de page. Une carte = un job."
        a11y="Titres hiérarchiques h1→h2 ; PageHeader unique par page."
        avoid="Cartes dans le hero marketing ; empilement de cartes sans hiérarchie."
      >
        <Card hover={false}>
          <CardHeader title="Exemple de carte" description="Conteneur d’interaction métier." />
          <p className="text-sm text-bework-muted">Contenu…</p>
        </Card>
      </Section>

      <Section
        id="tableaux"
        title="Tableaux"
        usage="DataTable pour listes dashboard. Pagination serveur dès 50 lignes."
        a11y="En-têtes th ; tri annoncé ; scroll horizontal sur mobile."
        avoid="Tout charger en mémoire (10k documents)."
      >
        <DataTable minWidth="480px">
          <DataTableHead>
            <DataTableTh>Chantier</DataTableTh>
            <DataTableTh>Statut</DataTableTh>
            <DataTableTh align="right">Actions</DataTableTh>
          </DataTableHead>
          <DataTableBody>
            <DataTableRow>
              <DataTableTd>Résidence Horizon</DataTableTd>
              <DataTableTd>
                <Badge tone="watch">À surveiller</Badge>
              </DataTableTd>
              <DataTableTd align="right">
                <button type="button" className="text-xs font-semibold text-bework-navy">
                  Ouvrir
                </button>
              </DataTableTd>
            </DataTableRow>
          </DataTableBody>
        </DataTable>
      </Section>

      <Section
        id="overlays"
        title="Modales et panneaux latéraux"
        usage="Modal pour création courte ; Drawer pour formulaires plus longs (mission)."
        a11y="Escape, focus trap léger, aria-modal, scroll body lock."
        avoid="Deux overlays empilés ; fermeture accidentelle pendant chargement."
      >
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => setModalOpen(true)}>
            Ouvrir Modal
          </Button>
          <Button type="button" variant="secondary" onClick={() => setDrawerOpen(true)}>
            Ouvrir Drawer
          </Button>
        </div>
        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Exemple Modal" description="Usage recommandé création / confirmation.">
          <p className="text-sm text-bework-muted">Contenu de démonstration.</p>
        </Modal>
        <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Exemple Drawer" description="Formulaire latéral.">
          <Input label="Titre" />
        </Drawer>
      </Section>

      <Section
        id="etats"
        title="Alertes, vides, skeletons, erreurs"
        usage="Alert pour messages ; EmptyState pour zéro donnée ; Skeleton pour chargement."
        a11y="role=alert / status ; skeletons avec sr-only « Chargement »."
        avoid="Spinner sans texte ; empty sans prochaine action."
      >
        <div className="space-y-3">
          <Alert tone="info" title="Info">
            Message neutre.
          </Alert>
          <Alert tone="watch" title="Vigilance">
            Point à vérifier avant exécution.
          </Alert>
          <Alert tone="critical" title="Erreur">
            {UX_ERRORS.generic}
          </Alert>
          <EmptyState
            title={UX_EMPTY.generic.title}
            description={UX_EMPTY.generic.description}
            actionHref="/dashboard"
            actionLabel="Tableau de bord"
          />
          <Skeleton className="h-8 w-1/2" />
          <TableSkeleton rows={3} />
        </div>
      </Section>

      <Section
        id="confiance"
        title="Confiance et contexte"
        usage="Toujours identifier chantier, rôle, confidentialité, version, sauvegarde."
        a11y="Bannière role=status ; pas d’info critique uniquement en couleur."
        avoid="Avertissements discrets sur actions irréversibles."
      >
        <div className="space-y-2">
          <TrustContextBanner kind="demo" />
          <TrustContextBanner kind="confidential" detail="Accès limité au lot concerné." />
          <TrustContextBanner kind="unsaved" />
          <TrustContextBanner kind="irreversible" detail="Suppression définitive." />
        </div>
        <p className="text-sm text-bework-muted">
          Environnement actuel résolu : <strong>{env.label}</strong> (bandeau{" "}
          {env.showBanner ? "affiché" : "masqué en production"}).
        </p>
      </Section>

      <Section
        id="pilotage"
        title="Composants Pilotage travaux"
        usage="Conserver pilotage-card (bridge tokens). Cockpit, GED, badges santé métier."
        a11y="Navigation onglets clavier ; badges compteurs aria."
        avoid="Dupliquer une GED hors ChantierFile."
      >
        <p className="text-sm text-bework-muted">
          Voir module{" "}
          <Link href="/dashboard/pilotage-travaux" className="font-semibold text-bework-navy hover:underline">
            Pilotage travaux
          </Link>{" "}
          et démo{" "}
          <Link href="/demo/pilotage-travaux" className="font-semibold text-bework-navy hover:underline">
            /demo/pilotage-travaux
          </Link>
          .
        </p>
      </Section>

      <Section
        id="gouvernance"
        title="Gouvernance (perf, volumes, migration, flags, validation)"
        usage="Référence pour revue produit / tech avant de clore une phase UI."
        a11y="Documentation lisible au clavier (ancres)."
        avoid="Clôturer la refonte sans checklist FINAL_VALIDATION_CRITERIA."
      >
        <h3 className="font-heading text-base font-bold text-bework-ink">Budgets performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-[color:var(--cc-chrome-border)] text-bework-muted">
                <th className="py-2">Métrique</th>
                <th className="py-2">Cible</th>
                <th className="py-2">Alerte</th>
              </tr>
            </thead>
            <tbody>
              {PERFORMANCE_BUDGETS.map((b) => (
                <tr key={b.id} className="border-b border-bework-navy/[0.06]">
                  <td className="py-2 font-medium">{b.label}</td>
                  <td className="py-2">{b.target}</td>
                  <td className="py-2 text-bework-watch">{b.warnAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-bework-muted">Modules lourds à lazy-load : {HEAVY_MODULES_LAZY.join(" · ")}</p>

        <h3 className="font-heading mt-6 text-base font-bold text-bework-ink">Volumes</h3>
        <p className="text-sm text-bework-muted">
          Cibles : {VOLUME_TARGETS.clients} clients · {VOLUME_TARGETS.chantiers} chantiers ·{" "}
          {VOLUME_TARGETS.documents.toLocaleString("fr-FR")} documents · {VOLUME_TARGETS.actions.toLocaleString("fr-FR")}{" "}
          actions.
        </p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-bework-ink/90">
          {VOLUME_UI_RULES.map((r) => (
            <li key={r.surface}>
              <strong>{r.surface}</strong> — {r.rule} ({r.threshold})
            </li>
          ))}
        </ul>

        <h3 className="font-heading mt-6 text-base font-bold text-bework-ink">Migration</h3>
        <ul className="space-y-2 text-sm">
          {DESIGN_SYSTEM_MIGRATION.map((m) => (
            <li key={m.legacy} className="rounded-lg border border-[color:var(--cc-chrome-border)] px-3 py-2">
              <span className="font-semibold">{m.legacy}</span> → {m.replacement}{" "}
              <Badge tone={m.status === "obsolete" ? "watch" : m.status === "keep-bridge" ? "info" : "neutral"}>
                {m.status}
              </Badge>
              <p className="mt-1 text-xs text-bework-muted">{m.guidance}</p>
            </li>
          ))}
        </ul>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-bework-muted">
          {MIGRATION_STRATEGY.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>

        <h3 className="font-heading mt-6 text-base font-bold text-bework-ink">Feature flags</h3>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {FEATURE_FLAG_DOCS.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
        <p className="text-xs text-bework-muted">
          Flags actifs : commandCenter={String(isFeatureEnabled("commandCenterUi"))} · onboarding=
          {String(isFeatureEnabled("roleOnboarding"))} · prefs={String(isFeatureEnabled("uiPreferences"))} · telemetry=
          {String(isFeatureEnabled("uxTelemetry"))}
        </p>

        <h3 className="font-heading mt-6 text-base font-bold text-bework-ink">Vocabulaire (extrait)</h3>
        <p className="text-sm text-bework-muted">
          Actions : {Object.values(UX_ACTIONS).slice(0, 12).join(" · ")}…
        </p>
        <ul className="mt-2 space-y-1 text-sm">
          {Object.entries(UX_ACTION_DISTINCTIONS).map(([k, v]) => (
            <li key={k}>
              <strong>{k}</strong> — {v}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-bework-critical">À éviter : {UX_AVOID_TERMS.join(", ")}</p>

        <h3 className="font-heading mt-6 text-base font-bold text-bework-ink">Scénarios utilisateurs</h3>
        <ul className="space-y-2 text-sm">
          {UX_SCENARIOS.map((s) => (
            <li key={s.id} className="rounded-lg bg-bework-navy-soft/50 px-3 py-2">
              <strong>{s.actor}</strong> — {s.goal}
              <span className="block text-xs text-bework-muted">
                Succès : {s.success} · {s.maxClicksHint}
              </span>
            </li>
          ))}
        </ul>

        <h3 className="font-heading mt-6 text-base font-bold text-bework-ink">Checklist volumes</h3>
        <ul className="list-disc pl-5 text-sm text-bework-muted">
          {VOLUME_TEST_CHECKLIST.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>

        <h3 className="font-heading mt-6 text-base font-bold text-bework-ink">Validation finale</h3>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {FINAL_VALIDATION_CRITERIA.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>

        <h3 className="font-heading mt-6 text-base font-bold text-bework-ink">Télémétrie UX (respectueuse)</h3>
        <p className="text-sm text-bework-muted">
          Flag <code className="font-mono">NEXT_PUBLIC_FF_UX_TELEMETRY</code> (off par défaut). Mesurer uniquement :
          recherches sans résultat, abandons de formulaires, erreurs fréquentes, temps d’ouverture pages — sans données
          métier sensibles.
        </p>

        <h3 className="font-heading mt-6 text-base font-bold text-bework-ink">Contrôle visuel</h3>
        <p className="text-sm text-bework-muted">
          Pages prioritaires : connexion, dashboard, clients, chantiers, missions, documents, Pilotage, espace client,
          prospect, démo — desktop / laptop / tablette / mobile · vide / dense · erreurs / loading.
        </p>
      </Section>
    </div>
  );
}
