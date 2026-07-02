import Link from "next/link";
import { BtpDicoTermEditor } from "@/components/devis/dico/BtpDicoTermEditor";
import { requireBeWorkDevisSession } from "@/lib/be-work-devis-access";

export default async function NouveauTermeDicoPage() {
  await requireBeWorkDevisSession();

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Link href="/dashboard/devis/dico-btp" className="text-sm font-semibold text-[#1e3a5f] hover:underline">
          ← Dico BTP
        </Link>
        <h1 className="font-heading text-2xl font-bold text-slate-900">Nouveau terme</h1>
        <p className="text-sm text-slate-600">
          Ajoutez une définition, un acronyme ou un terme technique au lexique interne.
        </p>
      </header>
      <BtpDicoTermEditor mode="create" />
    </div>
  );
}
