import type { Metadata } from "next";
import type { ReactNode } from "react";

import AdminNav from "@/components/admin/AdminNav";
import { isEditor } from "@/lib/supabase/editors";
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
  // The sign-in and refusal pages render without the shell, since there is
  // nothing to navigate to yet.
  const showNav = isEditor(editor?.email);

  return (
    <html lang="sk">
      <body>
        {showNav ? <AdminNav editorEmail={editor?.email ?? null} /> : null}
        {children}
      </body>
    </html>
  );
}
