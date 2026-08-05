"use client";

import { useMemo, useState } from "react";

import { locales, localeLabels, type Locale } from "@/lib/i18n";
import {
  applyEdits,
  buildSourceFiles,
  flattenStrings,
  readPath,
  serializeProductTexts,
  serializeUiTranslations,
  type SourceFile,
  type StringTree,
} from "@/lib/translation-source";

const sourceFiles = buildSourceFiles(locales);

type Trees = Record<string, StringTree>;

type TranslationsManagerProps = {
  ui: Trees;
  products: Trees;
};

type Group = {
  id: string;
  label: string;
  kind: "ui" | "products";
  key: string;
};

type Row = {
  path: string;
  label: string;
};

/** Edits per generated file: fileId → { path → value }. */
type Edits = Record<string, Record<string, string>>;

function fileId(kind: SourceFile["kind"], locale: Locale): string {
  return `${kind}-${locale}`;
}

function basename(path: string): string {
  return path.slice(path.lastIndexOf("/") + 1);
}

export default function TranslationsManager({
  ui,
  products,
}: TranslationsManagerProps) {
  const trees: Record<"ui" | "products", Trees> = { ui, products };

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
  const [edits, setEdits] = useState<Edits>({});

  const activeGroup = groups.find((group) => group.id === activeGroupId) ?? groups[0];

  const valueOf = (group: Group, path: string, locale: Locale): string => {
    const id = fileId(group.kind, locale);
    const edit = edits[id]?.[path];
    if (edit !== undefined) return edit;
    return readPath(trees[group.kind][locale], path) ?? "";
  };

  const isEdited = (group: Group, path: string, locale: Locale): boolean =>
    edits[fileId(group.kind, locale)]?.[path] !== undefined;

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
      if (changedOnly && !locales.some((locale) => isEdited(group, row.path, locale))) {
        return false;
      }
      return true;
    });
  };

  const changeCount = (id: string): number => Object.keys(edits[id] ?? {}).length;
  const totalChanges = sourceFiles.reduce((sum, file) => sum + changeCount(file.id), 0);

  const groupStats = (group: Group) => {
    const groupRows = rowsOf(group);
    let missing = 0;
    let changed = 0;
    for (const row of groupRows) {
      for (const locale of locales) {
        if (valueOf(group, row.path, locale).trim() === "") missing++;
        if (isEdited(group, row.path, locale)) changed++;
      }
    }
    return { total: groupRows.length, missing, changed };
  };

  const setValue = (group: Group, path: string, locale: Locale, next: string) => {
    const id = fileId(group.kind, locale);
    const original = readPath(trees[group.kind][locale], path) ?? "";

    setEdits((current) => {
      const forFile = { ...(current[id] ?? {}) };
      if (next === original) delete forFile[path];
      else forFile[path] = next;

      const updated = { ...current };
      if (Object.keys(forFile).length === 0) delete updated[id];
      else updated[id] = forFile;
      return updated;
    });
  };

  const download = (file: SourceFile) => {
    const base = trees[file.kind][file.locale];
    const merged = applyEdits(base, edits[file.id] ?? {});
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

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-6 p-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Translations manager</h1>
          <p className="mt-1 text-sm text-slate-500">
            Edit the strings, download the regenerated files, replace them in the
            repository and commit. Nothing is saved automatically.
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span
            className={
              totalChanges > 0
                ? "rounded-full bg-amber-100 px-3 py-1 font-medium text-amber-900"
                : "rounded-full bg-slate-100 px-3 py-1 text-slate-500"
            }
          >
            {totalChanges === 0 ? "no changes" : `${totalChanges} changed`}
          </span>
          <button
            type="button"
            onClick={() => setEdits({})}
            disabled={totalChanges === 0}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-slate-700 disabled:opacity-40"
          >
            Discard
          </button>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-8">
        {sourceFiles.map((file) => {
          const count = changeCount(file.id);
          return (
            <button
              key={file.id}
              type="button"
              onClick={() => download(file)}
              className={`rounded-xl border px-3 py-2 text-left transition ${
                count > 0
                  ? "border-amber-400 bg-amber-50 hover:bg-amber-100"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >
              <span className="block font-mono text-xs text-slate-500">
                {file.kind === "ui" ? "data/translations" : "data/products/translations"}
              </span>
              <span className="block text-sm font-medium">{basename(file.path)}</span>
              <span className="block text-xs text-slate-500">
                {count > 0 ? `${count} changed — download` : "download"}
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
                  {stats.changed > 0 ? (
                    <span className={active ? "text-amber-300" : "text-amber-600"}>
                      ●
                    </span>
                  ) : null}
                  {stats.missing > 0 ? (
                    <span className={active ? "text-rose-300" : "text-rose-600"}>
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
              placeholder="Search key or text…"
              className="min-w-56 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            />
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={missingOnly}
                onChange={(event) => setMissingOnly(event.target.checked)}
              />
              missing only
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={changedOnly}
                onChange={(event) => setChangedOnly(event.target.checked)}
              />
              changed only
            </label>
            <span className="text-sm text-slate-500">{rows.length} rows</span>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="grid border-b border-slate-200 bg-slate-50 text-xs font-medium uppercase tracking-wider text-slate-500"
              style={columnStyle}>
              <div className="px-3 py-2">Key</div>
              {locales.map((locale) => (
                <div key={locale} className="px-3 py-2">
                  {localeLabels[locale]}
                </div>
              ))}
            </div>

            {rows.length === 0 ? (
              <p className="px-3 py-6 text-sm text-slate-500">
                Nothing matches the current filters.
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
                    const edited = isEdited(activeGroup, row.path, locale);
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
                              : edited
                                ? "border-amber-400 bg-amber-50"
                                : "border-slate-200"
                          }`}
                        />
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
