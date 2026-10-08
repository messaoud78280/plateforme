/**
 * bework_chatgpt_context_v1 — section SUPPLY (Approvisionnements).
 * Lecture seule. Aucun prix / fournisseur / URL inventé.
 */
import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { buildChatgptContextSkeleton } from "@/lib/bework-patch/context";
import type { BeworkChatgptContextV1 } from "@/lib/bework-patch/types";
import { getSupplyOfferFreshness } from "@/lib/supply/offer-freshness";
import { calculateMaterialRequirementProgress } from "@/lib/materiaux/progress";

const SUPPLY_ANTI_INVENTION_RULES = [
  "RÈGLE ABSOLUE — Ne jamais inventer : fournisseur, agence, produit, référence, prix, URL, stock, disponibilité, délai, conditionnement, frais de livraison, frais de grutage, minimum de commande, caractéristiques techniques.",
  "Si une information n’est pas réellement disponible : utiliser null ou « À confirmer ». ABSENCE D’INFORMATION ≠ 0.",
  "Tout prix WEB_VERIFIED exige : fournisseur réel, produit réel, sourceUrl http(s) réelle, prix observé, unité tarifaire, HT ou TTC, date réelle du relevé (fiche produit / tarif officiel — pas un snippet Google).",
  "Un fournisseur « sur devis » : unitPrice = null + note explicite. Mieux vaut un prix null qu’un prix inventé.",
  "Ne jamais modifier selectedOfferId, PurchaseOrder, métré, devis client ni Planning V2 via ce patch.",
  "Ne jamais passer equivalenceStatus à CONFIRMED sans validation professionnelle — défaut TO_VERIFY (PROBABLE si caractéristiques clairement alignées).",
  "deliveryFee / craneFee / otherFees : null = inconnu ; 0 = réellement gratuit. Ne jamais estimer.",
  "Disponibilité : ne pas écrire « Disponible » sans preuve source. Sinon null ou « Disponibilité à confirmer ».",
  "unitsPerPack / conditionnement : uniquement si la source le permet — jamais déduire arbitrairement.",
  "Priorité géographique : proximité pour béton, granulats, évacuation, engins, locations, transport lourd. Produits standards : livraisons nationales acceptables. Aucune enseigne hardcodée.",
  "Hypothèses (ex. pelle 8 t / 2 j) : signaler is_hypothesis: true — jamais comme certitude.",
  "Le prix de vente client (devis) n’est JAMAIS une preuve de prix fournisseur.",
  "Sortie attendue : bework_patch_v1 uniquement (pas de format supply dédié).",
].join("\n");

function n(v: unknown): number | null {
  if (v == null || v === "") return null;
  const x = typeof v === "number" ? v : Number(v);
  return Number.isFinite(x) ? x : null;
}

function iso(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null;
}

/** Empreinte déterministe état Approvisionnements (besoins + offres actives + sélection). */
export function computeSupplyContextVersion(input: {
  projectId: string;
  needs: Array<{
    id: string;
    updatedAt: string;
    selectedOfferId: string | null;
    quantityRequired: number;
    status: string;
  }>;
  offers: Array<{ id: string; updatedAt: string; unitPrice: number | null }>;
}): number {
  const payload = JSON.stringify({
    p: input.projectId,
    n: input.needs
      .map((x) =>
        [
          x.id,
          x.updatedAt,
          x.selectedOfferId ?? "",
          x.quantityRequired,
          x.status,
        ].join("|"),
      )
      .sort(),
    o: input.offers
      .map((x) => [x.id, x.updatedAt, x.unitPrice ?? "null"].join("|"))
      .sort(),
  });
  const hex = createHash("sha256").update(payload).digest("hex").slice(0, 12);
  return Number.parseInt(hex, 16);
}

