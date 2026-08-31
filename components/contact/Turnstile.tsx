"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

import { htmlLang, type Locale } from "@/lib/i18n";

/**
 * The Cloudflare Turnstile widget.
 *
 * Rendered explicitly rather than by the script's own sweep for `.cf-turnstile`
 * elements. The sweep runs once when the script loads and finds whatever is in the
 * DOM at that instant, which in a hydrated React tree is a race nobody can win
 * reliably; calling `render` from an effect happens after the container exists, by
 * construction.
 *
 * The token is taken from the `callback` and handed upwards, rather than left to
 * the hidden input Turnstile can inject by itself. That injection is real, and it
 * would have been less code — but Cloudflare documents it only for *implicit*
 * rendering, where the widget is a `.cf-turnstile` div inside a form. Relying on
 * it here would be building on behaviour that happens to work rather than
 * behaviour that is promised, so `response-field` is switched off deliberately and
 * the form owns the field. It also removes the ambiguity of two inputs with the
 * same name, which is what would happen if the injection ever changed.
 */

type TurnstileState = {
  render: (
    container: HTMLElement,
    options: Record<string, unknown>,
  ) => string | undefined;
  remove: (widgetId: string) => void;
  reset: (widgetId?: string) => void;
  /** Runs its callback once the API is initialised. Optional across versions. */
  ready?: (callback: () => void) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileState;
  }
}

type TurnstileProps = {
  siteKey: string;
  /**
   * Names this challenge, both in Cloudflare's analytics and in the token the
   * server checks. Passed in rather than written here, because lib/turnstile.ts
   * holds the one definition and this file cannot import it — `server-only`.
   */
  action: string;
  locale: Locale;
  /**
   * Any value that changes when the submission has come back from the server.
   *
   * Turnstile tokens are single-use. Once the server has spent one, the widget is
   * holding a value that will never verify again — so a visitor who fixes a typo
   * and resubmits would be told their verification failed, for a reason that is
   * ours and not theirs. Watching this identity means the next attempt carries a
   * fresh token.
   */
  resetOn: unknown;
  /**
   * Receives the solved token, or an empty string whenever there is no longer a
   * usable one — expired, errored, or just reset.
   *
   * **Must be referentially stable.** It sits in the render effect's dependencies,
   * so a fresh closure on every render would tear the widget down and build it
   * again, losing the visitor's solved challenge each time the form re-renders. A
   * `useState` setter is stable and is what the form passes.
   */
  onToken: (token: string) => void;
};

export default function Turnstile({
  siteKey,
  action,
  locale,
  resetOn,
  onToken,
}: TurnstileProps) {
  const container = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!ready || !container.current || widget.current) return;
    const api = window.turnstile;
    if (!api) return;

    const element = container.current;
    const create = () => {
      widget.current =
        api.render(element, {
          sitekey: siteKey,
          action,
          language: htmlLang(locale),
          theme: "auto",
          size: "flexible",
          // The form owns the hidden field — see the note at the top.
          "response-field": false,
          callback: (token: string) => onToken(token),
          // A token that has expired or errored is worse than none: it would be
          // submitted, spent, and rejected. Cleared, so the widget's own retry is
          // what the visitor waits for.
          "expired-callback": () => onToken(""),
          "error-callback": () => onToken(""),
        }) ?? null;
    };

    // `ready` guarantees the API is initialised. Not every version exposes it, so
    // the direct call remains the fallback rather than the assumption.
    if (api.ready) api.ready(create);
    else create();

    return () => {
      if (widget.current) api.remove(widget.current);
      widget.current = null;
    };
  }, [ready, siteKey, action, locale, onToken]);

  const settled = useRef(false);
  useEffect(() => {
    // The first run is the mount, where the widget has just minted a token and
    // resetting it would throw that token away before anybody used it.
    if (!settled.current) {
      settled.current = true;
      return;
    }
    if (!widget.current) return;

    // Cleared before the reset, not after: between the two the form holds a token
    // the server has already spent, and a submission in that window would be
    // rejected for a reason the visitor cannot see.
    onToken("");
    window.turnstile?.reset(widget.current);
  }, [resetOn, onToken]);

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        // onReady rather than onLoad: it fires on a remount too, when the script
        // is already cached and onLoad would never fire again.
        onReady={() => setReady(true)}
      />
      <div className="turnstile" ref={container} />
    </>
  );
}
