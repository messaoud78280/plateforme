"use client";

import { useActionState, useMemo, useState } from "react";
import { DEMO_BRAND } from "@/lib/demo-environment/brand";
import {
  DEMO_MODULE_KEYS,
  DEMO_MODULE_LABELS,
  DEMO_SECTORS,
  DEMO_TEMPLATES,
  defaultModulesForTemplate,
  type DemoTemplateKey,
} from "@/lib/demo-environment/constants";
import {
  createPlatformDemoAction,
  type CreateDemoActionState,
} from "@/app/dashboard/demonstrations/plateformes/actions";
import { CopyCredentialsPanel } from "@/components/demo-environment/CopyCredentialsPanel";

const initial: CreateDemoActionState = {};

export function CreatePlatformDemoForm() {
  const [state, formAction, pending] = useActionState(createPlatformDemoAction, initial);
  const [templateKey, setTemplateKey] = useState<DemoTemplateKey>("PME_BTP");
  const defaultMods = useMemo(() => new Set(defaultModulesForTemplate(templateKey)), [templateKey]);
  const [modules, setModules] = useState<Set<string>>(() => new Set(defaultModulesForTemplate("PME_BTP")));

  function onTemplateChange(key: DemoTemplateKey) {
    setTemplateKey(key);
    setModules(new Set(defaultModulesForTemplate(key)));
  }

  if (state.ok && state.loginIdentifier && state.passwordOnce) {
    return (
      <CopyCredentialsPanel
        companyName={state.companyName ?? ""}
        loginIdentifier={state.loginIdentifier}
        passwordOnce={state.passwordOnce}
        expiresAt={state.expiresAt}
        demoId={state.demoId}
      />
    );
  }

  return (
    <form action={formAction} className="space-y-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {state.error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {state.error}
        </p>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-base font-bold text-bework-ink">Entreprise</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-semibold">Nom de l’entreprise</span>
            <input
              name="companyName"
              required
              defaultValue={DEMO_BRAND.companyName}
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
              placeholder={DEMO_BRAND.companyName}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-semibold">Nom interne de la démonstration</span>
            <input
              name="internalName"
              defaultValue={`Démo — ${DEMO_BRAND.companyName}`}
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
              placeholder={`Démo — ${DEMO_BRAND.companyName}`}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-semibold">Secteur / corps d’état</span>
            <select name="sector" className="w-full rounded-lg border border-slate-200 px-3 py-2" defaultValue="Étanchéité">
              {DEMO_SECTORS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-semibold">Collaborateurs (approx.)</span>
            <input name="employeeCount" type="number" min={1} className="w-full rounded-lg border border-slate-200 px-3 py-2" placeholder="25" />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block font-semibold">URL logo (optionnel)</span>
            <input
              name="logoUrl"
              type="text"
              defaultValue={DEMO_BRAND.logoPath ?? ""}
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
              placeholder={DEMO_BRAND.logoPath ?? "/brands/…"}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-semibold">Date du rendez-vous</span>
            <input name="meetingAt" type="datetime-local" className="w-full rounded-lg border border-slate-200 px-3 py-2" />
          </label>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-bold text-bework-ink">Durée d’accès</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-semibold">Jours après RDV / création</span>
            <input name="accessDays" type="number" min={1} defaultValue={7} className="w-full rounded-lg border border-slate-200 px-3 py-2" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-semibold">Expiration manuelle (optionnel)</span>
            <input name="expiresAt" type="datetime-local" className="w-full rounded-lg border border-slate-200 px-3 py-2" />
          </label>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-bold text-bework-ink">Identifiants</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-semibold">Identifiant (vide = auto)</span>
            <input name="loginIdentifier" className="w-full rounded-lg border border-slate-200 px-3 py-2" placeholder="setrim" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-semibold">Mot de passe (vide = auto sécurisé)</span>
            <input name="password" type="text" className="w-full rounded-lg border border-slate-200 px-3 py-2" autoComplete="new-password" />
          </label>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-bold text-bework-ink">Profil d’entreprise</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {Object.values(DEMO_TEMPLATES).map((t) => (
            <label
              key={t.key}
              className={`flex cursor-pointer gap-3 rounded-xl border p-4 text-sm transition ${
                templateKey === t.key ? "border-bework-accent bg-bework-navy-soft" : "border-slate-200 bg-white"
              }`}
            >
              <input
                type="radio"
                name="templateKey"
                value={t.key}
                checked={templateKey === t.key}
                onChange={() => onTemplateChange(t.key)}
                className="mt-1"
              />
              <span>
                <span className="block font-semibold text-bework-ink">{t.label}</span>
                <span className="mt-1 block text-xs text-bework-muted">{t.description}</span>
              </span>
            </label>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-bold text-bework-ink">Modules visibles</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {DEMO_MODULE_KEYS.map((key) => (
            <label key={key} className="flex items-center gap-2 rounded-lg border border-slate-100 px-3 py-2 text-sm">
              <input
                type="checkbox"
                name={`module_${key}`}
                checked={modules.has(key)}
                onChange={(e) => {
                  setModules((prev) => {
                    const next = new Set(prev);
                    if (e.target.checked) next.add(key);
                    else next.delete(key);
                    return next;
                  });
                }}
              />
              <span>{DEMO_MODULE_LABELS[key]}</span>
              {defaultMods.has(key) ? null : (
                <span className="text-[10px] uppercase tracking-wide text-bework-muted">option</span>
              )}
            </label>
          ))}
        </div>
      </section>

      <button type="submit" disabled={pending} className="btn-cc-primary disabled:opacity-60">
        {pending ? "Création…" : "Créer l’environnement de démonstration"}
      </button>
    </form>
  );
}
