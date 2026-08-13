import "server-only";

import { unstable_cache } from "next/cache";

import {
  emptyDetails,
  type CompanyDetails,
  type Identifier,
  type SocialLink,
} from "@/lib/company-shared";
import { isLocale, locales, type Locale } from "@/lib/i18n";
import { adminClientConfigured, createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Contact details per language, from `company_details`.
 *
 * Reading never throws. A missing table, a missing secret key or an unreachable
 * database all resolve to empty details, and the footer then renders as it did
 * before this existed — a footer without an address is a far better failure than
 * a page that 500s.
 */

export {
  isEmpty,
  platformLabel,
  type CompanyDetails,
  type Identifier,
  type SocialLink,
} from "@/lib/company-shared";

export const COMPANY_TAG = "company";

const TABLE = "company_details";

const SELECT =
  "locale, company_name, address, email, phone, identifiers, social, updated_at, updated_by";

type Row = {
  locale: string;
  company_name: string | null;
  address: string | null;
  email: string | null;
  phone: string | null;
  identifiers: unknown;
  social: unknown;
  updated_at: string | null;
  updated_by: string | null;
};

/**
 * Both lists arrive as free-form JSON, so every entry is checked and anything
 * malformed is dropped rather than rendered. An entry with an empty label or a
 * missing URL would print as a stray bullet or a dead link.
 */
function toIdentifiers(value: unknown): Identifier[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((entry): Identifier[] => {
    if (!entry || typeof entry !== "object") return [];
    const { label, value: text } = entry as Record<string, unknown>;
    if (typeof label !== "string" || typeof text !== "string") return [];
    if (label.trim() === "" || text.trim() === "") return [];
    return [{ label: label.trim(), value: text.trim() }];
  });
}

function toSocial(value: unknown): SocialLink[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((entry): SocialLink[] => {
    if (!entry || typeof entry !== "object") return [];
    const { platform, url } = entry as Record<string, unknown>;
    if (typeof platform !== "string" || typeof url !== "string") return [];
    if (platform.trim() === "" || url.trim() === "") return [];

    // Only http(s) reaches an href: a javascript: URL in the footer would be an
    // injection, and the editor has no reason to need anything else.
    try {
      const parsed = new URL(url.trim());
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return [];
      return [{ platform: platform.trim().toLowerCase(), url: parsed.toString() }];
    } catch {
      return [];
    }
  });
}

function fromRow(row: Row, locale: Locale): CompanyDetails {
  return {
    locale,
    companyName: row.company_name ?? "",
    address: row.address ?? "",
    email: row.email ?? "",
    phone: row.phone ?? "",
    identifiers: toIdentifiers(row.identifiers),
    social: toSocial(row.social),
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
  };
}

async function fetchAll(): Promise<Record<Locale, CompanyDetails>> {
  const result = Object.fromEntries(
    locales.map((locale) => [locale, emptyDetails(locale)]),
  ) as Record<Locale, CompanyDetails>;

  if (!adminClientConfigured) return result;

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.from(TABLE).select(SELECT).returns<Row[]>();

    if (error) {
      // Before the migration runs the table does not exist yet, which is a
      // normal state on a fresh checkout.
      console.warn(`company details unavailable: ${error.message}`);
      return result;
    }

    for (const row of data ?? []) {
      // A row for a language this build does not know is ignored rather than
      // crashing the footer.
      if (isLocale(row.locale)) result[row.locale] = fromRow(row, row.locale);
    }
    return result;
  } catch (error) {
    console.warn(
      `company details unavailable: ${error instanceof Error ? error.message : error}`,
    );
    return result;
  }
}

/**
 * All four languages in one cached read — the footer needs one of them, but
 * caching the set means the admin's four tabs cost a single query too.
 */
const cachedAll = unstable_cache(fetchAll, ["company-details"], {
  tags: [COMPANY_TAG],
  revalidate: false,
});

/** What the footer renders. */
export async function loadCompanyDetails(locale: Locale): Promise<CompanyDetails> {
  return (await cachedAll())[locale];
}

/** Uncached read for the admin page, which must always show the current state. */
export async function loadAllCompanyDetails(): Promise<Record<Locale, CompanyDetails>> {
  return fetchAll();
}

export type CompanyResult<T> =
  | { ok: true; data: T }
  | { ok: false; reason: "unconfigured" | "missing-table" | "error"; message: string };

export type CompanyInput = {
  companyName: string;
  address: string;
  email: string;
  phone: string;
  identifiers: Identifier[];
  social: SocialLink[];
};

export async function saveCompanyDetails(
  locale: Locale,
  input: CompanyInput,
  editorEmail: string | null,
): Promise<CompanyResult<{ locale: Locale }>> {
  if (!adminClientConfigured) {
    return {
      ok: false,
      reason: "unconfigured",
      message: "Chýba SUPABASE_SECRET_KEY v prostredí.",
    };
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from(TABLE).upsert(
    {
      locale,
      company_name: input.companyName.trim(),
      address: input.address.trim(),
      email: input.email.trim(),
      phone: input.phone.trim(),
      identifiers: input.identifiers,
      social: input.social,
      updated_at: new Date().toISOString(),
      updated_by: editorEmail,
    },
    { onConflict: "locale" },
  );

  if (error) {
    const missing =
      error.code === "PGRST205" ||
      error.code === "42P01" ||
      /could not find the table|does not exist/i.test(error.message);
    return {
      ok: false,
      reason: missing ? "missing-table" : "error",
      message: missing
        ? "Tabuľka company_details neexistuje — spustite migráciu 0004."
        : error.message,
    };
  }

  return { ok: true, data: { locale } };
}
