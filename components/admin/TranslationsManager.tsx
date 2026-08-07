"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  cleanupRedundant,
  discardDraft,
  publish,
  saveDraft,
} from "@/app/admin/translations-manager/actions";
import { locales, localeLabels, type Locale } from "@/lib/i18n";
import {
  applyEdits,
  buildSourceFiles,
  flattenStrings,
  readPath,
  serializeProductTexts,
  serializeUiTranslations,
  type DraftEdit,
  type OverrideKind,
  type OverrideMap,
  type OverrideSet,
  type SourceFile,
  type StringTree,
} from "@/lib/translation-source";

const sourceFiles = buildSourceFiles(locales);

/** How long the editor has to stop typing before the draft is written. */
const AUTOSAVE_DELAY = 1000;

type Trees = Record<string, StringTree>;

type TranslationsManagerProps = {
  ui: Trees;
  products: Trees;
  /** Autosaved work in progress. */
  draft: OverrideSet;
  /** What the website currently renders. */
  live: OverrideSet;
};

type Group = {
  id: string;
  label: string;
  kind: OverrideKind;
  key: string;
};

type Row = {
  path: string;
  label: string;
};

type SaveStatus = "idle" | "pending" | "saving" | "saved" | "error";

function basename(path: string): string {
  return path.slice(path.lastIndexOf("/") + 1);
}

function editKey(kind: OverrideKind, locale: Locale, path: string): string {
  return `${kind}:${locale}:${path}`;
}

/** Reads one override, treating a missing entry as "no override". */
function overrideOf(
  set: OverrideSet,
  kind: OverrideKind,
  locale: Locale,
  path: string,
): string | undefined {
  return set[kind][locale]?.[path];
}

/** Returns a copy with one override set, or removed when `value` is null. */
function withOverride(
  set: OverrideSet,
  kind: OverrideKind,
  locale: Locale,
  path: string,
  value: string | null,
): OverrideSet {
  const forLocale: OverrideMap = { ...(set[kind][locale] ?? {}) };
  if (value === null) delete forLocale[path];
  else forLocale[path] = value;

  return {
    ...set,
    [kind]: { ...set[kind], [locale]: forLocale },
  };
}

/** Returns a copy with the given rows dropped from both sides. */
function withoutKeys(set: OverrideSet, keys: OverrideAddress[]): OverrideSet {
  let next = set;
  for (const { kind, locale, path } of keys) {
    next = withOverride(next, kind, locale, path, null);
  }
  return next;
}

type OverrideAddress = { kind: OverrideKind; locale: Locale; path: string };

