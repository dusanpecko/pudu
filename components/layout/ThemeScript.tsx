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

export default function ThemeScript() {
  return (
    <script
      // Fixed string from this file, never interpolated with anything external.
      dangerouslySetInnerHTML={{ __html: SCRIPT }}
    />
  );
}
