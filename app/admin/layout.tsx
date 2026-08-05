import type { Metadata } from "next";
import type { ReactNode } from "react";

import "@/app/admin/admin.css";

export const metadata: Metadata = {
  title: "PUDU — content tooling",
  robots: { index: false, follow: false, nocache: true },
};

/**
 * Content tooling for the people who write the copy. Access is gated by
 * middleware.ts, which requires a Supabase session for every `/admin` route
 * except the sign-in page.
 *
 * This segment sits outside `app/[locale]`, the site's root layout, so it
 * provides its own document shell — and deliberately none of the site's design
 * tokens, so it reads as a tool rather than as the page it edits.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="sk">
      <body>{children}</body>
    </html>
  );
}
