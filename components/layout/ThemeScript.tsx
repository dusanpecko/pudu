"use client";

import { useServerInsertedHTML } from "next/navigation";
import { useLayoutEffect, useRef } from "react";

/**
 * Resolves the theme before the page paints.
 *
 * Every page here is prerendered, so the HTML ships with one theme baked into
 * `<html data-theme>`. A toggle that only ran after hydration would therefore
 * show the wrong palette first and correct it a moment later — the flash every
 * theme switcher is judged by. This runs synchronously in `<head>`, before the
 * body exists, so the first paint is already right.
 *
 * It always writes an explicit value. That is what keeps the stylesheet simple:
 * `:root` is the dark palette and `:root[data-theme="light"]` the light one, with
 * no `prefers-color-scheme` duplication of either, because by the time any rule
 * is evaluated the attribute is set.
 *
 * Two separate try/catch blocks, not one. Reading localStorage throws outright in
 * a browser with storage blocked, and a single wrapper would take the system
 * preference down with it — leaving somebody who prefers dark on the prerendered
 * light page for no reason. Guarding only the read lets the preference still
 * apply. The second guard is there because an error thrown in `<head>` would take
 * the page with it, and keeping the server-rendered theme is a fine last resort:
 * the same one a visitor without JavaScript gets.
 */
const SCRIPT = `(function(){
var s=null;
try{s=localStorage.getItem('pudu-theme')}catch(e){}
try{
var t=(s==='light'||s==='dark')?s:(window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');
document.documentElement.dataset.theme=t;
}catch(e){}
})();`;

/**
 * The same decision as {@link SCRIPT}, as a function — for the moments the
 * script cannot reach.
 *
 * An inline script runs once, when the browser parses it. It does not run again
 * when React later *re-creates* the tree it sat in, and a language switch does
 * exactly that: the whole `[locale]` layout is mounted afresh, `<html>` included,
 * which puts the prerendered `data-theme="light"` back on the document. Before
 * this function existed, a visitor reading in dark switched to Czech and got
 * light — every time, silently.
 *
 * Written without type annotations inside the body on purpose: the test runs the
 * body verbatim beside the script, against the same mocked browser, and asserts
 * the two agree on every case. That is the guard against them drifting apart.
 */
function resolveTheme(): "light" | "dark" {
  let stored = null;
  try {
    stored = localStorage.getItem("pudu-theme");
  } catch {
    // Storage blocked. The system preference below still applies.
  }
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

/**
 * Two mechanisms, because one page load has two moments that need the theme.
 *
 * **First paint** is handled by {@link SCRIPT}, injected through
 * `useServerInsertedHTML`. That hook writes into the server-rendered HTML
 * *outside* the React tree, which is the whole point of using it: a bare
 * `<script>` in the tree is fine on the server but is re-created by React DOM on
 * every client mount, where it can never execute — and React 19 says so in the
 * console each time. The hook's output is not part of the tree, so the client
 * never sees a script element at all. It fires only during the initial render on
 * the server; a guard keeps it to one copy even if the stream flushes it more
 * than once.
 *
 * **Every client mount** is handled by the layout effect. Layout effects run
 * after React has committed its DOM changes and before the browser paints, so
 * when a language switch has just written `data-theme="light"` back onto
 * `<html>`, this puts the visitor's choice back in the same frame. No flash, and
 * no dependence on a script that will not run.
 *
 * Renders nothing. Both jobs are side effects on the document.
 */
export default function ThemeScript() {
  const inserted = useRef(false);

  useServerInsertedHTML(() => {
    if (inserted.current) return null;
    inserted.current = true;
    return (
      <script
        id="pudu-theme"
        // Fixed string from this file, never interpolated with anything external.
        dangerouslySetInnerHTML={{ __html: SCRIPT }}
      />
    );
  });

  useLayoutEffect(() => {
    try {
      document.documentElement.dataset.theme = resolveTheme();
    } catch {
      // Keep whatever the server rendered — the same fallback SCRIPT takes.
    }
  }, []);

  return null;
}
