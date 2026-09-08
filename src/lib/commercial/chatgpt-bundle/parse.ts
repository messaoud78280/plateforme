import { createHash } from "crypto";
import {
  asBool,
  asString,
  normalizeEmail,
  normalizeMoneyOrQty,
  normalizePhone,
  normalizeUnit,
  stripCodeFences,
} from "@/lib/commercial/chatgpt-bundle/normalize";
import type {
  BeworkQuoteBundleV1,
  BundleAddress,
  BundleClientEmail,
  BundleLine,
  BundleParseIssue,
  BundleParseResult,
  BundleSection,
  BundleTextBlock,
  BundleVisibility,
  BundleWorkStage,
  BundleMediaItem,
} from "@/lib/commercial/chatgpt-bundle/types";
import { BEWORK_QUOTE_BUNDLE_FORMAT } from "@/lib/commercial/chatgpt-bundle/types";

function issue(
  path: string,
  message: string,
  severity: "error" | "warn" = "error",
): BundleParseIssue {
  return { path, message, severity };
}

function parseAddress(raw: unknown, path: string, issues: BundleParseIssue[]): BundleAddress {
  if (!raw || typeof raw !== "object") {
    return { line1: null, postalCode: null, city: null, country: null };
  }
  const o = raw as Record<string, unknown>;
  return {
    line1: asString(o.line1 ?? o.address_line1 ?? o.street),
    postalCode: asString(o.postal_code ?? o.postalCode ?? o.zip),
    city: asString(o.city),
    country: asString(o.country) ?? "France",
  };
}

function parseEmails(raw: unknown, issues: BundleParseIssue[]): BundleClientEmail[] {
  const out: BundleClientEmail[] = [];
  if (Array.isArray(raw)) {
    for (let i = 0; i < raw.length; i++) {
      const item = raw[i];
      if (typeof item === "string") {
        const email = normalizeEmail(item);
        if (email) out.push({ email, role: out.length === 0 ? "primary" : "secondary" });
        else issues.push(issue(`client.emails[${i}]`, "Email invalide", "warn"));
      } else if (item && typeof item === "object") {
        const o = item as Record<string, unknown>;
        const email = normalizeEmail(o.email);
        if (!email) {
          issues.push(issue(`client.emails[${i}]`, "Email invalide", "warn"));
          continue;
        }
        const roleRaw = String(o.role ?? (out.length === 0 ? "primary" : "secondary"));
        const role =
          roleRaw === "primary" ||
          roleRaw === "secondary" ||
          roleRaw === "professional" ||
          roleRaw === "other"
            ? roleRaw
            : "other";
        out.push({ email, role });
      }
    }
  }
  // Compat : email unique
  return out;
}

function parseVisibility(raw: unknown): BundleVisibility {
  const s = String(raw ?? "client").toLowerCase();
  if (s === "internal" || s === "internal_only" || s === "interne") return "internal";
  return "client";
}

function parseTextBlocks(
  raw: unknown,
  path: string,
  defaultVisibility: BundleVisibility,
  issues: BundleParseIssue[],
): BundleTextBlock[] {
  if (!Array.isArray(raw)) return [];
  const out: BundleTextBlock[] = [];
  for (let i = 0; i < raw.length; i++) {
    const item = raw[i];
    if (typeof item === "string") {
      const content = item.trim();
      if (content) out.push({ title: null, content, visibility: defaultVisibility });
      continue;
    }
    if (!item || typeof item !== "object") {
      issues.push(issue(`${path}[${i}]`, "Bloc texte invalide", "warn"));
      continue;
    }
    const o = item as Record<string, unknown>;
    const content = asString(o.content ?? o.text);
    if (!content) {
      issues.push(issue(`${path}[${i}]`, "Contenu vide", "warn"));
      continue;
    }
    out.push({
      title: asString(o.title),
      content,
      visibility: o.visibility != null ? parseVisibility(o.visibility) : defaultVisibility,
    });
  }
  return out;
}

function parseLine(raw: unknown, path: string, issues: BundleParseIssue[]): BundleLine | null {
  if (!raw || typeof raw !== "object") {
    issues.push(issue(path, "Ligne invalide"));
    return null;
  }
  const o = raw as Record<string, unknown>;
  const designation = asString(o.designation ?? o.title ?? o.label);
  if (!designation) {
    issues.push(issue(`${path}.designation`, "Désignation requise"));
    return null;
  }
  const quantity = normalizeMoneyOrQty(o.quantity ?? o.qty);
  const unitPriceHt = normalizeMoneyOrQty(
    o.unit_price_ht ?? o.unitPriceHt ?? o.unit_price ?? o.pu_ht ?? o.pu,
  );
  if (quantity == null || quantity < 0) {
    issues.push(issue(`${path}.quantity`, "Quantité invalide"));
    return null;
  }
  if (unitPriceHt == null || unitPriceHt < 0) {
    issues.push(issue(`${path}.unit_price_ht`, "PU HT invalide"));
    return null;
  }
  const vat =
    normalizeMoneyOrQty(o.vat_rate ?? o.vatRate ?? o.tva) ??
    null;
  const discount = normalizeMoneyOrQty(o.discount_percent ?? o.discountPercent ?? o.remise);
  return {
    designation,
    description: asString(o.description ?? o.desc),
    quantity,
    unit: normalizeUnit(o.unit ?? o.unite ?? "U"),
    unitPriceHt,
    vatRate: vat,
    discountPercent: discount,
  };
}

