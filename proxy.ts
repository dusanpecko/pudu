import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import {
  supabaseConfigured,
  supabasePublishableKey,
  supabaseUrl,
} from "@/lib/supabase/env";

const LOGIN_PATH = "/admin/login";

/**
 * Refreshes the Supabase session and requires one for the editing tools. Scoped
 * to `/admin` by the matcher below, so the public site keeps running with
 * nothing in front of it.
 *
 * It answers one question — is anybody signed in — and leaves the other one,
 * whether that person is allowed in, to the admin layout. That split is forced:
 * the allowlist now lives in the database, reaching it means the module that
 * holds the secret key, and that module is marked `server-only`, which throws if
 * it is imported here. It is also the better place for the decision. The layout
 * can render the refusal as a page instead of rewriting to one, and it re-reads
 * the list on every request, so access revoked a minute ago is gone now.
 *
 * Named `proxy` in a `proxy.ts` file: Next 16 deprecated the `middleware`
 * convention and renamed it.
 */
export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });

  if (!supabaseConfigured) {
    // Without configuration the tools cannot authenticate anybody, so they stay
    // closed rather than open.
    return NextResponse.rewrite(new URL("/admin/unavailable", request.url));
  }

  const supabase = createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // getUser() revalidates the token with Supabase; the cookie alone is not
  // trusted.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && pathname !== LOGIN_PATH) {
    const target = new URL(LOGIN_PATH, request.url);
    target.searchParams.set("next", pathname);
    return NextResponse.redirect(target);
  }

  if (user && pathname === LOGIN_PATH) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
