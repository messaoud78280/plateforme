"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { SUBSCRIPTION_PLANS, getPlan, type PlanKey } from "@/lib/subscription-plans";

type Props = {
  initialPlanKey: string;
  planName: string;
  priceLabel: string;
  billing: "one_shot" | "monthly";
  actionsLabel: string;
  actionsIncluded: number;
};

export function SouscrireClient({
  initialPlanKey,
  planName,
  priceLabel,
  billing,
  actionsLabel,
  actionsIncluded,
}: Props) {
  const [planKey, setPlanKey] = useState<string>(initialPlanKey);
  const [step, setStep] = useState<"recap" | "payment" | "success">("recap");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [contractAccepted, setContractAccepted] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/subscription/me")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.contractStatus === "SIGNED") setContractAccepted(true);
      })
      .catch(() => {});
  }, []);

  const plan = getPlan(planKey) ?? getPlan(initialPlanKey);
  const effectivePlan = plan ?? {
    name: planName,
    priceLabel,
    billing,
    actionsLabel,
    actionsIncluded,
    planKey: initialPlanKey,
  };

  const handleContinueToPayment = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/subscription/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planKey }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.requireContract) {
          setContractAccepted(false);
          setError("Vous devez accepter le contrat avant de payer.");
        } else {
          setError(data.error ?? "Erreur lors de la préparation du paiement.");
        }
        setLoading(false);
        return;
      }
      setPaymentId(data.paymentId);
      setContractAccepted(true);
      setStep("payment");
    } catch {
      setError("Erreur réseau.");
    }
    setLoading(false);
  };

  const handleConfirmPayment = async () => {
    if (!paymentId) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/payment/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erreur lors de la confirmation du paiement.");
        setLoading(false);
        return;
      }
      setStep("success");
    } catch {
      setError("Erreur réseau.");
    }
    setLoading(false);
  };

  if (step === "success") {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800">Paiement effectué</h2>
        <p className="mt-2 text-slate-600">
          Vos actions ont été créditées sur votre compte. Vous pouvez les utiliser dès maintenant.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/dashboard"
            className="rounded-lg bg-[#1d4ed8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1e40af]"
          >
            Aller au tableau de bord
          </Link>
          <Link
            href="/dashboard/abonnement"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Voir mon abonnement
          </Link>
        </div>
      </div>
    );
  }

  const modalite =
    effectivePlan.billing === "one_shot"
      ? "Achat unique (pas de renouvellement)"
      : "Abonnement mensuel";

  return (
    <div className="space-y-6">
      {/* Sélecteur de formule */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Changer de formule</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(["DECOUVERTE", "STANDARD", "STANDARD_PLUS", "PREMIUM"] as PlanKey[]).map((key) => {
            const p = SUBSCRIPTION_PLANS[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => setPlanKey(key)}
                className={`rounded-xl border-2 p-3 text-left text-sm transition ${
                  planKey === key
                    ? "border-[#1d4ed8] bg-[#eff6ff] text-slate-900"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                }`}
              >
                <span className="font-medium">{p.name}</span>
                <span className="mt-1 block text-xs text-slate-500">
                  {p.priceLabel}€ · {p.actionsLabel}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Récapitulatif */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800">Récapitulatif</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">Formule choisie</dt>
            <dd className="font-medium text-slate-800">{effectivePlan.name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Prix</dt>
            <dd className="font-medium text-slate-800">
              {effectivePlan.priceLabel}€
              {effectivePlan.billing === "monthly" && " / mois"}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Actions créditées</dt>
            <dd className="font-medium text-slate-800">{effectivePlan.actionsLabel}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Modalité</dt>
            <dd className="font-medium text-slate-800">{modalite}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Date de début</dt>
            <dd className="font-medium text-slate-800">
              {new Date().toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </dd>
          </div>
        </dl>

        {/* Contrat */}
        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-sm font-semibold text-slate-700">Contrat</h3>
          {contractAccepted === false ? (
            <>
              <p className="mt-1 text-sm text-amber-700">
                Vous devez accepter le contrat avant de continuer vers le paiement.
              </p>
              <Link
                href={"/contract"}
                className="mt-2 inline-block rounded-lg bg-[#1d4ed8] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#1e40af]"
              >
                Accepter le contrat
              </Link>
            </>
          ) : contractAccepted === true ? (
            <p className="mt-1 text-sm text-slate-600">Contrat déjà accepté.</p>
          ) : (
            <p className="mt-1 text-sm text-slate-600">
              En continuant, vous confirmez avoir lu et accepté le contrat. Si vous ne l&apos;avez pas
              encore signé, vous serez invité à le faire avant le paiement.
            </p>
          )}
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {step === "recap" && (
          <button
            type="button"
            onClick={handleContinueToPayment}
            disabled={loading}
            className="mt-6 w-full rounded-lg bg-[#1d4ed8] py-3 text-sm font-semibold text-white hover:bg-[#1e40af] disabled:opacity-50"
          >
            {loading ? "Chargement…" : "Continuer vers le paiement"}
          </button>
        )}

        {step === "payment" && paymentId && (
          <div className="mt-6">
            <p className="text-sm text-slate-600">
              Montant à régler : <strong>{effectivePlan.priceLabel}€</strong>
            </p>
            <p className="mt-2 text-xs text-slate-500">
              En environnement de démonstration, utilisez le bouton ci-dessous pour simuler un
              paiement réussi. En production, une intégration Stripe remplacera cette étape.
            </p>
            <button
              type="button"
              onClick={handleConfirmPayment}
              disabled={loading}
              className="mt-4 w-full rounded-lg bg-[#16a34a] py-3 text-sm font-semibold text-white hover:bg-[#15803d] disabled:opacity-50"
            >
              {loading ? "Traitement…" : "Simuler le paiement"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
