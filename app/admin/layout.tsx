import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import "@/app/admin/admin.css";

export const metadata: Metadata = {
  title: "PUDU — content tooling",
  robots: { index: false, follow: false },
};

/**
 * Authoring tools, available only while running `next dev`. In any other
 * environment the whole `/admin` subtree answers 404, so nothing ships to the
 * public site and there is no login to protect.
 *
 * This segment sits outside `app/[locale]`, which is the site's root layout, so
 * it provides its own document shell.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  if (process.env.NODE_ENV !== "development") notFound();

  return (
    <html lang="sk">
      <body>{children}</body>
    </html>
  );
}
