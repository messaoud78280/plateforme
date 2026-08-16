"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  EMPTY_SUPPLIER_FORM,
  SupplierFormDrawer,
  type SupplierFormValues,
} from "@/components/suppliers/SupplierFormDrawer";

type Props = {
  supplier: {
    id: string;
    name: string;
    tradeName: string | null;
    activity: string | null;
    address: string | null;
    zipCode: string | null;
    city: string | null;
    phone: string | null;
    email: string | null;
    website: string | null;
    siret: string | null;
    paymentTerms: string | null;
    notes: string | null;
    primaryContact: {
      firstName: string;
      lastName: string;
      jobTitle: string | null;
      email: string | null;
      phone: string | null;
    } | null;
  };
};

export function SupplierEditButton({ supplier }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState(false);

  const initial = useMemo<SupplierFormValues>(
    () => ({
      ...EMPTY_SUPPLIER_FORM,
      name: supplier.name,
      activity: supplier.activity ?? "",
      phone: supplier.phone ?? "",
      email: supplier.email ?? "",
      address: supplier.address ?? "",
      zipCode: supplier.zipCode ?? "",
      city: supplier.city ?? "",
      website: supplier.website ?? "",
      siret: supplier.siret ?? "",
      paymentTerms: supplier.paymentTerms ?? "",
      notes: supplier.notes ?? "",
      contactFirstName: supplier.primaryContact?.firstName ?? "",
      contactLastName: supplier.primaryContact?.lastName ?? "",
      contactJobTitle: supplier.primaryContact?.jobTitle ?? "",
      contactPhone: supplier.primaryContact?.phone ?? "",
      contactEmail: supplier.primaryContact?.email ?? "",
    }),
    [supplier],
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-cc-secondary !min-h-9 !text-xs"
      >
        Modifier
      </button>
      <SupplierFormDrawer
        open={open}
        onClose={() => setOpen(false)}
        mode="edit"
        supplierId={supplier.id}
        initial={initial}
        onSaved={() => {
          setToast(true);
          window.setTimeout(() => setToast(false), 2500);
          router.refresh();
        }}
      />
      {toast ? (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-[90] -translate-x-1/2 rounded-full bg-bework-navy-deep px-4 py-2 text-sm font-medium text-white shadow-lg"
        >
          Fournisseur mis à jour
        </div>
      ) : null}
    </>
  );
}