function parseSections(raw: unknown, issues: BundleParseIssue[]): BundleSection[] {
  if (!Array.isArray(raw)) {
    issues.push(issue("sections", "sections doit être un tableau"));
    return [];
  }
  const sections: BundleSection[] = [];
  for (let i = 0; i < raw.length; i++) {
    const item = raw[i];
    if (!item || typeof item !== "object") {
      issues.push(issue(`sections[${i}]`, "Section invalide"));
      continue;
    }
    const o = item as Record<string, unknown>;
    const title = asString(o.title ?? o.name) ?? `Lot ${i + 1}`;
    const itemsRaw = o.items ?? o.lines ?? o.ouvrages;
    if (!Array.isArray(itemsRaw) || itemsRaw.length === 0) {
      issues.push(issue(`sections[${i}].items`, "Aucune ligne dans la section", "warn"));
      sections.push({ title, items: [] });
      continue;
    }
    const items: BundleLine[] = [];
    for (let j = 0; j < itemsRaw.length; j++) {
      const line = parseLine(itemsRaw[j], `sections[${i}].items[${j}]`, issues);
      if (line) items.push(line);
    }
    sections.push({ title, items });
  }
  return sections;
}

function fingerprintBundle(bundle: BeworkQuoteBundleV1): string {
  const canonical = JSON.stringify({
    format: bundle.format,
    client: bundle.client,
    site: bundle.site,
    quote: bundle.quote,
    sections: bundle.sections,
    clientAdvice: bundle.clientAdvice,
    reservations: bundle.reservations,
    internalNotes: bundle.internalNotes,
    workStages: bundle.workStages,
    warnings: bundle.warnings,
    mediaManifest: bundle.mediaManifest,
  });
  return createHash("sha256").update(canonical).digest("hex");
}

