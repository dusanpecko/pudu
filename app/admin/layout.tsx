import type { Metadata } from "next";
import type { ReactNode } from "react";

import AdminNoAccessPage from "@/app/admin/no-access/page";
import AdminNav from "@/components/admin/AdminNav";
import { isEditor } from "@/lib/editors";
import { getEditor } from "@/lib/supabase/server";

import "@/app/admin/admin.css";

export const metadata: Metadata = {
  title: "PUDU — obsah",
  robots: { index: false, follow: false, nocache: true },
};

/**
 * Content tooling for the people who write the copy. Access is gated by
 * proxy.ts, which requires a Supabase session and an allowlisted e-mail for
 * every `/admin` route except the sign-in page.
 *
 * This segment sits outside `app/[locale]`, the site's root layout, so it
 * provides its own document shell — and deliberately none of the site's design
 * tokens, so it reads as a tool rather than as the page it edits.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const editor = await getEditor();
  const allowed = await isEditor(editor?.email);

  // Signed in but not on the list. The refusal is rendered here rather than
  // rewritten to by the middleware, because the list lives in the database and
  // the middleware cannot read it. Rendering it in place of the children also
  // means a page never runs for somebody who may not see it.
  //
  // `editor` has to be present for this branch: without a session the middleware
  // is already sending the visitor to the sign-in page, which this layout wraps
  // and which nobody is allowed into yet by definition.
  if (editor && !allowed) {
    return (
      <html lang="sk">
        <body>
          <AdminNoAccessPage />
        </body>
      </html>
    );
  }

  return (
    <html lang="sk">
      <body>
        {/* The sign-in page renders without the shell, since there is nothing to
            navigate to yet. */}
        {allowed ? <AdminNav editorEmail={editor?.email ?? null} /> : null}
        {children}
      </body>
    </html>
  );
}
