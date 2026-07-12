"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  mapSessionRoleToOnboarding,
  onboardingStorageKey,
  ROLE_ONBOARDING,
  type OnboardingRole,
} from "@/lib/onboarding/role-onboarding";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

export function RoleOnboarding({
  userId,
  role,
  preferConducteur,
  forceOpen,
  onCloseForced,
}: {
  userId: string;
  role: string | null | undefined;
  preferConducteur?: boolean;
  forceOpen?: boolean;
  onCloseForced?: () => void;
}) {
  const onboardingRole = mapSessionRoleToOnboarding(role, { preferConducteur });
  const pack = ROLE_ONBOARDING[onboardingRole];
  const storageKey = onboardingStorageKey(userId, onboardingRole);

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!isFeatureEnabled("roleOnboarding")) return;
    if (forceOpen) {
      setOpen(true);
      setStep(0);
      return;
    }
    try {
      if (localStorage.getItem(storageKey) === "done") return;
      setOpen(true);
    } catch {
      setOpen(true);
    }
  }, [storageKey, forceOpen]);

  function finish(markDone: boolean) {
    if (markDone) {
      try {
        localStorage.setItem(storageKey, "done");
      } catch {
        /* ignore */
      }
    }
    setOpen(false);
    onCloseForced?.();
  }

  if (!isFeatureEnabled("roleOnboarding") && !forceOpen) return null;

  const current = pack.steps[step];
  const isLast = step >= pack.steps.length - 1;

  return (
    <Modal
      open={open}
      onClose={() => finish(false)}
      title={`Bienvenue — ${pack.label}`}
      description="Parcours court (moins de 5 minutes). Vous pouvez ignorer et le relancer depuis l’aide."
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button type="button" variant="ghost" onClick={() => finish(true)}>
            Ignorer
          </Button>
          <div className="flex gap-2">
            {step > 0 ? (
              <Button type="button" variant="secondary" onClick={() => setStep((s) => s - 1)}>
                Précédent
              </Button>
            ) : null}
            {isLast ? (
              <Button type="button" onClick={() => finish(true)}>
                Terminer
              </Button>
            ) : (
              <Button type="button" onClick={() => setStep((s) => s + 1)}>
                Suivant
              </Button>
            )}
          </div>
        </div>
      }
    >
      <p className="text-[10px] font-bold uppercase tracking-wider text-bework-muted">
        Étape {step + 1} / {pack.steps.length}
      </p>
      <h3 className="font-heading mt-2 text-lg font-bold text-bework-ink">{current?.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-bework-muted">{current?.body}</p>
      {current?.href ? (
        <Link href={current.href} className="btn-cc-secondary mt-4 inline-flex" onClick={() => finish(false)}>
          Ouvrir cette rubrique
        </Link>
      ) : null}
    </Modal>
  );
}

/** Bouton pour relancer l’onboarding depuis l’aide / paramètres. */
export function RestartOnboardingButton({
  userId,
  role,
}: {
  userId: string;
  role: string | null | undefined;
}) {
  const [force, setForce] = useState(false);
  const onboardingRole = mapSessionRoleToOnboarding(role);

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => {
          try {
            localStorage.removeItem(onboardingStorageKey(userId, onboardingRole));
          } catch {
            /* ignore */
          }
          setForce(true);
        }}
      >
        Relancer le guide
      </Button>
      {force ? (
        <RoleOnboarding
          userId={userId}
          role={role}
          forceOpen
          onCloseForced={() => setForce(false)}
        />
      ) : null}
    </>
  );
}

export type { OnboardingRole };
