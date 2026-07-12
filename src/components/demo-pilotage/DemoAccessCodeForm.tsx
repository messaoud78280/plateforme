"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Card, CardHeader } from "@/components/ui/Card";

export function DemoAccessCodeForm({ token }: { token: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-md space-y-4 py-12">
      <Alert tone="watch">Démonstration BeWork — Données fictives</Alert>
      <Card hover={false}>
        <CardHeader
          title="Code d’accès requis"
          description="Saisissez le code fourni par votre interlocuteur BeWork."
        />
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            const code = new FormData(e.currentTarget).get("code");
            startTransition(async () => {
              const res = await fetch(`/api/demo-pilotage/${token}/unlock`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code }),
              });
              if (!res.ok) {
                setError("Code incorrect ou lien invalide.");
                return;
              }
              router.refresh();
            });
          }}
        >
          <Input
            name="code"
            type="password"
            required
            autoComplete="one-time-code"
            label="Code"
            placeholder="Code d’accès"
          />
          {error ? <Alert tone="critical">{error}</Alert> : null}
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Vérification…" : "Accéder à la démonstration"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
