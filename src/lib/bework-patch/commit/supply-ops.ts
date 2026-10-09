/**
 * SUPPLY — opérations commit universel (Approvisionnements).
 * Local-only : jamais métré / devis / planning / PurchaseOrder / selectedOfferId.
 * Historique prix sans migration : archive + nouvelle offre si unitPrice change.
 */
import type { Prisma } from "@prisma/client";
import type { BeworkPatchV1 } from "@/lib/bework-patch/types";
import { validateSupplyOfferInput } from "@/lib/supply/offer-validation";
import { computeSupplyContextVersion } from "@/lib/bework-patch/build-supply-context";

export const SUPPLY_COMMIT_SUPPORTED_OPS = [
  "add_supply_need",
  "update_supply_need",
  "cancel_supply_need",
  "add_supply_offer",
  "update_supply_offer",
  "archive_supply_offer",
  "add_supplier",
] as const;

export type SupplyCommitSupportedOp =
  (typeof SUPPLY_COMMIT_SUPPORTED_OPS)[number];

export function isSupplyCommitSupportedOp(
  op: string,
): op is SupplyCommitSupportedOp {
  return (SUPPLY_COMMIT_SUPPORTED_OPS as readonly string[]).includes(op);
}

function n(v: unknown): number | null {
  if (v == null || v === "") return null;
  const x = typeof v === "number" ? v : Number(v);
  return Number.isFinite(x) ? x : null;
}