export default function TranslationsManager({
  ui,
  products,
  draft: initialDraft,
  live: initialLive,
}: TranslationsManagerProps) {
  const trees = useMemo<Record<OverrideKind, Trees>>(
    () => ({ ui, products }),
    [ui, products],
  );

  const [draft, setDraft] = useState<OverrideSet>(initialDraft);
  const [live, setLive] = useState<OverrideSet>(initialLive);

  const groups = useMemo<Group[]>(() => {
    const uiGroups = Object.keys(ui.sk).map((key) => ({
      id: `ui:${key}`,
      label: key,
      kind: "ui" as const,
      key,
    }));
    const productGroups = Object.keys(products.sk).map((key) => ({
      id: `products:${key}`,
      label: key.replace("pudu-", "PUDU ").toUpperCase(),
      kind: "products" as const,
      key,
    }));
    return [...uiGroups, ...productGroups];
  }, [ui, products]);

  const [activeGroupId, setActiveGroupId] = useState(groups[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [missingOnly, setMissingOnly] = useState(false);
  const [changedOnly, setChangedOnly] = useState(false);

  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  // Edits waiting to be written, keyed so a second change to the same cell
  // replaces the first instead of queueing behind it.
  const pending = useRef(new Map<string, DraftEdit>());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeGroup = groups.find((group) => group.id === activeGroupId) ?? groups[0];

  const defaultOf = (group: Group, path: string, locale: Locale): string =>
    readPath(trees[group.kind][locale], path) ?? "";

  const valueOf = (group: Group, path: string, locale: Locale): string =>
    overrideOf(draft, group.kind, locale, path) ?? defaultOf(group, path, locale);

  /**
   * True when the draft actually says something different from the repository.
   *
   * An override that matches the file is not an edit: that is what a key looks
   * like once a download has been committed, and it should stop being flagged
   * the moment the deployment catches up.
   */
  const isOverridden = (group: Group, path: string, locale: Locale): boolean => {
    const override = overrideOf(draft, group.kind, locale, path);
    return override !== undefined && override !== defaultOf(group, path, locale);
  };

  /** True when the draft has not been published yet. */
  const isUnpublished = (group: Group, path: string, locale: Locale): boolean =>
    overrideOf(draft, group.kind, locale, path) !==
    overrideOf(live, group.kind, locale, path);

  /**
   * Overrides for one file that genuinely differ from the committed default —
   * the ones worth reporting as edits.
   */
  const effectiveOverrides = (kind: OverrideKind, locale: Locale): string[] =>
    Object.entries(draft[kind][locale] ?? {})
      .filter(([path, value]) => {
        const fileValue = readPath(trees[kind][locale], path);
        // A key the files no longer have cannot be an edit either: the merge
        // ignores it, so it changes nothing on the site.
        return fileValue !== undefined && fileValue !== value;
      })
      .map(([path]) => path);

  /** Keys in one file whose draft has not been published. */
  const unpublishedIn = (kind: OverrideKind, locale: Locale): string[] => {
    const drafted = draft[kind][locale] ?? {};
    const published = live[kind][locale] ?? {};

    return [...new Set([...Object.keys(drafted), ...Object.keys(published)])].filter(
      (path) => drafted[path] !== published[path],
    );
  };

  /**
   * Overrides the repository has caught up with — published, matching the file,
   * and therefore only still there to be retired. Mirrors `redundantOverrides`
   * on the server, which is what actually decides when the button is pressed.
   */
  const redundant = useMemo<OverrideAddress[]>(() => {
    const found: OverrideAddress[] = [];

    for (const kind of ["ui", "products"] as const) {
      for (const locale of locales) {
        const drafted = draft[kind][locale] ?? {};
        const published = live[kind][locale] ?? {};

        for (const [path, value] of Object.entries(drafted)) {
          if (published[path] !== value) continue;
          const fileValue = readPath(trees[kind][locale], path);
          if (fileValue === undefined || fileValue === value) {
            found.push({ kind, locale, path });
          }
        }
      }
    }

    return found;
  }, [draft, live, trees]);

  const flush = useCallback(async () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    if (pending.current.size === 0) return;

    const batch = [...pending.current.values()];
    pending.current.clear();
    setSaveStatus("saving");

    try {
      const result = await saveDraft(batch);
      if (result.status === "error") {
        // Put the batch back so the next attempt retries it, but never over a
        // newer edit to the same cell.
        for (const edit of batch) {
          const key = editKey(edit.kind, edit.locale, edit.path);
          if (!pending.current.has(key)) pending.current.set(key, edit);
        }
        setSaveStatus("error");
        setMessage(result.message);
        return;
      }

      setMessage("");
      setSaveStatus(pending.current.size > 0 ? "pending" : "saved");
    } catch (error) {
      for (const edit of batch) {
        const key = editKey(edit.kind, edit.locale, edit.path);
        if (!pending.current.has(key)) pending.current.set(key, edit);
      }
      setSaveStatus("error");
      setMessage(error instanceof Error ? error.message : "Uloženie zlyhalo.");
    }
  }, []);

  const queue = useCallback(
    (edit: DraftEdit) => {
      pending.current.set(editKey(edit.kind, edit.locale, edit.path), edit);
      setSaveStatus("pending");

      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), AUTOSAVE_DELAY);
    },
    [flush],
  );

  // A pending autosave would be lost on navigation; warn instead of losing it.
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (pending.current.size > 0) event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => {
      window.removeEventListener("beforeunload", warn);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const setValue = (group: Group, path: string, locale: Locale, next: string) => {
    // Typing the repository's own wording back in means "no override" — that
    // keeps the table free of rows that change nothing, and publishing it
    // removes whatever was live for the key.
    const value = next === defaultOf(group, path, locale) ? null : next;

    setDraft((current) => withOverride(current, group.kind, locale, path, value));
    queue({ kind: group.kind, locale, path, value });
  };

  const resetToDefault = (group: Group, path: string, locale: Locale) => {
    setDraft((current) => withOverride(current, group.kind, locale, path, null));
    queue({ kind: group.kind, locale, path, value: null });
  };

  const rowsOf = (group: Group): Row[] =>
    flattenStrings(trees[group.kind].sk[group.key], group.key).map((entry) => ({
      path: entry.path,
      label: entry.path.slice(group.key.length + 1) || group.key,
    }));

  // Computed during render rather than memoized: a group holds at most a few
  // dozen rows, so filtering is cheaper than tracking the dependencies.
  const visibleRows = (group: Group): Row[] => {
    const needle = query.trim().toLowerCase();

    return rowsOf(group).filter((row) => {
      const values = locales.map((locale) => valueOf(group, row.path, locale));

      if (needle) {
        const haystack = [row.path, ...values].join(" ").toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      if (missingOnly && !values.some((value) => value.trim() === "")) return false;
      if (changedOnly && !locales.some((locale) => isOverridden(group, row.path, locale))) {
        return false;
      }
      return true;
    });
  };

  const groupStats = (group: Group) => {
    const groupRows = rowsOf(group);
    let missing = 0;
    let overridden = 0;
    let unpublished = 0;
    for (const row of groupRows) {
      for (const locale of locales) {
        if (valueOf(group, row.path, locale).trim() === "") missing++;
        if (isOverridden(group, row.path, locale)) overridden++;
        if (isUnpublished(group, row.path, locale)) unpublished++;
      }
    }
    return { total: groupRows.length, missing, overridden, unpublished };
  };

  const overrideCount = sourceFiles.reduce(
    (total, file) => total + effectiveOverrides(file.kind, file.locale).length,
    0,
  );

  const unpublishedCount = sourceFiles.reduce(
    (total, file) => total + unpublishedIn(file.kind, file.locale).length,
    0,
  );

  const runPublish = async () => {
    setBusy(true);
    await flush();
    // A failed autosave must not be published over — the draft on the server
    // is not what the editor is looking at.
    if (pending.current.size > 0) {
      setBusy(false);
      setMessage("Časť zmien sa neuložila, publikovanie zrušené.");
      setSaveStatus("error");
      return;
    }

    const result = await publish();
    if (result.status === "error") {
      setSaveStatus("error");
    } else {
      // The server just made live match the draft; mirror that here instead of
      // reloading the whole page.
      setLive(structuredClone(draft));
      setSaveStatus("saved");
    }
    setMessage(result.message);
    setBusy(false);
  };

  const runDiscard = async () => {
    if (!window.confirm("Zahodiť všetky nepublikované zmeny?")) return;

    setBusy(true);
    // Anything queued is about to be thrown away on the server as well.
    if (timer.current) clearTimeout(timer.current);
    pending.current.clear();

    const result = await discardDraft();
    if (result.status === "error") {
      setSaveStatus("error");
    } else {
      setDraft(structuredClone(live));
      setSaveStatus("idle");
    }
    setMessage(result.message);
    setBusy(false);
  };

  const runCleanup = async () => {
    setBusy(true);
    const result = await cleanupRedundant();

    if (result.status === "error") {
      setSaveStatus("error");
      setMessage(result.message);
      setBusy(false);
      return;
    }

    setDraft((current) => withoutKeys(current, redundant));
    setLive((current) => withoutKeys(current, redundant));
    setMessage(result.message);
    setBusy(false);
  };

  const download = (file: SourceFile) => {
    const pendingHere = unpublishedIn(file.kind, file.locale).length;
    if (
      pendingHere > 0 &&
      !window.confirm(
        `Tento súbor má ${pendingHere} nepublikovaných zmien.\n\n` +
          "Stiahne sa koncept. Ak ho commitneš bez publikovania, web bude aj tak " +
          "ukazovať staré texty — override v databáze prebíja nový default v súbore.\n\n" +
          "Najprv publikuj. Stiahnuť aj tak?",
      )
    ) {
      return;
    }

    const base = trees[file.kind][file.locale];
    const merged = applyEdits(base, draft[file.kind][file.locale] ?? {});
    const source =
      file.kind === "ui"
        ? serializeUiTranslations(file.locale, merged)
        : serializeProductTexts(file.locale, merged);

    const url = URL.createObjectURL(new Blob([source], { type: "text/plain" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = basename(file.path);
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!activeGroup) return null;

  const rows = visibleRows(activeGroup);
  // One column for the key, then one per language.
  const columnStyle = {
    gridTemplateColumns: `minmax(160px, 1fr) repeat(${locales.length}, minmax(0, 2fr))`,
  };

  const statusLabel: Record<SaveStatus, string> = {
    idle: "bez zmien",
    pending: "ukladá sa…",
    saving: "ukladá sa…",
    saved: "uložené",
    error: "chyba pri ukladaní",
  };

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-6 p-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Translations manager</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Zmeny sa priebežne ukladajú ako koncept do databázy. Na web sa dostanú
            až po kliknutí na <strong>Publikovať</strong>. Súbory v repozitári
            zostávajú predvolenými hodnotami — nasadenie ich neprepíše.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span
            className={
              saveStatus === "error"
                ? "rounded-full bg-rose-100 px-3 py-1 font-medium text-rose-900"
                : saveStatus === "pending" || saveStatus === "saving"
                  ? "rounded-full bg-amber-100 px-3 py-1 font-medium text-amber-900"
                  : "rounded-full bg-slate-100 px-3 py-1 text-slate-500"
            }
          >
            {statusLabel[saveStatus]}
          </span>
          <span
            className={
              unpublishedCount > 0
                ? "rounded-full bg-indigo-100 px-3 py-1 font-medium text-indigo-900"
                : "rounded-full bg-slate-100 px-3 py-1 text-slate-500"
            }
          >
            {unpublishedCount === 0
              ? "všetko publikované"
              : `${unpublishedCount} nepublikovaných`}
          </span>
          <button
            type="button"
            onClick={() => void runDiscard()}
            disabled={busy || unpublishedCount === 0}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-slate-700 disabled:opacity-40"
          >
            Zahodiť
          </button>
          <button
            type="button"
            onClick={() => void runPublish()}
            disabled={busy || unpublishedCount === 0}
            className="rounded-lg bg-slate-900 px-4 py-1.5 font-medium text-white disabled:opacity-40"
          >
            Publikovať
          </button>
        </div>
      </header>

      {message ? (
        <p
          className={`rounded-lg px-3 py-2 text-sm ${
            saveStatus === "error"
              ? "bg-rose-50 text-rose-900"
              : "bg-emerald-50 text-emerald-900"
          }`}
        >
          {message}
        </p>
      ) : null}

      {redundant.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-900">
          <span>
            <strong>{redundant.length}</strong>{" "}
            {redundant.length === 1 ? "text už je" : "textov už je"} v repozitári —
            súbory v <code className="font-mono">data/</code> hovoria to isté.
            Override ich už len duplikuje a prebíjal by budúce opravy v kóde.
          </span>
          <button
            type="button"
            onClick={() => void runCleanup()}
            disabled={busy}
            className="shrink-0 rounded-lg border border-sky-400 bg-white px-3 py-1.5 font-medium text-sky-900 disabled:opacity-40"
          >
            Upratať prevzaté
          </button>
        </div>
      ) : null}

      <section className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-8">
        {sourceFiles.map((file) => {
          const count = effectiveOverrides(file.kind, file.locale).length;
          const pendingHere = unpublishedIn(file.kind, file.locale).length;
          return (
            <button
              key={file.id}
              type="button"
              onClick={() => download(file)}
              title={
                pendingHere > 0
                  ? "Má nepublikované zmeny — publikuj skôr, než súbor commitneš."
                  : "Stiahne súbor s aktuálnym textom — na natrvalé preklopenie do repozitára."
              }
              className={`rounded-xl border px-3 py-2 text-left transition ${
                pendingHere > 0
                  ? "border-indigo-400 bg-indigo-50 hover:bg-indigo-100"
                  : count > 0
                    ? "border-amber-400 bg-amber-50 hover:bg-amber-100"
                    : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >
              <span className="block font-mono text-xs text-slate-500">
                {file.kind === "ui" ? "data/translations" : "data/products/translations"}
              </span>
              <span className="block text-sm font-medium">{basename(file.path)}</span>
              <span className="block text-xs text-slate-500">
                {pendingHere > 0
                  ? `${pendingHere} nepublikovaných`
                  : count > 0
                    ? `${count} zmien — stiahnuť`
                    : "stiahnuť"}
              </span>
            </button>
          );
        })}
      </section>

      <div className="flex flex-1 gap-6">
        <nav className="w-56 shrink-0 space-y-1">
          {groups.map((group) => {
            const stats = groupStats(group);
            const active = group.id === activeGroup.id;
            return (
              <button
                key={group.id}
                type="button"
                onClick={() => setActiveGroupId(group.id)}
                className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm ${
                  active ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-200"
                }`}
              >
                <span className="truncate">{group.label}</span>
                <span className="flex items-center gap-1 text-xs">
                  {stats.unpublished > 0 ? (
                    <span
                      title={`${stats.unpublished} nepublikovaných`}
                      className={active ? "text-indigo-300" : "text-indigo-600"}
                    >
                      ●
                    </span>
                  ) : null}
                  {stats.missing > 0 ? (
                    <span
                      title={`${stats.missing} prázdnych`}
                      className={active ? "text-rose-300" : "text-rose-600"}
                    >
                      {stats.missing}
                    </span>
                  ) : null}
                  <span className={active ? "text-slate-300" : "text-slate-400"}>
                    {stats.total}
                  </span>
                </span>
              </button>
            );
          })}
        </nav>

        <div className="min-w-0 flex-1 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Hľadať kľúč alebo text…"
              className="min-w-56 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            />
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={missingOnly}
                onChange={(event) => setMissingOnly(event.target.checked)}
              />
              iba prázdne
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={changedOnly}
                onChange={(event) => setChangedOnly(event.target.checked)}
              />
              iba upravené
            </label>
            <span className="text-sm text-slate-500">
              {rows.length} riadkov · {overrideCount} úprav spolu
            </span>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div
              className="grid border-b border-slate-200 bg-slate-50 text-xs font-medium uppercase tracking-wider text-slate-500"
              style={columnStyle}
            >
              <div className="px-3 py-2">Kľúč</div>
              {locales.map((locale) => (
                <div key={locale} className="px-3 py-2">
                  {localeLabels[locale]}
                </div>
              ))}
            </div>

            {rows.length === 0 ? (
              <p className="px-3 py-6 text-sm text-slate-500">
                Filtrom nič nezodpovedá.
              </p>
            ) : null}

            {rows.map((row) => {
              const values = locales.map((locale) =>
                valueOf(activeGroup, row.path, locale),
              );
              const longest = Math.max(...values.map((value) => value.length));
              const rowCount = Math.min(8, Math.max(2, Math.ceil(longest / 52)));

              return (
                <div
                  key={row.path}
                  className="grid items-start border-b border-slate-100 last:border-b-0"
                  style={columnStyle}
                >
                  <div className="px-3 py-2">
                    <span className="block wrap-break-word font-mono text-xs text-slate-600">
                      {row.label}
                    </span>
                  </div>
                  {locales.map((locale, index) => {
                    const value = values[index];
                    const overridden = isOverridden(activeGroup, row.path, locale);
                    const unpublished = isUnpublished(activeGroup, row.path, locale);
                    const empty = value.trim() === "";

                    return (
                      <div key={locale} className="px-2 py-2">
                        <textarea
                          value={value}
                          rows={rowCount}
                          onChange={(event) =>
                            setValue(activeGroup, row.path, locale, event.target.value)
                          }
                          aria-label={`${row.label} — ${localeLabels[locale]}`}
                          className={`w-full resize-y rounded-lg border px-2 py-1.5 text-sm leading-snug outline-none focus:border-slate-500 ${
                            empty
                              ? "border-rose-300 bg-rose-50"
                              : unpublished
                                ? "border-indigo-400 bg-indigo-50"
                                : overridden
                                  ? "border-amber-400 bg-amber-50"
                                  : "border-slate-200"
                          }`}
                        />
                        {overridden ? (
                          <button
                            type="button"
                            onClick={() =>
                              resetToDefault(activeGroup, row.path, locale)
                            }
                            title={`Predvolené: ${defaultOf(activeGroup, row.path, locale)}`}
                            className="mt-1 text-xs text-slate-500 underline hover:text-slate-900"
                          >
                            späť na predvolené
                          </button>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
