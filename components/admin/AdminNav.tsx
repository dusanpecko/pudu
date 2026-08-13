"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { signOut } from "@/app/admin/actions";

type AdminNavProps = {
  editorEmail: string | null;
};

const LINKS = [
  { href: "/admin", label: "Prehľad" },
  { href: "/admin/translations-manager", label: "Preklady" },
  { href: "/admin/gallery", label: "Galéria" },
  { href: "/admin/settings", label: "Nastavenia" },
];

/** Shared header for the whole /admin subtree. */
export default function AdminNav({ editorEmail }: AdminNavProps) {
  const pathname = usePathname() ?? "";

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-400 flex-wrap items-center justify-between gap-3 px-6 py-3">
        <div className="flex items-center gap-1">
          <span className="mr-3 text-sm font-semibold tracking-tight">PUDU obsah</span>
          {LINKS.map((link) => {
            const active =
              link.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-lg px-3 py-1.5 text-sm ${
                  active
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-3 text-sm">
          {editorEmail ? <span className="text-slate-500">{editorEmail}</span> : null}
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-50"
            >
              Odhlásiť sa
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
