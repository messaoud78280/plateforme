"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createDemoPilotageLink } from "@/app/dashboard/demonstrations/actions";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";

export function CreateDemoLinkForm({ scenarios }: { scenarios: { id: string; label: string }[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);

  return (
    <Card hover={false}>
      <CardHeader
        title="Créer une démonstration"
        description="Lien prospect isolé, expiration et code d’accès optionnels."
      />
      <form
        className="grid gap-3 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          setCreatedUrl(null);
          const fd = new FormData(e.currentTarget);
          startTransition(async () => {
            const res = await createDemoPilotageLink(fd);
            if (!res.ok) {
              setError("Création impossible.");
              return;
            }
            const origin = window.location.origin;
            setCreatedUrl(`${origin}/demo/pilotage-travaux/${res.token}`);
            router.refresh();
          });
        }}
      >
        <div className="sm:col-span-2">
          <Select name="scenarioId" label="Scénario">
            {scenarios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </Select>
        </div>
        <Input name="prospectCompany" label="Entreprise prospect" />
        <Input name="prospectName" label="Nom du contact" />
        <Input name="corpsEtat" label="Corps d’état" />
        <Input name="marketType" label="Type de marché" />
        <Input name="chantierCountApprox" label="Nb chantiers approx." />
        <Input name="mainPain" label="Difficulté principale" />
        <Input name="commercialName" label="Commercial BeWork" />
        <Input name="meetingDate" label="Date RDV" type="date" />
        <Input name="expiresInDays" label="Expiration (jours)" type="number" defaultValue="14" />
        <Input name="maxViews" label="Max consultations (optionnel)" type="number" />
        <Input name="accessCode" label="Code d’accès (optionnel)" />
        <label className="flex items-center gap-2 text-xs font-semibold text-bework-ink sm:col-span-2">
          <input type="checkbox" name="logoAuthorized" value="1" />
          Logo prospect autorisé explicitement
        </label>
        <div className="sm:col-span-2">
          <Input name="logoUrl" label="URL logo (si autorisé)" />
        </div>
        {error ? (
          <div className="sm:col-span-2">
            <Alert tone="critical">{error}</Alert>
          </div>
        ) : null}
        {createdUrl ? (
          <div className="sm:col-span-2">
            <Alert tone="ok">
              Lien créé : <span className="break-all font-medium">{createdUrl}</span>
            </Alert>
          </div>
        ) : null}
        <div className="sm:col-span-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Création…" : "Générer le lien prospect"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
