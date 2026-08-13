"use client";

export type Theme = "light" | "dark";

type ThemeToggleProps = {
  /** Accessible name of the control. */
  label: string;
};

/** Same key ThemeScript reads, so a reload keeps the choice. */
const STORAGE_KEY = "pudu-theme";

/**
 * Switches between the two palettes.
 *
 * Which glyph shows is decided by CSS from the same `data-theme` attribute
 * ThemeScript sets before the first paint — not by React state. Both are in the
 * markup and the stylesheet hides one. That matters: state would be resolved at
 * hydration, so a visitor whose stored theme differs from the prerendered one
 * would see the wrong symbol until then, which is the flash this whole
 * arrangement exists to avoid.
 *
 * It follows that the component holds no state at all. The attribute on the
 * document is the single source of truth, read on click and written back to it.
 */
export default function ThemeToggle({ label }: ThemeToggleProps) {
  const toggle = () => {
    const root = document.documentElement;
    const next: Theme = root.dataset.theme === "light" ? "dark" : "light";
    root.dataset.theme = next;

    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage blocked: the theme still changes for this visit, it just will not
      // be remembered. Not worth telling the visitor about.
    }
  };

  return (
    <button type="button" className="themebtn" onClick={toggle} aria-label={label}>
      {/* Decoration — the button's own name says what it does, and naming the
          target theme here would need state again. */}
      <span className="themeicon sun" aria-hidden="true">
        ☀
      </span>
      <span className="themeicon moon" aria-hidden="true">
        ☾
      </span>
    </button>
  );
}