/** Parse + normalise un collage ChatGPT → bundle validé (sans écriture DB). */
export function parseBeworkQuoteBundle(rawText: string): BundleParseResult {
  const errors: BundleParseIssue[] = [];
  const warnings: BundleParseIssue[] = [];

  if (!rawText.trim()) {
    return {
      ok: false,
      errors: [issue("root", "Collez le bloc BeWork généré par ChatGPT.")],
      rawKept: true,
    };
  }

  let json: unknown;
  try {
    json = JSON.parse(stripCodeFences(rawText));
  } catch {
    return {
      ok: false,
      errors: [
        issue(
          "root",
          "JSON illisible. Demandez à ChatGPT : « Génère le bloc BeWork » (format bework_quote_bundle_v1).",
        ),
      ],
      rawKept: true,
    };
  }

  if (!json || typeof json !== "object") {
    return {
      ok: false,
      errors: [issue("root", "Le dossier doit être un objet JSON.")],
      rawKept: true,
    };
  }

  const root = json as Record<string, unknown>;
  const format = asString(root.format);
  if (format !== BEWORK_QUOTE_BUNDLE_FORMAT) {
    errors.push(
      issue(
        "format",
        format
          ? `Version inconnue « ${format} ». Attendu : ${BEWORK_QUOTE_BUNDLE_FORMAT}.`
          : `Champ format manquant (attendu : ${BEWORK_QUOTE_BUNDLE_FORMAT}).`,
      ),
    );
  }

  const clientRaw = (root.client ?? {}) as Record<string, unknown>;
  let emails = parseEmails(clientRaw.emails, warnings);
  const singleEmail = normalizeEmail(clientRaw.email);
  if (singleEmail && !emails.some((e) => e.email === singleEmail)) {
    emails = [{ email: singleEmail, role: "primary" }, ...emails];
  }
  if (emails.length > 0 && !emails.some((e) => e.role === "primary")) {
    emails = [{ ...emails[0]!, role: "primary" }, ...emails.slice(1)];
  }

  const client = {
    firstName: asString(clientRaw.first_name ?? clientRaw.firstName),
    lastName: asString(clientRaw.last_name ?? clientRaw.lastName),
    company: asString(clientRaw.company ?? clientRaw.company_name ?? clientRaw.societe),
    phone: normalizePhone(clientRaw.phone ?? clientRaw.telephone),
    emails,
    address: parseAddress(clientRaw.address ?? clientRaw.adresse, "client.address", warnings),
  };

  const siteRaw = (root.site ?? {}) as Record<string, unknown>;
  const surfaceRaw = siteRaw.surface;
  let surfaceValue: number | null = null;
  let surfaceUnit: string | null = null;
  if (surfaceRaw && typeof surfaceRaw === "object") {
    const s = surfaceRaw as Record<string, unknown>;
    surfaceValue = normalizeMoneyOrQty(s.value ?? s.qty);
    surfaceUnit = normalizeUnit(s.unit ?? "M²");
  } else {
    surfaceValue = normalizeMoneyOrQty(siteRaw.surface_value ?? siteRaw.surface);
    surfaceUnit = siteRaw.surface_unit ? normalizeUnit(siteRaw.surface_unit) : surfaceValue != null ? "M²" : null;
  }

  const site = {
    sameAsClientAddress: asBool(
      siteRaw.same_as_client_address ?? siteRaw.sameAsClientAddress,
      true,
    ),
    address: siteRaw.address
      ? parseAddress(siteRaw.address, "site.address", warnings)
      : null,
    projectType: asString(siteRaw.project_type ?? siteRaw.projectType ?? siteRaw.type),
    surfaceValue,
    surfaceUnit,
    accessNotes: asString(siteRaw.access_notes ?? siteRaw.accessNotes ?? siteRaw.acces),
    constraints: asString(siteRaw.constraints ?? siteRaw.contraintes),
  };

  const quoteRaw = (root.quote ?? {}) as Record<string, unknown>;
  const vatRaw = (quoteRaw.vat ?? {}) as Record<string, unknown>;
  const quote = {
    title: asString(quoteRaw.title ?? quoteRaw.objet ?? quoteRaw.subject),
    description: asString(quoteRaw.description ?? quoteRaw.desc),
    validityDays: normalizeMoneyOrQty(quoteRaw.validity_days ?? quoteRaw.validityDays),
    pricingStrategy: asString(quoteRaw.pricing_strategy ?? quoteRaw.pricingStrategy),
    vatSuggestedRate:
      normalizeMoneyOrQty(vatRaw.suggested_rate ?? vatRaw.suggestedRate ?? vatRaw.rate) ??
      normalizeMoneyOrQty(quoteRaw.vat_rate ?? quoteRaw.default_vat),
    vatRequiresConfirmation: asBool(
      vatRaw.requires_confirmation ?? vatRaw.requiresConfirmation,
      true,
    ),
  };

  const sectionIssues: BundleParseIssue[] = [];
  const sections = parseSections(root.sections, sectionIssues);
  for (const si of sectionIssues) {
    if (si.severity === "error") errors.push(si);
    else warnings.push(si);
  }
  const lineCount = sections.reduce((n, s) => n + s.items.length, 0);
  if (lineCount === 0) {
    errors.push(issue("sections", "Aucune ligne de chiffrage valide détectée."));
  }

  const clientAdvice = parseTextBlocks(
    root.client_advice ?? root.clientAdvice ?? root.conseils,
    "client_advice",
    "client",
    warnings,
  );
  const reservations = parseTextBlocks(
    root.reservations ?? root.reserves,
    "reservations",
    "client",
    warnings,
  );
  const internalNotes = parseTextBlocks(
    root.internal_notes ?? root.internalNotes ?? root.notes_internes,
    "internal_notes",
    "internal",
    warnings,
  );

  const workStages: BundleWorkStage[] = [];
  const stagesRaw = root.work_stages ?? root.workStages ?? root.etapes;
  if (Array.isArray(stagesRaw)) {
    for (let i = 0; i < stagesRaw.length; i++) {
      const item = stagesRaw[i];
      if (!item || typeof item !== "object") continue;
      const o = item as Record<string, unknown>;
      const title = asString(o.title);
      if (!title) {
        warnings.push(issue(`work_stages[${i}]`, "Titre d’étape manquant", "warn"));
        continue;
      }
      workStages.push({
        order: normalizeMoneyOrQty(o.order) ?? i + 1,
        title,
        description: asString(o.description),
        mediaKey: asString(o.media_key ?? o.mediaKey),
      });
    }
  }

  const warningsList: string[] = [];
  const wRaw = root.warnings ?? root.alertes;
  if (Array.isArray(wRaw)) {
    for (const w of wRaw) {
      const s = asString(w);
      if (s) warningsList.push(s);
    }
  }

  const mediaManifest: BundleMediaItem[] = [];
  const mRaw = root.media_manifest ?? root.mediaManifest ?? root.medias;
  if (Array.isArray(mRaw)) {
    for (let i = 0; i < mRaw.length; i++) {
      const item = mRaw[i];
      if (!item || typeof item !== "object") continue;
      const o = item as Record<string, unknown>;
      const key = asString(o.key);
      const label = asString(o.label) ?? key;
      if (!key || !label) {
        warnings.push(issue(`media_manifest[${i}]`, "Visuel incomplet", "warn"));
        continue;
      }
      const typeRaw = String(o.type ?? "other");
      const type =
        typeRaw === "photo" || typeRaw === "ai_preview" || typeRaw === "diagram"
          ? typeRaw
          : "other";
      mediaManifest.push({
        key,
        label,
        type,
        clientVisible: asBool(o.client_visible ?? o.clientVisible, true),
        disclaimer:
          asString(o.disclaimer) ??
          (type === "ai_preview"
            ? "Illustration non contractuelle — aperçu indicatif du principe d’aménagement proposé."
            : null),
      });
    }
  }

  if (errors.length > 0 || format !== BEWORK_QUOTE_BUNDLE_FORMAT) {
    return {
      ok: false,
      errors:
        errors.length > 0
          ? errors
          : [
              issue(
                "format",
                `Version inconnue. Attendu : ${BEWORK_QUOTE_BUNDLE_FORMAT}.`,
              ),
            ],
      rawKept: true,
    };
  }

  const bundle: BeworkQuoteBundleV1 = {
    format: BEWORK_QUOTE_BUNDLE_FORMAT,
    client,
    site,
    quote,
    sections,
    clientAdvice,
    reservations,
    internalNotes,
    workStages: workStages.sort((a, b) => a.order - b.order),
    warnings: warningsList,
    mediaManifest,
  };

  if (!client.firstName && !client.lastName && !client.company) {
    warnings.push(issue("client", "Client peu renseigné — à compléter", "warn"));
  }
  if (quote.vatRequiresConfirmation && quote.vatSuggestedRate != null) {
    warnings.push(
      issue(
        "quote.vat",
        `TVA proposée : ${quote.vatSuggestedRate} % — à confirmer`,
        "warn",
      ),
    );
  }

  return {
    ok: true,
    bundle,
    warnings,
    fingerprint: fingerprintBundle(bundle),
  };
}

