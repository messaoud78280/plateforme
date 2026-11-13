"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import {
  BTP_MISSION_DURATION_OPTIONS,
  BTP_OPERATION_TYPE_OPTIONS,
  BTP_SERVICE_NEED_OPTIONS,
  isBtpServiceNeedId,
  labelBtpServiceNeed,
  type BtpOperationTypeId,
  type BtpServiceNeedId,
} from "@/lib/bework-btp-services";

type Status = "idle" | "loading" | "success" | "error";

const STEP1_NEEDS: BtpServiceNeedId[] = [
  "conducteur_travaux",
  "chef_chantier",
  "direction_travaux",
  "pilotage_tce",
  "audit_redressement",
  "assistance_marches_publics",
  "assistance_marches_prives",
  "etudes_prix",
  "autre",
];

function isOperationTypeId(v: string): v is BtpOperationTypeId {
  return BTP_OPERATION_TYPE_OPTIONS.some((o) => o.value === v);
}

export function BtpDevisForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const presetBesoin = searchParams.get("besoin") ?? "";
  const presetOperation = searchParams.get("operation") ?? "";
  const initialNeed = isBtpServiceNeedId(presetBesoin)
    ? presetBesoin
    : "conducteur_travaux";
  const initialOperation = isOperationTypeId(presetOperation)
    ? presetOperation
    : "";

  const [step, setStep] = useState<1 | 2>(1);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);
  const [mainNeed, setMainNeed] = useState(initialNeed);
  const [operationType, setOperationType] = useState(initialOperation);

  const needLabel = useMemo(() => labelBtpServiceNeed(mainNeed), [mainNeed]);
  const step1Options = BTP_SERVICE_NEED_OPTIONS.filter((o) =>
    STEP1_NEEDS.includes(o.value),
  );

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
      return;
    }

    setStatus("loading");
    setError(null);
    setReference(null);

    const form = e.currentTarget;
    const data = new FormData(form);

    const contactName = String(data.get("contactName") ?? "").trim();
    const companyName = String(data.get("companyName") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const phone = String(data.get("phone") ?? "").trim();
    const location = String(data.get("location") ?? "").trim();
    const startDate = String(data.get("startDate") ?? "").trim();
    const duration = String(data.get("duration") ?? "").trim();
    const missionKind = String(data.get("missionKind") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();
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

    const composedMessage = [
      `Nature de l’opération : ${operationLabel}`,
      `Localisation : ${location || "—"}`,
      `Démarrage souhaité : ${startDate || "—"}`,
      `Durée prévisionnelle : ${duration || "—"}`,
      `Type de mission : ${missionLabel}`,
      "",
      "Description :",
      message || "—",
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
          projectStage: "",
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
      setOperationType(initialOperation);
      setStep(1);
      router.replace("/demande-de-devis?envoye=1");
    } catch {
      setStatus("error");
      setError("Erreur réseau. Réessayez dans un instant.");
    }
  }

  const fieldClass =
    "mt-1.5 w-full rounded-xl border border-[var(--btp-border)] bg-white px-3 py-2.5 text-base text-[var(--btp-heading)] outline-none focus:border-[var(--btp-accent)] focus:ring-2 focus:ring-[rgba(45,106,86,0.2)]";
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
      <div className="flex items-center gap-3 text-sm font-semibold text-[var(--btp-muted)]">
        <span
          className={`rounded-full px-3 py-1 ${
            step === 1
              ? "bg-[var(--btp-ink)] text-white"
              : "bg-[var(--btp-soft)] text-[var(--btp-heading)]"
          }`}
        >
          1. Besoin
        </span>
        <span aria-hidden>→</span>
        <span
          className={`rounded-full px-3 py-1 ${
            step === 2
              ? "bg-[var(--btp-ink)] text-white"
              : "bg-[var(--btp-soft)] text-[var(--btp-heading)]"
          }`}
        >
          2. Opération
        </span>
      </div>

      {step === 1 ? (
        <fieldset className="space-y-4">
          <legend className="text-lg font-bold text-[var(--btp-night)]">
            Quel est votre besoin ?
          </legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {step1Options.map((o) => (
              <label
                key={o.value}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition ${
                  mainNeed === o.value
                    ? "border-[var(--btp-accent)] bg-[rgba(45,106,86,0.08)]"
                    : "border-[var(--btp-border)] bg-white hover:border-[var(--btp-border-strong)]"
                }`}
              >
                <input
                  type="radio"
                  name="mainNeedChoice"
                  className="mt-1"
                  checked={mainNeed === o.value}
                  onChange={() => setMainNeed(o.value)}
                />
                <span className="font-semibold text-[var(--btp-heading)]">{o.label}</span>
              </label>
            ))}
          </div>
          <button type="submit" className="bw-btp-btn bw-btp-btn-primary">
            Continuer
          </button>
        </fieldset>
      ) : (
        <>
          <fieldset className="space-y-4">
            <legend className="text-lg font-bold text-[var(--btp-night)]">
              Décrivez votre opération
            </legend>
            <p className="text-base text-[var(--btp-muted)]">
              Besoin sélectionné :{" "}
              <strong className="text-[var(--btp-heading)]">{needLabel}</strong>
              {" · "}
              <button
                type="button"
                className="font-semibold text-[var(--btp-steel)] underline-offset-2 hover:underline"
                onClick={() => setStep(1)}
              >
                Modifier
              </button>
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="companyName" className={labelClass}>
                  Société *
                </label>
                <input
                  id="companyName"
                  name="companyName"
                  required
                  className={fieldClass}
                  autoComplete="organization"
                />
              </div>
              <div>
                <label htmlFor="contactName" className={labelClass}>
                  Nom et prénom *
                </label>
                <input
                  id="contactName"
                  name="contactName"
                  required
                  className={fieldClass}
                  autoComplete="name"
                />
              </div>
              <div>
                <label htmlFor="phone" className={labelClass}>
                  Téléphone *
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  className={fieldClass}
                  autoComplete="tel"
                />
              </div>
              <div>
                <label htmlFor="email" className={labelClass}>
                  E-mail professionnel *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className={fieldClass}
                  autoComplete="email"
                />
              </div>
              <div>
                <label htmlFor="operationType" className={labelClass}>
                  Type de chantier
                </label>
                <select
                  id="operationType"
                  name="operationType"
                  className={fieldClass}
                  value={operationType}
                  onChange={(e) => setOperationType(e.target.value)}
                >
                  <option value="">À préciser</option>
                  {BTP_OPERATION_TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="location" className={labelClass}>
                  Ville
                </label>
                <input id="location" name="location" className={fieldClass} />
              </div>
              <div>
                <label htmlFor="startDate" className={labelClass}>
                  Date de début souhaitée
                </label>
                <input
                  id="startDate"
                  name="startDate"
                  className={fieldClass}
                  placeholder="Ex. mars 2026"
                />
              </div>
              <div>
                <label htmlFor="duration" className={labelClass}>
                  Durée prévisionnelle
                </label>
                <input
                  id="duration"
                  name="duration"
                  className={fieldClass}
                  placeholder="Ex. 3 mois"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="missionKind" className={labelClass}>
                  Mission ponctuelle ou suivie
                </label>
                <select
                  id="missionKind"
                  name="missionKind"
                  className={fieldClass}
                  defaultValue=""
                >
                  <option value="">À préciser</option>
                  {BTP_MISSION_DURATION_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="message" className={labelClass}>
                  Description du besoin *
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={5}
                  className={fieldClass}
                  placeholder="Chantier, périmètre, contraintes, résultat attendu."
                />
              </div>
            </div>
            <p className="text-xs text-[var(--btp-muted)]">
              Les pièces (DCE, plans…) pourront être transmises de façon
              sécurisée après premier contact — pas d’upload public non sécurisé.
            </p>
          </fieldset>

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
                J’accepte que BeWork utilise ces données pour traiter ma demande
                de devis, conformément à la{" "}
                <Link href="/politique-confidentialite" className="underline">
                  politique de confidentialité
                </Link>
                . *
              </span>
            </label>

            {error ? (
              <p
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-base text-red-700"
                role="alert"
              >
                {error}
              </p>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className="bw-btp-btn bw-btp-btn-secondary-dark"
                onClick={() => setStep(1)}
              >
                Retour
              </button>
              <button
                type="submit"
                disabled={status === "loading"}
                className="bw-btp-btn bw-btp-btn-primary disabled:opacity-60"
              >
                {status === "loading" ? "Envoi en cours…" : "Envoyer ma demande de devis"}
              </button>
            </div>
          </div>
        </>
      )}
    </form>
  );
}