export async function buildSupplyContext(
  orgId: string,
  project: { id: string; title: string },
  entityId: string,
): Promise<BeworkChatgptContextV1 | null> {
  // entityId = projectId (hub Approvisionnements)
  if (entityId !== project.id) return null;

  const projectFull = await prisma.project.findFirst({
    where: { id: project.id, organizationId: orgId },
    select: {
      id: true,
      title: true,
      siteAddress: true,
      siteCity: true,
      organization: { select: { id: true, name: true } },
    },
  });
  if (!projectFull?.organization) return null;

  const [
    visit,
    study,
    quote,
    plan,
    requirements,
    suppliers,
  ] = await Promise.all([
    prisma.siteVisit.findFirst({
      where: { organizationId: orgId, projectId: project.id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        subject: true,
        status: true,
        comments: true,
        clientNeed: true,
        prepJson: true,
      },
    }),
    prisma.prepStudy.findFirst({
      where: {
        organizationId: orgId,
        projectId: project.id,
        archivedAt: null,
      },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        version: true,
        lines: {
          orderBy: { sortOrder: "asc" },
          select: {
            code: true,
            designation: true,
            description: true,
            unit: true,
            lot: true,
            declaredQuantity: true,
            role: true,
            provenance: true,
            notes: true,
          },
          take: 200,
        },
      },
    }),
    prisma.commercialQuote.findFirst({
      where: { organizationId: orgId, projectId: project.id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        number: true,
        subject: true,
        currentVersion: {
          select: {
            lines: {
              orderBy: { sortOrder: "asc" },
              select: {
                id: true,
                designation: true,
                quantity: true,
                unit: true,
              },
              take: 120,
            },
          },
        },
      },
    }),
    prisma.prepSchedulePlan.findFirst({
      where: { organizationId: orgId, projectId: project.id, status: "CURRENT" },
      orderBy: { revisionNumber: "desc" },
      select: {
        id: true,
        title: true,
        startDate: true,
        endDateBase: true,
        tasks: {
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true,
            durationDays: true,
          },
          take: 80,
        },
      },
    }),
    prisma.materialRequirement.findMany({
      where: { organizationId: orgId, projectId: project.id },
      orderBy: [{ status: "asc" }, { label: "asc" }],
      include: {
        offers: {
          where: { archivedAt: null },
          include: {
            supplier: {
              select: {
                id: true,
                name: true,
                tradeName: true,
                city: true,
                parentExternalOrgId: true,
                parent: { select: { id: true, name: true, tradeName: true } },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        orderLinks: {
          select: {
            quantityAllocated: true,
            purchaseOrderLine: {
              select: {
                quantity: true,
                order: { select: { id: true, number: true, status: true } },
                receiptLines: {
                  select: {
                    receivedQty: true,
                    damagedQty: true,
                    refusedQty: true,
                    receipt: { select: { cancelledAt: true } },
                  },
                },
              },
            },
          },
        },
      },
      take: 200,
    }),
    prisma.externalOrganization.findMany({
      where: {
        hostOrganizationId: orgId,
        type: { in: ["SUPPLIER", "SUBCONTRACTOR"] },
        status: "ACTIVE",
      },
      select: {
        id: true,
        name: true,
        tradeName: true,
        parentExternalOrgId: true,
        address: true,
        city: true,
        zipCode: true,
        phone: true,
        email: true,
        website: true,
        parent: { select: { id: true, name: true, tradeName: true } },
      },
      orderBy: { name: "asc" },
      take: 80,
    }),
  ]);

  const executableLines =
    study?.lines.filter((l) => {
      const role = (l.role ?? "quote").toLowerCase();
      return role !== "indicator" && role !== "logistics";
    }) ?? [];

  const supplyNeeds = requirements.map((r) => {
    const allocations = r.orderLinks.map((link) => {
      const line = link.purchaseOrderLine;
      let received = 0;
      for (const rl of line.receiptLines) {
        if (rl.receipt.cancelledAt) continue;
        received += Math.max(
          0,
          Number(rl.receivedQty) -
            Number(rl.damagedQty) -
            Number(rl.refusedQty),
        );
      }
      return {
        quantityAllocated: Number(link.quantityAllocated),
        lineUnit: r.unit,
        orderStatus: line.order.status,
        receivedConforming: received,
      };
    });
    const progress = calculateMaterialRequirementProgress({
      status: r.status,
      quantityRequired: Number(r.quantityRequired),
      unit: r.unit,
      allocations,
    });
    return {
      requirement_id: r.id,
      category: r.category,
      label: r.label,
      description: r.description,
      procurement_mode: r.procurementMode,
      source_quantity: n(r.sourceQuantity),
      calculated_quantity: n(r.calculatedQuantity),
      validated_order_quantity:
        n(r.validatedOrderQuantity) ?? Number(r.quantityRequired),
      unit: r.unit,
      quantity_source_kind: r.sourceType,
      loss_factor: n(r.lossFactor),
      packaging: r.packaging,
      packaging_size: n(r.packagingSize),
      packaging_unit: r.packagingUnit,
      takeoff_codes: Array.isArray(r.takeoffCodes) ? r.takeoffCodes : [],
      schedule_task_ids: Array.isArray(r.scheduleTaskIds)
        ? r.scheduleTaskIds
        : [],
      needed_at: iso(r.neededAt),
      order_deadline_at: iso(r.orderDeadlineAt),
      source_drift: r.sourceDrift,
      status: r.status,
      selected_offer_id: r.selectedOfferId,
      coverage: {
        state: progress.coverageState,
        ordered: progress.ordered,
        received: progress.received,
        remaining_to_order: progress.remainingToOrder,
      },
      has_purchase_order_links: r.orderLinks.length > 0,
      offers: r.offers.map((o) => ({
        offer_id: o.id,
        supplier_external_org_id: o.supplierExternalOrgId,
        supplier_name: o.supplier.tradeName || o.supplier.name,
        agency:
          o.supplier.parent
            ? `${o.supplier.parent.tradeName || o.supplier.parent.name} — ${
                o.supplier.city ? `agence de ${o.supplier.city}` : o.supplier.name
              }`
            : o.supplier.tradeName || o.supplier.name,
        product_label: o.productLabel,
        product_ref: o.productRef,
        tech_attributes: o.techAttributes,
        equivalence_status: o.equivalenceStatus,
        unit_price: n(o.unitPrice),
        price_unit: o.priceUnit,
        price_tax_mode: o.priceTaxMode,
        vat_rate: n(o.vatRate),
        price_source_type: o.priceSourceType,
        source_url: o.sourceUrl,
        quote_number: o.quoteNumber,
        observed_at: iso(o.observedAt),
        recorded_at: iso(o.recordedAt),
        valid_until: iso(o.validUntil),
        packaging_label: o.packagingLabel,
        units_per_pack: n(o.unitsPerPack),
        minimum_order_quantity: n(o.minimumOrderQuantity),
        lead_time_days: n(o.leadTimeDays),
        availability_note: o.availabilityNote,
        delivery_fee: n(o.deliveryFee),
        crane_fee: n(o.craneFee),
        other_fees: n(o.otherFees),
        freshness: getSupplyOfferFreshness({
          validUntil: o.validUntil,
          observedAt: o.observedAt,
          recordedAt: o.recordedAt,
        }),
        is_selected: r.selectedOfferId === o.id,
      })),
    };
  });

  const contextVersion = computeSupplyContextVersion({
    projectId: project.id,
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

  // Contraintes visite si renseignées (prepJson)
  let visitConstraints: Record<string, unknown> | null = null;
  if (visit?.prepJson && typeof visit.prepJson === "object") {
    const prep = visit.prepJson as Record<string, unknown>;
    const keys = [
      "deliveryConstraints",
      "truckAccess",
      "storage",
      "toupieAccess",
      "crane",
      "wasteEvacuation",
      "neighborhood",
      "access",
      "logistics",
    ];
    const picked: Record<string, unknown> = {};
    for (const k of keys) {
      if (prep[k] != null && prep[k] !== "") picked[k] = prep[k];
    }
    if (Object.keys(picked).length) visitConstraints = picked;
  }

  const skeleton = buildChatgptContextSkeleton({
    section: "SUPPLY",
    project: {
      id: projectFull.id,
      title: projectFull.title,
    },
    target: {
      entity_type: "SUPPLY_WORKSPACE",
      id: project.id,
      version: contextVersion,
      base_version: contextVersion,
    },
  });

  return {
    ...skeleton,
    organization: {
      id: projectFull.organization.id,
      name: projectFull.organization.name,
    },
    project: {
      id: projectFull.id,
      title: projectFull.title,
      site_address: projectFull.siteAddress,
      site_city: projectFull.siteCity,
    },
    data: {
      instructions: SUPPLY_ANTI_INVENTION_RULES,
      chantier: {
        id: projectFull.id,
        title: projectFull.title,
        address: projectFull.siteAddress,
        postal_code: null,
        city: projectFull.siteCity,
        organization: projectFull.organization,
      },
      visit: visit
        ? {
            id: visit.id,
            subject: visit.subject,
            status: visit.status,
            constraints: visitConstraints,
            comments: visit.comments,
            client_need: visit.clientNeed,
          }
        : null,
      takeoff: study
        ? {
            study_id: study.id,
            version: study.version,
            title: study.title,
            executable_lines: executableLines.map((l) => ({
              code: l.code,
              designation: l.designation,
              description: l.description,
              quantity: n(l.declaredQuantity),
              unit: l.unit,
              lot: l.lot,
              provenance: l.provenance,
              notes: l.notes,
            })),
            note: "Ne pas traiter indicateurs / totaux / lignes non exécutables comme besoins opérationnels.",
          }
        : null,
      quote: quote
        ? {
            id: quote.id,
            number: quote.number,
            subject: quote.subject,
            lines: (quote.currentVersion?.lines ?? []).map((l) => ({
              item_id: l.id,
              designation: l.designation,
              quantity: n(l.quantity),
              unit: l.unit,
            })),
            warning:
              "Le prix de vente client n’est jamais une preuve d’un prix fournisseur.",
          }
        : null,
      planning: plan
        ? {
            plan_id: plan.id,
            title: plan.title,
            start_date: iso(plan.startDate),
            end_date: iso(plan.endDateBase),
            tasks: plan.tasks.map((t) => ({
              task_id: t.id,
              name: t.name,
              start_date: iso(t.startDate),
              end_date: iso(t.endDate),
              duration_days: n(t.durationDays),
            })),
          }
        : {
            note: "Aucun planning CURRENT — Approvisionnements reste accessible.",
          },
      supply_needs: supplyNeeds,
      known_suppliers: suppliers.map((s) => ({
        id: s.id,
        name: s.name,
        trade_name: s.tradeName,
        parent_external_org_id: s.parentExternalOrgId,
        parent_name: s.parent
          ? s.parent.tradeName || s.parent.name
          : null,
        address: s.address,
        city: s.city,
        zip_code: s.zipCode,
        phone: s.phone,
        email: s.email,
        website: s.website,
        note: "Un fournisseur connu ne signifie jamais que ses anciens prix sont encore valides.",
      })),
      blocks_for_modifier_par_bloc: [
        "Besoin (add_supply_need / update_supply_need / cancel_supply_need)",
        "Offre fournisseur (add_supply_offer / update_supply_offer / archive_supply_offer)",
        "Prix / source (champs unit_price, price_source_type, source_url, observed_at)",
        "Logistique (delivery_fee, crane_fee, other_fees, lead_time_days, availability_note)",
        "Fournisseur/agence (add_supplier)",
      ],
    },
    relationships: {
      notes: [
        "selectedOfferId non modifiable via patch SUPPLY — le professionnel retient l’offre dans le cockpit.",
        "Actualisation prix : préférer archive + nouvelle offre (historique conservé) plutôt qu’écrasement silencieux.",
      ],
    },
  };
}