/** Re-valide un bundle déjà en camelCase (éditions UI avant import). */
export function revalidateBeworkQuoteBundle(
  candidate: BeworkQuoteBundleV1,
): BundleParseResult {
  if (!candidate || candidate.format !== BEWORK_QUOTE_BUNDLE_FORMAT) {
    return {
      ok: false,
      errors: [
        issue(
          "format",
          `Version inconnue. Attendu : ${BEWORK_QUOTE_BUNDLE_FORMAT}.`,
        ),
      ],
      rawKept: true,
    };
  }
  const lineCount = (candidate.sections ?? []).reduce(
    (n, s) => n + (s.items?.length ?? 0),
    0,
  );
  if (lineCount === 0) {
    return {
      ok: false,
      errors: [issue("sections", "Aucune ligne de chiffrage valide détectée.")],
      rawKept: true,
    };
  }
  for (const [si, sec] of (candidate.sections ?? []).entries()) {
    if (!sec.title?.trim()) {
      return {
        ok: false,
        errors: [issue(`sections[${si}].title`, "Titre de section requis")],
        rawKept: true,
      };
    }
    for (const [ji, item] of (sec.items ?? []).entries()) {
      if (!item.designation?.trim()) {
        return {
          ok: false,
          errors: [
            issue(
              `sections[${si}].items[${ji}].designation`,
              "Désignation requise",
            ),
          ],
          rawKept: true,
        };
      }
      if (!(item.quantity >= 0) || !Number.isFinite(item.quantity)) {
        return {
          ok: false,
          errors: [issue(`sections[${si}].items[${ji}].quantity`, "Quantité invalide")],
          rawKept: true,
        };
      }
      if (!(item.unitPriceHt >= 0) || !Number.isFinite(item.unitPriceHt)) {
        return {
          ok: false,
          errors: [
            issue(`sections[${si}].items[${ji}].unit_price_ht`, "PU HT invalide"),
          ],
          rawKept: true,
        };
      }
    }
  }
  const bundle: BeworkQuoteBundleV1 = {
    ...candidate,
    format: BEWORK_QUOTE_BUNDLE_FORMAT,
    sections: candidate.sections.map((s) => ({
      title: s.title.trim(),
      items: s.items.map((it) => ({
        ...it,
        designation: it.designation.trim(),
        unit: normalizeUnit(it.unit),
      })),
    })),
  };
  return {
    ok: true,
    bundle,
    warnings: [],
    fingerprint: fingerprintBundle(bundle),
  };
}
