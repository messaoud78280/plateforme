"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";

type ClientOpt = {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  zipCode: string | null;
  contacts: Array<{
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    jobTitle: string | null;
    isPrimary: boolean;
  }>;
};

type UserOpt = { id: string; name: string | null; email: string };

const field =
  "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-[15px] text-slate-900 outline-none focus:border-[#1e3a5f]/40";
const label = "block text-[12px] font-semibold uppercase tracking-wide text-slate-500";

/**
 * Création rapide — le compte rendu se remplit ensuite sur la fiche visite (5 blocs).
 */
export function SiteVisitCreateClient({
  clients,
  users,
  currentUserId,
}: {
  clients: ClientOpt[];
  projects?: unknown;
  users: UserOpt[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [clientQuery, setClientQuery] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientName, setClientName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [city, setCity] = useState("");
  const [works, setWorks] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("09:00");
  const [responsibleId, setResponsibleId] = useState(currentUserId);

  const filteredClients = useMemo(() => {
    const q = clientQuery.trim().toLowerCase();
    if (!q) return clients.slice(0, 12);
    return clients
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.city ?? "").toLowerCase().includes(q) ||
          (c.phone ?? "").includes(q),
      )
      .slice(0, 12);
  }, [clients, clientQuery]);

  function applyClient(id: string) {
    setClientId(id);
    const c = clients.find((x) => x.id === id);
    if (!c) return;
    const primary = c.contacts.find((x) => x.isPrimary) ?? c.contacts[0];
    setClientName(c.name);
    setPhone(c.phone || primary?.phone || "");
    setEmail(primary?.email || "");
    setAddress(c.address || "");
    setZipCode(c.zipCode || "");
    setCity(c.city || "");
    setClientQuery("");
  }

  const canCreate = Boolean(clientName.trim() && address.trim());

  async function submit() {
    if (!canCreate) {
      setMessage("Indiquez au minimum le client et l’adresse du chantier.");
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const scheduledAt =
        date.trim()
          ? new Date(`${date}T${time || "09:00"}`).toISOString()
          : null;
      const subject =
        works.trim().slice(0, 80) || "Compte rendu de visite";
      const res = await fetch("/api/site-visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: clientName.trim(),
          clientExternalOrgId: clientId || null,
          siteAddress: [address.trim(), zipCode.trim(), city.trim()]
            .filter(Boolean)
            .join(", "),
          contactName: clientName.trim(),
          contactPhone: phone.trim() || null,
          subject,
          clientNeed: works.trim() || null,
          scheduledAt,
          responsibleId: responsibleId || null,
          prep: {
            contactEmail: email.trim() || null,
            zipCode: zipCode.trim() || null,
            city: city.trim() || null,
            addressComplement: null,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec");
      router.push(`/dashboard/visites-metres/${data.visit.id}`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-3 py-4 sm:px-6">
      <Link
        href="/dashboard/visites-metres"
        className="text-sm font-semibold text-[#1e3a5f]"
      >
        ← Visites
      </Link>
      <h1 className="mt-3 text-[22px] font-semibold text-[#1e3a5f]">
        Nouvelle visite
      </h1>
      <p className="mt-1 text-[14px] text-slate-600">
        Identifiez le chantier en 1 minute — le compte rendu se remplit ensuite
        sur place (métrés, photos, observations).
      </p>

      {message ? (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] text-amber-900">
          {message}
        </p>
      ) : null}

      <section className="mt-5 space-y-3 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <h2 className="text-[15px] font-semibold text-[#1e3a5f]">Client & chantier</h2>

        <label>
          <span className={label}>Client existant</span>
          <input
            className={field}
            value={clientQuery}
            onChange={(e) => setClientQuery(e.target.value)}
            placeholder="Rechercher…"
          />
          {clientQuery.trim() ? (
            <ul className="mt-2 max-h-40 overflow-auto rounded-xl border border-slate-100 bg-slate-50">
              {filteredClients.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left text-[13px] hover:bg-white"
                    onClick={() => applyClient(c.id)}
                  >
                    <span className="font-medium">{c.name}</span>
                    <span className="block text-[12px] text-slate-500">
                      {[c.city, c.phone].filter(Boolean).join(" · ")}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </label>

        <label>
          <span className={label}>Nom du client / société</span>
          <input
            className={field}
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label>
            <span className={label}>Téléphone</span>
            <input
              className={field}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </label>
          <label>
            <span className={label}>Email</span>
            <input
              className={field}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
        </div>
        <label>
          <span className={label}>Adresse du chantier</span>
          <input
            className={field}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label>
            <span className={label}>Code postal</span>
            <input
              className={field}
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
            />
          </label>
          <label>
            <span className={label}>Ville</span>
            <input
              className={field}
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </label>
        </div>
        <label>
          <span className={label}>Travaux demandés (facultatif)</span>
          <textarea
            className={cn(field, "min-h-[88px] resize-y")}
            value={works}
            onChange={(e) => setWorks(e.target.value)}
            placeholder="Ex. Réfection terrasse 40 m²…"
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label>
            <span className={label}>Date (facultatif)</span>
            <input
              className={field}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
          <label>
            <span className={label}>Heure</span>
            <input
              className={field}
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </label>
        </div>
        <label>
          <span className={label}>Commercial / responsable</span>
          <select
            className={field}
            value={responsibleId}
            onChange={(e) => setResponsibleId(e.target.value)}
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name || u.email}
              </option>
            ))}
          </select>
        </label>
      </section>

      <button
        type="button"
        disabled={busy || !canCreate}
        onClick={() => void submit()}
        className="mt-4 flex h-14 w-full items-center justify-center rounded-2xl bg-[#1e3a5f] text-[16px] font-semibold text-white disabled:opacity-40"
      >
        {busy ? "Création…" : "Créer et ouvrir le compte rendu"}
      </button>
    </div>
  );
}
