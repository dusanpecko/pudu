import { notFound } from "next/navigation";

import EnquiriesTable from "@/components/admin/EnquiriesTable";
import { products } from "@/data/products";
import {
  countExpired,
  countRecentSpam,
  countSpam,
  loadEnquiries,
  loadSpamEnquiries,
  retentionLabel,
} from "@/lib/enquiries";
import { isEditor } from "@/lib/editors";
import { getEditor } from "@/lib/supabase/server";

/**
 * The enquiries the contact form has collected.
 *
 * Read uncached: this is the record of what customers have written, and a stale
 * list here means somebody is not called back. Access requires a Supabase
 * session, enforced by proxy.ts.
 */
export default async function EnquiriesPage() {
  const editor = await getEditor();
  // Middleware already checks this; repeated here so the personal data below
  // cannot be rendered even if the route is reached another way.
  if (!(await isEditor(editor?.email))) notFound();

  // Slugs read as "PUDU T300" rather than being looked up by whoever reads the
  // enquiry.
  const productNames = Object.fromEntries(
    products.map((product) => [
      product.slug,
      product.slug.replace("pudu-", "PUDU ").toUpperCase(),
    ]),
  );

  // In parallel: five independent reads, and the page shows nothing until it has
  // all of them anyway.
  //
  // `spamTotal` is separate from the list because the list is capped — the number
  // on the delete button has to be the number it will actually delete.
  const [enquiries, spam, expiredCount, spamToday, spamTotal] = await Promise.all([
    loadEnquiries(),
    loadSpamEnquiries(),
    countExpired(),
    countRecentSpam(),
    countSpam(),
  ]);

  return (
    <EnquiriesTable
      enquiries={enquiries}
      productNames={productNames}
      expiredCount={expiredCount}
      retention={retentionLabel()}
      spam={spam}
      spamToday={spamToday}
      spamTotal={spamTotal}
    />
  );
}