function toDate(v: string | null | undefined): Date | null {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function asJson(
  v: Record<string, unknown> | null | undefined,
): Prisma.InputJsonValue | undefined {
  if (v == null) return undefined;
  return v as Prisma.InputJsonValue;
}

function fail(message: string, code = "SUPPLY_COMMIT_REJECTED"): never {
  throw Object.assign(new Error(message), { code });
}

/** Clé d’idempotence offre (déterministe). */
export function supplyOfferIdempotencyKey(input: {
  organizationId: string;
  requirementId: string;
  supplierExternalOrgId: string;
  productRef: string | null;
  sourceUrl: string | null;
  observedAt: string | null;
}): string {
  const day = (input.observedAt ?? "").slice(0, 10);
  return [
    input.organizationId,
    input.requirementId,
    input.supplierExternalOrgId,
    (input.productRef ?? "").trim().toLowerCase(),
    (input.sourceUrl ?? "").trim().toLowerCase(),
    day,
  ].join("::");
}

export async function loadSupplyFingerprintSnapshot(
  tx: Prisma.TransactionClient | typeof import("@/lib/prisma").prisma,
  opts: { orgId: string; projectId: string },
) {
  const requirements = await tx.materialRequirement.findMany({
    where: { organizationId: opts.orgId, projectId: opts.projectId },
    select: {
      id: true,
      updatedAt: true,
      selectedOfferId: true,
      quantityRequired: true,
      status: true,
      offers: {
        where: { archivedAt: null },
        select: { id: true, updatedAt: true, unitPrice: true },
      },
    },
  });
  return computeSupplyContextVersion({
    projectId: opts.projectId,
    needs: requirements.map((r) => ({
      id: r.id,
      updatedAt: r.updatedAt.toISOString(),
      selectedOfferId: r.selectedOfferId,
      quantityRequired: Number(r.quantityRequired),
      status: r.status,
    })),
    offers: requirements.flatMap((r) =>
      r.offers.map((o) => ({
        id: o.id,
        updatedAt: o.updatedAt.toISOString(),
        unitPrice: n(o.unitPrice),
      })),
    ),
  });
}

/**
 * Applique un patch SUPPLY dans une transaction.
 * Compteurs : purchaseOrders / quotes / studies / plans inchangés (tests T15–T18).
 */
export async function applySupplyDirectInTx(
  tx: Prisma.TransactionClient,
  input: {
    orgId: string;
    projectId: string;
    userId: string;
    patch: BeworkPatchV1;
    expectedVersion: number;
  },
): Promise<{
  appliedOps: string[];
  createdNeedIds: string[];
  createdOfferIds: string[];
  createdSupplierIds: string[];
  warnings: string[];
  purchaseOrdersCreated: number;
}> {
  const { orgId, projectId, userId, patch } = input;
  if (patch.origin.section !== "SUPPLY") {
    fail("Section patch ≠ SUPPLY");
  }
  if (patch.origin.entity_id !== projectId) {
    fail("entity_id SUPPLY doit être le projectId");
  }

  const versionBefore = await loadSupplyFingerprintSnapshot(tx, {
    orgId,
    projectId,
  });
  if (versionBefore !== input.expectedVersion) {
    fail("Empreinte Approvisionnements obsolète — relancez la Preview.", "PREVIEW_STALE");
  }

  const poBefore = await tx.purchaseOrder.count({
    where: { organizationId: orgId },
  });

  const appliedOps: string[] = [];
  const createdNeedIds: string[] = [];
  const createdOfferIds: string[] = [];
  const createdSupplierIds: string[] = [];
  const warnings: string[] = [];
  /** ref → id fournisseur créé dans ce patch */
  const supplierRefMap = new Map<string, string>();

  // 1) Fournisseurs d’abord
  for (const op of patch.operations) {
    if (op.op !== "add_supplier") continue;
    const s = op.supplier;
    // Matching ambigu : si plusieurs proches → refuse auto-fusion
    const candidates = await tx.externalOrganization.findMany({
      where: {
        hostOrganizationId: orgId,
        type: { in: ["SUPPLIER", "SUBCONTRACTOR"] },
        OR: [
          { name: { equals: s.name, mode: "insensitive" } },
          ...(s.trade_name
            ? [{ tradeName: { equals: s.trade_name, mode: "insensitive" as const } }]
            : []),
          ...(s.website
            ? [{ website: { equals: s.website, mode: "insensitive" as const } }]
            : []),
        ],
      },
      select: { id: true, name: true },
      take: 5,
    });
    if (candidates.length === 1) {
      supplierRefMap.set(s.ref, candidates[0]!.id);
      warnings.push(
        `FOURNISSEUR EXISTANT réutilisé pour ref=${s.ref} (${candidates[0]!.name})`,
      );
      appliedOps.push("add_supplier:reuse");
      continue;
    }
    if (candidates.length > 1) {
      fail(
        `Matching fournisseur ambigu pour « ${s.name} » — validation humaine obligatoire (pas de fusion auto).`,
        "SUPPLIER_MATCH_AMBIGUOUS",
      );
    }
    if (s.parent_external_org_id) {
      const parent = await tx.externalOrganization.findFirst({
        where: {
          id: s.parent_external_org_id,
          hostOrganizationId: orgId,
          type: "SUPPLIER",
        },
        select: { id: true },
      });
      if (!parent) fail("Enseigne parente introuvable ou hors organisation");
    }
    const created = await tx.externalOrganization.create({
      data: {
        hostOrganizationId: orgId,
        name: s.name.trim(),
        type: "SUPPLIER",
        tradeName: s.trade_name?.trim() || null,
        parentExternalOrgId: s.parent_external_org_id || null,
        address: s.address?.trim() || null,
        zipCode: s.zip_code?.trim() || null,
        city: s.city?.trim() || null,
        phone: s.phone?.trim() || null,
        email: s.email?.trim() || null,
        website: s.website?.trim() || null,
        activity: s.activity?.trim() || null,
        notes: s.notes?.trim() || null,
        status: "ACTIVE",
      },
      select: { id: true },
    });
    supplierRefMap.set(s.ref, created.id);
    createdSupplierIds.push(created.id);
    appliedOps.push("add_supplier");
  }

  // 2) Besoins
  for (const op of patch.operations) {
    if (op.op === "add_supply_need") {
      const need = op.need;
      const qty = need.validated_order_quantity;
      if (!(qty > 0)) fail("Quantité validée invalide");
      const sourceType =
        need.is_hypothesis
          ? "HYPOTHESIS"
          : (need.source_type as
              | "MANUAL"
              | "TAKEOFF_LINE"
              | "HYPOTHESIS"
              | "SCHEDULE_TASK"
              | undefined) ?? "MANUAL";
      const created = await tx.materialRequirement.create({
        data: {
          organizationId: orgId,
          projectId,
          label: need.label.trim(),
          unit: need.unit.trim() || "U",
          quantityRequired: qty,
          validatedOrderQuantity: qty,
          category: (need.category as never) ?? "MATERIAL",
          procurementMode: (need.procurement_mode as never) ?? "ACHAT",
          description: need.description?.trim() || null,
          sourceQuantity: need.source_quantity ?? null,
          sourceUnit: need.source_unit?.trim() || null,
          calculatedQuantity: need.calculated_quantity ?? null,
          lossFactor: need.loss_factor ?? null,
          packaging: need.packaging?.trim() || null,
          packagingSize: need.packaging_size ?? null,
          packagingUnit: need.packaging_unit?.trim() || null,
          takeoffCodes: need.takeoff_codes ?? undefined,
          scheduleTaskIds: need.schedule_task_ids ?? undefined,
          neededAt: toDate(need.needed_at ?? null),
          notes: need.notes?.trim() || null,
          status: (need.status as never) ?? "TO_CONSULT",
          sourceType: sourceType as never,
          sourceLabel:
            need.source_label?.trim() ||
            (need.is_hypothesis
              ? "Hypothèse ChatGPT — à valider"
              : "Proposition ChatGPT SUPPLY"),
          sourceDrift: "NONE",
          createdById: userId,
        },
        select: { id: true },
      });
      createdNeedIds.push(created.id);
      appliedOps.push("add_supply_need");
      continue;
    }

    if (op.op === "update_supply_need") {
      const reqId = op.target.requirement_id;
      const existing = await tx.materialRequirement.findFirst({
        where: { id: reqId, organizationId: orgId, projectId },
        select: {
          id: true,
          status: true,
          _count: { select: { orderLinks: true } },
        },
      });
      if (!existing) fail("Besoin introuvable ou hors projet/organisation");
      if (existing.status === "CANCELLED") fail("Besoin déjà annulé");
      if (
        existing._count.orderLinks > 0 &&
        op.changes.validated_order_quantity != null
      ) {
        fail(
          "Ce besoin est déjà engagé dans une commande — modification de quantité refusée via SUPPLY.",
          "NEED_ALREADY_ORDERED",
        );
      }
      const qty = op.changes.validated_order_quantity;
      await tx.materialRequirement.update({
        where: { id: existing.id },
        data: {
          ...(op.changes.label != null ? { label: op.changes.label.trim() } : {}),
          ...(op.changes.category != null
            ? { category: op.changes.category as never }
            : {}),
          ...(op.changes.procurement_mode != null
            ? { procurementMode: op.changes.procurement_mode as never }
            : {}),
          ...(op.changes.description !== undefined
            ? { description: op.changes.description?.trim() || null }
            : {}),
          ...(qty != null
            ? { quantityRequired: qty, validatedOrderQuantity: qty }
            : {}),
          ...(op.changes.unit != null ? { unit: op.changes.unit.trim() } : {}),
          ...(op.changes.source_quantity !== undefined
            ? { sourceQuantity: op.changes.source_quantity }
            : {}),
          ...(op.changes.calculated_quantity !== undefined
            ? { calculatedQuantity: op.changes.calculated_quantity }
            : {}),
          ...(op.changes.loss_factor !== undefined
            ? { lossFactor: op.changes.loss_factor }
            : {}),
          ...(op.changes.packaging !== undefined
            ? { packaging: op.changes.packaging?.trim() || null }
            : {}),
          ...(op.changes.packaging_size !== undefined
            ? { packagingSize: op.changes.packaging_size }
            : {}),
          ...(op.changes.needed_at !== undefined
            ? { neededAt: toDate(op.changes.needed_at) }
            : {}),
          ...(op.changes.notes !== undefined
            ? { notes: op.changes.notes?.trim() || null }
            : {}),
          ...(op.changes.status != null
            ? { status: op.changes.status as never }
            : {}),
        },
      });
      if (existing._count.orderLinks > 0) {
        warnings.push("BESOIN DÉJÀ COMMANDÉ — champs protégés appliqués avec prudence.");
      }
      appliedOps.push("update_supply_need");
      continue;
    }

    if (op.op === "cancel_supply_need") {
      const reqId = op.target.requirement_id;
      const existing = await tx.materialRequirement.findFirst({
        where: { id: reqId, organizationId: orgId, projectId },
        select: { id: true },
      });
      if (!existing) fail("Besoin introuvable");
      await tx.materialRequirement.update({
        where: { id: existing.id },
        data: { status: "CANCELLED" },
      });
      appliedOps.push("cancel_supply_need");
    }
  }

  // 3) Offres
  for (const op of patch.operations) {
    if (op.op === "add_supply_offer") {
      const requirementId = op.target.requirement_id;
      const req = await tx.materialRequirement.findFirst({
        where: { id: requirementId, organizationId: orgId, projectId },
        select: {
          id: true,
          _count: { select: { orderLinks: true } },
        },
      });
      if (!req) fail("Besoin introuvable pour l’offre");
      if (req._count.orderLinks > 0) {
        warnings.push(
          "BESOIN DÉJÀ COMMANDÉ — offres ajoutées sans modifier la commande.",
        );
      }

      const supplierId =
        op.offer.supplier_external_org_id?.trim() ||
        (op.offer.supplier_ref
          ? supplierRefMap.get(op.offer.supplier_ref) ?? null
          : null);
      if (!supplierId) fail("Fournisseur requis (id existant ou supplier_ref)");
      const supplier = await tx.externalOrganization.findFirst({
        where: {
          id: supplierId,
          hostOrganizationId: orgId,
          type: { in: ["SUPPLIER", "SUBCONTRACTOR"] },
        },
        select: { id: true },
      });
      if (!supplier) fail("Fournisseur hors organisation — rejet");

      const validation = validateSupplyOfferInput({
        supplierExternalOrgId: supplierId,
        productLabel: op.offer.product_label,
        productRef: op.offer.product_ref,
        unitPrice: op.offer.unit_price,
        priceUnit: op.offer.price_unit,
        priceTaxMode: op.offer.price_tax_mode ?? "HT",
        vatRate: op.offer.vat_rate,
        priceSourceType: op.offer.price_source_type,
        sourceUrl: op.offer.source_url,
        quoteNumber: op.offer.quote_number,
        quoteDocumentRef: op.offer.quote_document_ref,
        sourceNote: op.offer.source_note,
        observedAt: op.offer.observed_at,
        recordedAt: new Date().toISOString(),
        validUntil: op.offer.valid_until,
        packagingLabel: op.offer.packaging_label,
        unitsPerPack: op.offer.units_per_pack,
        minimumOrderQuantity: op.offer.minimum_order_quantity,
        leadTimeDays: op.offer.lead_time_days,
        availabilityNote: op.offer.availability_note,
        deliveryFee: op.offer.delivery_fee,
        craneFee: op.offer.crane_fee,
        otherFees: op.offer.other_fees,
      });
      if (!validation.ok) fail(validation.error, "SUPPLY_PRICE_VALIDATION");

      // Idempotence + anti-doublons (ref / URL / EAN / fournisseur sans identité)
      const key = supplyOfferIdempotencyKey({
        organizationId: orgId,
        requirementId: req.id,
        supplierExternalOrgId: supplierId,
        productRef: op.offer.product_ref ?? null,
        sourceUrl: op.offer.source_url ?? null,
        observedAt: op.offer.observed_at ?? null,
      });
      const existingOffers = await tx.supplyOffer.findMany({
        where: {
          organizationId: orgId,
          requirementId: req.id,
          archivedAt: null,
        },
        select: {
          id: true,
          supplierExternalOrgId: true,
          productLabel: true,
          productRef: true,
          sourceUrl: true,
          observedAt: true,
          unitPrice: true,
          archivedAt: true,
          techAttributes: true,
        },
      });
      const dupKey = existingOffers.find(
        (e) =>
          e.supplierExternalOrgId === supplierId &&
          supplyOfferIdempotencyKey({
            organizationId: orgId,
            requirementId: req.id,
            supplierExternalOrgId: supplierId!,
            productRef: e.productRef,
            sourceUrl: e.sourceUrl,
            observedAt: e.observedAt?.toISOString() ?? null,
          }) === key,
      );
      if (dupKey) {
        warnings.push(`Offre déjà présente (idempotence) — réutilisation ${dupKey.id}`);
        appliedOps.push("add_supply_offer:idempotent");
        continue;
      }
      const { findSupplyOfferDuplicateCandidates } = await import(
        "@/lib/supply/offer-duplicates"
      );
      const softDups = findSupplyOfferDuplicateCandidates({
        candidates: existingOffers.map((e) => ({
          ...e,
          unitPrice:
            e.unitPrice == null ? null : Number(e.unitPrice),
        })),
        input: {
          supplierExternalOrgId: supplierId,
          productRef: op.offer.product_ref ?? null,
          sourceUrl: op.offer.source_url ?? null,
          techAttributes: op.offer.tech_attributes,
        },
      });
      if (softDups.length > 0) {
        warnings.push(
          `Offre possiblement en doublon — réutilisation ${softDups[0].id} (${softDups[0].matchReasons.join(", ")})`,
        );
        appliedOps.push("add_supply_offer:duplicate_skipped");
        continue;
      }

      const equiv =
        op.offer.equivalence_status === "CONFIRMED"
          ? "TO_VERIFY" // jamais CONFIRMED auto
          : op.offer.equivalence_status ?? "TO_VERIFY";
      if (op.offer.equivalence_status === "CONFIRMED") {
        warnings.push("ÉQUIVALENCE À VÉRIFIER — CONFIRMED auto-rétrogradé en TO_VERIFY");
      }

      const created = await tx.supplyOffer.create({
        data: {
          organizationId: orgId,
          requirementId: req.id,
          supplierExternalOrgId: supplierId,
          productLabel: op.offer.product_label.trim(),
          productRef: op.offer.product_ref?.trim() || null,
          techAttributes: asJson(op.offer.tech_attributes),
          equivalenceStatus: equiv as never,
          unitPrice: op.offer.unit_price ?? null,
          priceUnit: op.offer.price_unit?.trim() || "U",
          priceTaxMode: (op.offer.price_tax_mode ?? "HT") as never,
          vatRate: op.offer.vat_rate ?? null,
          priceSourceType: op.offer.price_source_type as never,
          sourceUrl: op.offer.source_url?.trim() || null,
          quoteNumber: op.offer.quote_number?.trim() || null,
          quoteDocumentRef: op.offer.quote_document_ref?.trim() || null,
          sourceNote: op.offer.source_note?.trim() || null,
          observedAt: toDate(op.offer.observed_at ?? null),
          recordedAt: new Date(),
          validUntil: toDate(op.offer.valid_until ?? null),
          recordedById: userId,
          packagingLabel: op.offer.packaging_label?.trim() || null,
          unitsPerPack: op.offer.units_per_pack ?? null,
          minimumOrderQuantity: op.offer.minimum_order_quantity ?? null,
          leadTimeDays: op.offer.lead_time_days ?? null,
          availabilityNote: op.offer.availability_note?.trim() || null,
          deliveryFee: op.offer.delivery_fee ?? null,
          craneFee: op.offer.crane_fee ?? null,
          otherFees: op.offer.other_fees ?? null,
        },
        select: { id: true },
      });
      createdOfferIds.push(created.id);
      appliedOps.push("add_supply_offer");
      continue;
    }

    if (op.op === "update_supply_offer") {
      const offerId = op.target.offer_id;
      const existing = await tx.supplyOffer.findFirst({
        where: {
          id: offerId,
          organizationId: orgId,
          requirement: { projectId },
        },
      });
      if (!existing) fail("Offre introuvable ou hors organisation/projet");

      const nextPrice =
        op.changes.unit_price !== undefined
          ? op.changes.unit_price
          : n(existing.unitPrice);
      const priceChanged =
        op.changes.unit_price !== undefined &&
        n(existing.unitPrice) !== op.changes.unit_price;

      const mergedInput = {
        supplierExternalOrgId: existing.supplierExternalOrgId,
        productLabel: op.changes.product_label ?? existing.productLabel,
        productRef:
          op.changes.product_ref !== undefined
            ? op.changes.product_ref
            : existing.productRef,
        unitPrice: nextPrice,
        priceUnit: op.changes.price_unit ?? existing.priceUnit,
        priceTaxMode: op.changes.price_tax_mode ?? existing.priceTaxMode,
        vatRate:
          op.changes.vat_rate !== undefined
            ? op.changes.vat_rate
            : n(existing.vatRate),
        priceSourceType: op.changes.price_source_type ?? existing.priceSourceType,
        sourceUrl:
          op.changes.source_url !== undefined
            ? op.changes.source_url
            : existing.sourceUrl,
        quoteNumber:
          op.changes.quote_number !== undefined
            ? op.changes.quote_number
            : existing.quoteNumber,
        quoteDocumentRef:
          op.changes.quote_document_ref !== undefined
            ? op.changes.quote_document_ref
            : existing.quoteDocumentRef,
        sourceNote:
          op.changes.source_note !== undefined
            ? op.changes.source_note
            : existing.sourceNote,
        observedAt:
          op.changes.observed_at !== undefined
            ? op.changes.observed_at
            : existing.observedAt?.toISOString() ?? null,
        recordedAt: new Date().toISOString(),
        validUntil:
          op.changes.valid_until !== undefined
            ? op.changes.valid_until
            : existing.validUntil?.toISOString() ?? null,
        packagingLabel:
          op.changes.packaging_label !== undefined
            ? op.changes.packaging_label
            : existing.packagingLabel,
        unitsPerPack:
          op.changes.units_per_pack !== undefined
            ? op.changes.units_per_pack
            : n(existing.unitsPerPack),
        minimumOrderQuantity:
          op.changes.minimum_order_quantity !== undefined
            ? op.changes.minimum_order_quantity
            : n(existing.minimumOrderQuantity),
        leadTimeDays:
          op.changes.lead_time_days !== undefined
            ? op.changes.lead_time_days
            : n(existing.leadTimeDays),
        availabilityNote:
          op.changes.availability_note !== undefined
            ? op.changes.availability_note
            : existing.availabilityNote,
        deliveryFee:
          op.changes.delivery_fee !== undefined
            ? op.changes.delivery_fee
            : n(existing.deliveryFee),
        craneFee:
          op.changes.crane_fee !== undefined
            ? op.changes.crane_fee
            : n(existing.craneFee),
        otherFees:
          op.changes.other_fees !== undefined
            ? op.changes.other_fees
            : n(existing.otherFees),
      };
      const validation = validateSupplyOfferInput(mergedInput);
      if (!validation.ok) fail(validation.error, "SUPPLY_PRICE_VALIDATION");

      if (priceChanged) {
        // Historique léger sans migration : archive ancienne + crée nouvelle
        await tx.supplyOffer.update({
          where: { id: existing.id },
          data: { archivedAt: new Date() },
        });
        // Ne pas réécrire selectedOfferId — si l’offre archivée était retenue, clear
        const req = await tx.materialRequirement.findFirst({
          where: { id: existing.requirementId, organizationId: orgId },
          select: { id: true, selectedOfferId: true },
        });
        if (req?.selectedOfferId === existing.id) {
          await tx.materialRequirement.update({
            where: { id: req.id },
            data: { selectedOfferId: null },
          });
          warnings.push(
            "Offre retenue archivée suite actualisation prix — sélection à refaire manuellement.",
          );
        }
        const created = await tx.supplyOffer.create({
          data: {
            organizationId: orgId,
            requirementId: existing.requirementId,
            supplierExternalOrgId: existing.supplierExternalOrgId,
            productLabel: mergedInput.productLabel.trim(),
            productRef: mergedInput.productRef?.trim() || null,
            techAttributes:
              op.changes.tech_attributes !== undefined
                ? asJson(op.changes.tech_attributes)
                : asJson(
                    (existing.techAttributes as Record<string, unknown> | null) ??
                      undefined,
                  ),
            equivalenceStatus: "TO_VERIFY",
            unitPrice: mergedInput.unitPrice,
            priceUnit: mergedInput.priceUnit?.trim() || "U",
            priceTaxMode: (mergedInput.priceTaxMode ?? "HT") as never,
            vatRate: mergedInput.vatRate,
            priceSourceType: mergedInput.priceSourceType as never,
            sourceUrl: mergedInput.sourceUrl?.trim() || null,
            quoteNumber: mergedInput.quoteNumber?.trim() || null,
            quoteDocumentRef: mergedInput.quoteDocumentRef?.trim() || null,
            sourceNote:
              [
                mergedInput.sourceNote?.trim() || null,
                `Remplace offre ${existing.id} (prix antérieur ${n(existing.unitPrice) ?? "null"} ${existing.priceUnit} ${existing.priceTaxMode} au ${existing.observedAt?.toISOString().slice(0, 10) ?? existing.recordedAt.toISOString().slice(0, 10)})`,
              ]
                .filter(Boolean)
                .join("\n") || null,
            observedAt: toDate(mergedInput.observedAt),
            recordedAt: new Date(),
            validUntil: toDate(mergedInput.validUntil),
            recordedById: userId,
            packagingLabel: mergedInput.packagingLabel?.trim() || null,
            unitsPerPack: mergedInput.unitsPerPack,
            minimumOrderQuantity: mergedInput.minimumOrderQuantity,
            leadTimeDays: mergedInput.leadTimeDays,
            availabilityNote: mergedInput.availabilityNote?.trim() || null,
            deliveryFee: mergedInput.deliveryFee,
            craneFee: mergedInput.craneFee,
            otherFees: mergedInput.otherFees,
          },
          select: { id: true },
        });
        createdOfferIds.push(created.id);
        appliedOps.push("update_supply_offer:price_history");
      } else {
        await tx.supplyOffer.update({
          where: { id: existing.id },
          data: {
            productLabel: mergedInput.productLabel.trim(),
            productRef: mergedInput.productRef?.trim() || null,
            techAttributes:
              op.changes.tech_attributes !== undefined
                ? asJson(op.changes.tech_attributes)
                : undefined,
            equivalenceStatus:
              op.changes.equivalence_status === "CONFIRMED"
                ? "TO_VERIFY"
                : ((op.changes.equivalence_status ??
                    existing.equivalenceStatus) as never),
            unitPrice: mergedInput.unitPrice,
            priceUnit: mergedInput.priceUnit?.trim() || "U",
            priceTaxMode: (mergedInput.priceTaxMode ?? "HT") as never,
            vatRate: mergedInput.vatRate,
            priceSourceType: mergedInput.priceSourceType as never,
            sourceUrl: mergedInput.sourceUrl?.trim() || null,
            quoteNumber: mergedInput.quoteNumber?.trim() || null,
            quoteDocumentRef: mergedInput.quoteDocumentRef?.trim() || null,
            sourceNote: mergedInput.sourceNote?.trim() || null,
            observedAt: toDate(mergedInput.observedAt),
            validUntil: toDate(mergedInput.validUntil),
            packagingLabel: mergedInput.packagingLabel?.trim() || null,
            unitsPerPack: mergedInput.unitsPerPack,
            minimumOrderQuantity: mergedInput.minimumOrderQuantity,
            leadTimeDays: mergedInput.leadTimeDays,
            availabilityNote: mergedInput.availabilityNote?.trim() || null,
            deliveryFee: mergedInput.deliveryFee,
            craneFee: mergedInput.craneFee,
            otherFees: mergedInput.otherFees,
          },
        });
        appliedOps.push("update_supply_offer");
      }
      continue;
    }

    if (op.op === "archive_supply_offer") {
      const offerId = op.target.offer_id;
      const existing = await tx.supplyOffer.findFirst({
        where: {
          id: offerId,
          organizationId: orgId,
          requirement: { projectId },
        },
        select: { id: true, requirementId: true },
      });
      if (!existing) fail("Offre introuvable");
      await tx.supplyOffer.update({
        where: { id: existing.id },
        data: { archivedAt: new Date() },
      });
      const req = await tx.materialRequirement.findFirst({
        where: { id: existing.requirementId },
        select: { selectedOfferId: true },
      });
      if (req?.selectedOfferId === existing.id) {
        await tx.materialRequirement.update({
          where: { id: existing.requirementId },
          data: { selectedOfferId: null },
        });
      }
      appliedOps.push("archive_supply_offer");
    }
  }

  // Interdiction selectedOfferId implicite — aucune op ne le pose
  const poAfter = await tx.purchaseOrder.count({
    where: { organizationId: orgId },
  });

  return {
    appliedOps,
    createdNeedIds,
    createdOfferIds,
    createdSupplierIds,
    warnings,
    purchaseOrdersCreated: Math.max(0, poAfter - poBefore),
  };
}
