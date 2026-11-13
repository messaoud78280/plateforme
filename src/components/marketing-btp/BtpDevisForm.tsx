"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import {
  BTP_MISSION_DURATION_OPTIONS,
  BTP_MISSION_PHASE_OPTIONS,
  BTP_OPERATION_TYPE_OPTIONS,
  BTP_SERVICE_NEED_OPTIONS,
  isBtpServiceNeedId,
  labelBtpServiceNeed,
} from "@/lib/bework-btp-services";

type Status = "idle" | "loading" | "success" | "error";

export function BtpDevisForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const presetBesoin = searchParams.get("besoin") ?? "";
  const initialNeed = isBtpServiceNeedId(presetBesoin)
    ? presetBesoin
    : "conducteur_travaux";

  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);
  const [mainNeed, setMainNeed] = useState(initialNeed);

  const needLabel = useMemo(() => labelBtpServiceNeed(mainNeed), [mainNeed]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setError(null);
    setReference(null);

    const form = e.currentTarget;
    const data = new FormData(form);

    const contactName = String(data.get("contactName") ?? "").trim();
    const companyName = String(data.get("companyName") ?? "").trim();
    const functionTitle = String(data.get("functionTitle") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const phone = String(data.get("phone") ?? "").trim();
    const operationType = String(data.get("operationType") ?? "").trim();
    const location = String(data.get("location") ?? "").trim();
    const startDate = String(data.get("startDate") ?? "").trim();
    const duration = String(data.get("duration") ?? "").trim();
    const missionKind = String(data.get("missionKind") ?? "").trim();
    const phase = String(data.get("phase") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();
    const constraints = String(data.get("constraints") ?? "").trim();
    const consent = data.get("consent") === "on";
    const website = String(data.get("website") ?? "").trim();

    const operationLabel =
      BTP_OPERATION_TYPE_OPTIONS.find((o) => o.value === operationType)?.label ||
      operationType ||
      "—";
    const missionLabel =
      BTP_MISSION_DURATION_OPTIONS.find((o) => o.value === missionKind)?.label ||
      missionKind ||
      "—";
    const phaseLabel =
      BTP_MISSION_PHASE_OPTIONS.find((o) => o.value === phase)?.label || phase || "—";

    const composedMessage = [
      `Fonction : ${functionTitle || "—"}`,
      `Nature de l’opération : ${operationLabel}`,
      `Localisation : ${location || "—"}`,
      `Démarrage souhaité : ${startDate || "—"}`,
      `Durée prévisionnelle : ${duration || "—"}`,
      `Type de mission : ${missionLabel}`,
      `Phase actuelle : ${phaseLabel}`,
      "",
      "Description :",
      message || "—",
      "",
      "Contraintes particulières :",
      constraints || "—",
    ].join("\n");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          contactName,
          email,
          phone,
          marketType: "autre",
          tradeActivity: operationType || null,
          mainNeed,
          projectStage: phase || "",
          message: composedMessage,
          consent,
          website,
          source: "btp_devis_form",
          formKind: "btp_devis",
        }),
      });

      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        ok?: boolean;
        id?: string;
      };

      if (!res.ok) {
        setStatus("error");
        setError(json.error || "Impossible d’enregistrer la demande.");
        return;
      }

      setStatus("success");
      setReference(json.id ?? null);
      form.reset();
      setMainNeed(initialNeed);
      router.replace("/demande-de-devis?envoye=1");
    } catch {
      setStatus("error");
      setError("Erreur réseau. Réessayez dans un instant.");
    }
  }

  const fieldClass =
    "mt-1.5 w-full rounded-lg border border-[rgba(20,38,59,0.15)] bg-white px-3 py-2.5 text-base text-[var(--btp-night)] outline-none focus:border-[var(--btp-copper)] focus:ring-2 focus:ring-[rgba(197,155,88,0.25)]";
  const labelClass = "block text-base font-semibold text-[var(--btp-night)]";

  if (status === "success") {
    return (
      <div className="bw-btp-card border-[rgba(5,150,105,0.25)] bg-[rgba(5,150,105,0.05)]">
        <h2 className="text-xl font-bold text-[var(--btp-night)]">Demande enregistrée</h2>
        <p className="mt-3 text-[var(--btp-muted)]">
          Merci. Nous avons bien reçu votre demande
          {needLabel ? ` concernant « ${needLabel} »` : ""}. Nous l’étudierons et
          vous recontacterons.
        </p>
        {reference ? (
          <p className="mt-3 text-base font-medium text-[var(--btp-steel)]">
            Référence : {reference}
          </p>
        ) : null}
        <Link href="/" className="bw-btp-btn bw-btp-btn-primary mt-6">
          Retour à l’accueil
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8" noValidate>
      <fieldset className="space-y-4">
        <legend className="text-lg font-bold text-[var(--btp-night)]">Coordonnées</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="contactName" className={labelClass}>
              Nom et prénom *
            </label>
            <input id="contactName" name="contactName" required className={fieldClass} autoComplete="name" />
          </div>
          <div>
            <label htmlFor="companyName" className={labelClass}>
              Entreprise *
            </label>
            <input id="companyName" name="companyName" required className={fieldClass} autoComplete="organization" />
          </div>
          <div>
            <label htmlFor="functionTitle" className={labelClass}>
              Fonction
            </label>
            <input id="functionTitle" name="functionTitle" className={fieldClass} autoComplete="organization-title" />
          </div>
          <div>
            <label htmlFor="email" className={labelClass}>
              E-mail professionnel *
            </label>
            <input id="email" name="email" type="email" required className={fieldClass} autoComplete="email" />
          </div>
          <div>
            <label htmlFor="phone" className={labelClass}>
              Téléphone
            </label>
            <input id="phone" name="phone" type="tel" className={fieldClass} autoComplete="tel" />
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-lg font-bold text-[var(--btp-night)]">Besoin</legend>
        <div>
          <label htmlFor="mainNeed" className={labelClass}>
            Prestation souhaitée *
          </label>
          <select
            id="mainNeed"
            name="mainNeed"
            required
            className={fieldClass}
            value={mainNeed}
            onChange={(e) => setMainNeed(e.target.value as typeof mainNeed)}
          >
            {BTP_SERVICE_NEED_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="operationType" className={labelClass}>
            Nature de l’opération
          </label>
          <select id="operationType" name="operationType" className={fieldClass} defaultValue="">
            <option value="">À préciser</option>
            {BTP_OPERATION_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-lg font-bold text-[var(--btp-night)]">
          Informations sur le chantier
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="location" className={labelClass}>
              Ville ou localisation
            </label>
            <input id="location" name="location" className={fieldClass} />
          </div>
          <div>
            <label htmlFor="startDate" className={labelClass}>
              Date de démarrage souhaitée
            </label>
            <input id="startDate" name="startDate" className={fieldClass} placeholder="Ex. mars 2026" />
          </div>
          <div>
            <label htmlFor="duration" className={labelClass}>
              Durée prévisionnelle
            </label>
            <input id="duration" name="duration" className={fieldClass} placeholder="Ex. 3 mois" />
          </div>
          <div>
            <label htmlFor="missionKind" className={labelClass}>
              Mission ponctuelle ou suivie
            </label>
            <select id="missionKind" name="missionKind" className={fieldClass} defaultValue="">
              <option value="">À préciser</option>
              {BTP_MISSION_DURATION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="phase" className={labelClass}>
              Phase actuelle
            </label>
            <select id="phase" name="phase" className={fieldClass} defaultValue="">
              <option value="">À préciser</option>
              {BTP_MISSION_PHASE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="message" className={labelClass}>
              Description détaillée *
            </label>
            <textarea
              id="message"
              name="message"
              required
              rows={5}
              className={fieldClass}
              placeholder="Décrivez le chantier, le périmètre et le résultat attendu."
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="constraints" className={labelClass}>
              Contraintes particulières
            </label>
            <textarea
              id="constraints"
              name="constraints"
              rows={3}
              className={fieldClass}
              placeholder="Délais, accès, coactivité, documents disponibles…"
            />
          </div>
        </div>
        <p className="text-xs text-[var(--btp-muted)]">
          Les documents (DCE, plans, CCTP…) pourront être transmis de façon
          sécurisée dans un second temps après premier contact.
        </p>
      </fieldset>

      {/* Honeypot anti-spam */}
      <div className="hidden" aria-hidden>
        <label htmlFor="website">Site web</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="space-y-4">
        <label className="flex items-start gap-3 text-base text-[var(--btp-muted)]">
          <input
            type="checkbox"
            name="consent"
            required
            className="mt-1 h-4 w-4 rounded border-[rgba(20,38,59,0.25)]"
          />
          <span>
            J’accepte que BeWork utilise ces données pour traiter ma demande de
            devis, conformément à la{" "}
            <Link href="/politique-confidentialite" className="underline">
              politique de confidentialité
            </Link>
            . *
          </span>
        </label>

        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-base text-red-700" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={status === "loading"}
          className="bw-btp-btn bw-btp-btn-primary disabled:opacity-60"
        >
          {status === "loading" ? "Envoi en cours…" : "Envoyer ma demande de devis"}
        </button>
      </div>
    </form>
  );
}
