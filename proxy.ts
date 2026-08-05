import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { isEditor } from "@/lib/supabase/editors";
import {
  supabaseConfigured,
  supabasePublishableKey,
  supabaseUrl,
} from "@/lib/supabase/env";

const LOGIN_PATH = "/admin/login";
const NO_ACCESS_PATH = "/admin/no-access";

/**
 * Refreshes the Supabase session and gates the editing tools. Scoped to
 * `/admin` by the matcher below, so the public site keeps running with nothing
 * in front of it.
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

  // A session proves who somebody is, not that they are allowed in. Sign-ups
  // can be enabled on the Supabase project, so the allowlist decides.
  if (user && !isEditor(user.email)) {
    if (pathname === NO_ACCESS_PATH) return response;
    return NextResponse.rewrite(new URL(NO_ACCESS_PATH, request.url));
  }

  if (user && pathname === LOGIN_PATH) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
