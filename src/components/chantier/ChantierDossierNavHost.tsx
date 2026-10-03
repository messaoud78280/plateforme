"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChantierDossierNav } from "@/components/chantier/ChantierDossierNav";
import { TakeoffCreateFromChatgptModal } from "@/components/chantier/TakeoffCreateFromChatgptModal";
import { QuoteCreateFromChatgptModal } from "@/components/chantier/QuoteCreateFromChatgptModal";
import { PlanningCreateFromChatgptModal } from "@/components/chantier/PlanningCreateFromChatgptModal";
import type {
  DossierNavSnapshot,
  DossierNavStep,
  DossierNavStepId,
  DossierNavVariant,
} from "@/lib/chantier/dossier-nav";

type Props = {
  projectId: string;
  activeStep: DossierNavStepId | null;
  scopeId?: string | null;
  variant?: DossierNavVariant;
  sticky?: boolean;
  /** Snapshot serveur — évite un fetch si déjà disponible. */
  initialSnapshot?: DossierNavSnapshot | null;
  className?: string;
};

export function ChantierDossierNavHost({
  projectId,
  activeStep,
  scopeId = null,
  variant = "compact",
  sticky = true,
  initialSnapshot = null,
  className,
}: Props) {
  const router = useRouter();
  const [snapshot, setSnapshot] = useState<DossierNavSnapshot | null>(
    initialSnapshot,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [takeoffOpen, setTakeoffOpen] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [planningOpen, setPlanningOpen] = useState(false);

  useEffect(() => {
    if (initialSnapshot) {
      setSnapshot(initialSnapshot);
      return;
    }
    let cancelled = false;
    const qs = new URLSearchParams();
    if (activeStep) qs.set("activeStep", activeStep);
    if (scopeId) qs.set("scopeId", scopeId);
    void fetch(`/api/projets/${projectId}/dossier-nav?${qs.toString()}`)
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error ?? "Navigation indisponible");
        if (!cancelled) setSnapshot(data as DossierNavSnapshot);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Erreur");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [projectId, activeStep, scopeId, initialSnapshot]);

  async function onStepAction(step: DossierNavStep) {
    if (step.primaryAction === "prepare_takeoff_chatgpt") {
      setTakeoffOpen(true);
      return;
    }
    if (step.primaryAction === "prepare_quote_chatgpt") {
      setQuoteOpen(true);
      return;
    }
    if (step.primaryAction === "prepare_planning_chatgpt") {
      setPlanningOpen(true);
      return;
    }
    if (step.primaryAction === "create_follow_up") {
      setBusy(true);
      setError(null);
      try {
        const res = await fetch(`/api/projets/${projectId}/planning-suivi`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error ?? "Création suivi impossible");
        router.push(
          data?.href ?? `/dashboard/projets/${projectId}/suivi-planning`,
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur");
      } finally {
        setBusy(false);
      }
      return;
    }
    if (step.primaryAction === "create_compte_rendu") {
      setBusy(true);
      try {
        const res = await fetch(`/api/projets/${projectId}/site-documents`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind: "COMPTE_RENDU",
            title: "Compte rendu de chantier",
          }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error ?? "Création impossible");
        const id = data?.document?.id ?? data?.id;
        router.push(
          id
            ? `/dashboard/projets/${projectId}/documents-chantier/${id}`
            : `/dashboard/projets/${projectId}/documents-chantier`,
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur");
      } finally {
        setBusy(false);
      }
      return;
    }
    if (step.primaryAction === "create_notice") {
      setBusy(true);
      try {
        const res = await fetch(`/api/projets/${projectId}/site-documents`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind: "NOTICE",
            title: "Notice explicative du chantier",
          }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error ?? "Création impossible");
        const id = data?.document?.id ?? data?.id;
        router.push(
          id
            ? `/dashboard/projets/${projectId}/documents-chantier/${id}`
            : `/dashboard/projets/${projectId}/documents-chantier`,
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur");
      } finally {
        setBusy(false);
      }
      return;
    }
    if (step.primaryAction === "create_global_prep") {
      setBusy(true);
      try {
        const res = await fetch(`/api/projets/${projectId}/global-prep`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error ?? "Préparation impossible");
        if (step.id === "planning" && data?.planHref) {
          router.push(data.planHref);
          return;
        }
        if (data?.studyId) {
          router.push(`/dashboard/visites-metres/etudes/${data.studyId}`);
          return;
        }
        if (data?.planHref) {
          router.push(data.planHref);
          return;
        }
        router.push(`/dashboard/projets/${projectId}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur");
      } finally {
        setBusy(false);
      }
      return;
    }
    // Fallback : fiche chantier (pas de 404)
    router.push(`/dashboard/projets/${projectId}`);
  }

  if (!snapshot) {
    return (
      <div
        className={cnSkeleton(sticky, className)}
        aria-busy="true"
        aria-label="Chargement navigation dossier"
      >
        <div className="h-10 animate-pulse rounded-xl bg-slate-100" />
        {error ? (
          <p className="mt-1 text-[11px] text-red-600">{error}</p>
        ) : null}
      </div>
    );
  }

  return (
    <>
      <ChantierDossierNav
        snapshot={snapshot}
        variant={variant}
        sticky={sticky}
        busy={busy}
        onStepAction={onStepAction}
        className={className}
      />
      {error ? (
        <p className="mt-1 text-[11px] text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      {takeoffOpen ? (
        <TakeoffCreateFromChatgptModal
          projectId={projectId}
          onClose={() => setTakeoffOpen(false)}
          onCreated={() => {
            setTakeoffOpen(false);
            router.refresh();
          }}
        />
      ) : null}
      {quoteOpen ? (
        <QuoteCreateFromChatgptModal
          projectId={projectId}
          onClose={() => setQuoteOpen(false)}
          onCreated={() => {
            setQuoteOpen(false);
            router.refresh();
          }}
        />
      ) : null}
      {planningOpen ? (
        <PlanningCreateFromChatgptModal
          projectId={projectId}
          onClose={() => setPlanningOpen(false)}
          onCreated={() => {
            setPlanningOpen(false);
            router.refresh();
          }}
        />
      ) : null}
    </>
  );
}

function cnSkeleton(sticky: boolean, className?: string) {
  return [
    sticky
      ? "sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 px-1 py-1.5"
      : "px-1 py-1.5",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");
}
