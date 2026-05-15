import { DevisSubNav } from "@/components/devis/DevisSubNav";
import { requireBeWorkDevisSession } from "@/lib/be-work-devis-access";

export default async function DevisModuleLayout({ children }: { children: React.ReactNode }) {
  await requireBeWorkDevisSession();

  return (
    <div className="space-y-6">
      <DevisSubNav />
      {children}
    </div>
  );
}
