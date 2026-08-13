import { notFound } from "next/navigation";

import ContactsManager from "@/components/admin/ContactsManager";
import { loadAllCompanyDetails } from "@/lib/company";
import { isEditor } from "@/lib/supabase/editors";
import { getEditor } from "@/lib/supabase/server";

/**
 * Contact details shown in the footer, one set per language.
 *
 * Read uncached, so the form always shows what is actually stored rather than
 * what the site currently serves. Access requires a Supabase session, enforced
 * by proxy.ts.
 */
export default async function ContactsPage() {
  const editor = await getEditor();
  // Middleware already checks this; repeated here so nothing renders even if
  // the route is reached another way.
  if (!isEditor(editor?.email)) notFound();

  return <ContactsManager details={await loadAllCompanyDetails()} />;
}
