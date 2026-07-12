"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { isWellFormedEmail } from "@/lib/email-validation";
import { FORMES_JURIDIQUES, SECTEURS_ACTIVITE } from "@/lib/client-profile-options";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input, Select } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";

export function CreateClientForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [formeJuridique, setFormeJuridique] = useState("");
  const [secteurActivite, setSecteurActivite] = useState("");
  const [service, setService] = useState("");
  const [password, setPassword] = useState("");

  function resetForm() {
    setName("");
    setEmail("");
    setPhone("");
    setCompany("");
    setFormeJuridique("");
    setSecteurActivite("");
    setService("");
    setPassword("");
    setError("");
  }

  function close() {
    if (loading) return;
    setOpen(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!isWellFormedEmail(email)) {
      setError("Indiquez une adresse email complète.");
      return;
    }
    if (!company.trim()) {
      setError("La raison sociale est requise.");
      return;
    }
    if (!formeJuridique) {
      setError("Sélectionnez une forme juridique.");
      return;
    }
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          company: company.trim(),
          formeJuridique,
          secteurActivite: secteurActivite || undefined,
          service: service.trim() || undefined,
          password,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Impossible de créer le client.");
        return;
      }
      setOpen(false);
      resetForm();
      router.refresh();
    } catch {
      setError("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        + Nouveau client
      </Button>

      <Modal
        open={open}
        onClose={close}
        dismissible={!loading}
        title="Créer un compte client"
        description="Client = entreprise (toutes formes juridiques). Le contact recevra un email de bienvenue."
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="secondary" disabled={loading} onClick={close}>
              Annuler
            </Button>
            <Button type="submit" form="create-client-form" disabled={loading}>
              {loading ? "Création…" : "Créer le client"}
            </Button>
          </div>
        }
      >
        <form id="create-client-form" onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <Input
            id="client-company"
            label="Raison sociale *"
            required
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Ex. Alya Corporation"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              id="client-forme"
              label="Forme juridique *"
              required
              value={formeJuridique}
              onChange={(e) => setFormeJuridique(e.target.value)}
            >
              <option value="">— Choisir —</option>
              {FORMES_JURIDIQUES.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </Select>
            <Select
              id="client-secteur"
              label="Secteur"
              value={secteurActivite}
              onChange={(e) => setSecteurActivite(e.target.value)}
            >
              <option value="">— Optionnel —</option>
              {SECTEURS_ACTIVITE.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>

          <Input
            id="client-name"
            label="Nom du contact *"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Prénom et nom"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="client-email"
              label="Email *"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contact@entreprise.fr"
            />
            <Input
              id="client-phone"
              label="Téléphone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <Input
            id="client-service"
            label="Service / département"
            value={service}
            onChange={(e) => setService(e.target.value)}
            placeholder="Ex. Direction travaux"
          />

          <Input
            id="client-password"
            label="Mot de passe initial *"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            hint="Minimum 8 caractères — à communiquer au client."
          />

          {error ? (
            <Alert tone="critical">{error}</Alert>
          ) : null}
        </form>
      </Modal>
    </>
  );
}
