"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  addImage,
  removeImage,
  requestUpload,
  saveImage,
  saveOrder,
} from "@/app/admin/gallery/actions";
// Deliberately not from lib/gallery: that module is server-only, and importing
// it here would pull the admin Supabase client into the browser bundle.
import {
  BUCKET,
  isHeroKey,
  type GalleryImage,
  type ImageRole,
  type LocalizedText,
} from "@/lib/gallery-shared";
import { locales, localeLabels, defaultLocale, type Locale } from "@/lib/i18n";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const ASPECT = 16 / 9;
/** Ratios within this of 16:9 have no meaningful slack to position. */
const ASPECT_EPSILON = 0.01;

type GalleryManagerProps = {
  images: GalleryImage[];
  /** Strips show every image placed in them. */
  strips: string[];
  /** Single-image slots: only the first image in each is rendered. */
  heroes: string[];
  galleryLabels: Record<string, string>;
};

const ROLE_LABELS: Record<ImageRole, string> = {
  photo: "Fotografia — oreže sa na 16:9",
  render: "Render — zachová pomer aj priehľadnosť",
};

/** The three translated fields, as the form holds them. */
type TextFields = {
  alt: Record<Locale, string>;
  title: Record<Locale, string>;
  caption: Record<Locale, string>;
};

type FieldName = keyof TextFields;

const FIELD_LABELS: Record<FieldName, string> = {
  alt: "Alt text (povinný)",
  title: "Titulok",
  caption: "Popis",
};

const FIELD_HINTS: Record<FieldName, string> = {
  alt: "Čo je na obrázku. Čítajú to čítačky obrazovky aj Google.",
  title: "Krátky nadpis, zobrazí sa pod obrázkom.",
  caption: "Dlhší popis pre kontext.",
};

function emptyLocaleMap(): Record<Locale, string> {
  return Object.fromEntries(locales.map((locale) => [locale, ""])) as Record<
    Locale,
    string
  >;
}

function emptyFields(): TextFields {
  return { alt: emptyLocaleMap(), title: emptyLocaleMap(), caption: emptyLocaleMap() };
}

function fieldsFrom(image: GalleryImage): TextFields {
  const fill = (source: LocalizedText): Record<Locale, string> =>
    Object.fromEntries(
      locales.map((locale) => [locale, source[locale] ?? ""]),
    ) as Record<Locale, string>;

  return { alt: fill(image.alt), title: fill(image.title), caption: fill(image.caption) };
}

/** Strips the empty languages, which the server would drop anyway. */
function toLocalized(map: Record<Locale, string>): LocalizedText {
  const result: LocalizedText = {};
  for (const locale of locales) {
    const value = map[locale].trim();
    if (value) result[locale] = value;
  }
  return result;
}

/**
 * Geometry of the 16:9 window inside a displayed image, as fractions of the
 * displayed box. Exactly one axis has slack — the other is fully used — so the
 * editor only ever has one thing to decide.
 */
function cropWindow(ratio: number, focus: number) {
  if (ratio > ASPECT + ASPECT_EPSILON) {
    const width = ASPECT / ratio;
    return {
      axis: "x" as const,
      width,
      height: 1,
      left: Math.max(0, Math.min(focus - width / 2, 1 - width)),
      top: 0,
    };
  }
  if (ratio < ASPECT - ASPECT_EPSILON) {
    const height = ratio / ASPECT;
    return {
      axis: "y" as const,
      width: 1,
      height,
      left: 0,
      top: Math.max(0, Math.min(focus - height / 2, 1 - height)),
    };
  }
  return { axis: null, width: 1, height: 1, left: 0, top: 0 };
}

function LocaleFields({
  fields,
  locale,
  onChange,
  onCopyToAll,
}: {
  fields: TextFields;
  locale: Locale;
  onChange: (field: FieldName, value: string) => void;
  onCopyToAll: (field: FieldName) => void;
}) {
  return (
    <div className="space-y-3">
      {(Object.keys(FIELD_LABELS) as FieldName[]).map((field) => (
        <label key={field} className="block">
          <span className="flex items-baseline justify-between gap-2">
            <span className="text-xs font-medium text-slate-700">
              {FIELD_LABELS[field]}
            </span>
            <button
              type="button"
              onClick={() => onCopyToAll(field)}
              className="text-xs text-slate-500 underline hover:text-slate-900"
            >
              skopírovať do všetkých jazykov
            </button>
          </span>
          {field === "caption" ? (
            <textarea
              value={fields[field][locale]}
              onChange={(event) => onChange(field, event.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
            />
          ) : (
            <input
              type="text"
              value={fields[field][locale]}
              onChange={(event) => onChange(field, event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
            />
          )}
          <span className="mt-0.5 block text-xs text-slate-400">
            {FIELD_HINTS[field]}
          </span>
        </label>
      ))}
    </div>
  );
}

function PlacementGroup({
  title,
  hint,
  keys,
  galleryLabels,
  selected,
  onToggle,
}: {
  title: string;
  hint: string;
  keys: string[];
  galleryLabels: Record<string, string>;
  selected: string[];
  onToggle: (key: string) => void;
}) {
  return (
    <div>
      <span className="text-xs font-medium text-slate-700">{title}</span>
      <p className="text-xs text-slate-400">{hint}</p>
      <div className="mt-1 flex flex-wrap gap-2">
        {keys.map((key) => {
          const active = selected.includes(key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => onToggle(key)}
              aria-pressed={active}
              className={`rounded-full border px-3 py-1 text-xs ${
                active
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-300 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {galleryLabels[key] ?? key}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Strips and hero slots are kept visibly apart: putting an image in a strip adds
 * it to a row, while putting one in a hero slot replaces the render on that page.
 */
function GalleryPicker({
  strips,
  heroes,
  galleryLabels,
  selected,
  onToggle,
}: {
  strips: string[];
  heroes: string[];
  galleryLabels: Record<string, string>;
  selected: string[];
  onToggle: (key: string) => void;
}) {
  return (
    <div className="space-y-3">
      <PlacementGroup
        title="Galérie"
        hint="Pás fotografií — zobrazia sa všetky."
        keys={strips}
        galleryLabels={galleryLabels}
        selected={selected}
        onToggle={onToggle}
      />
      <PlacementGroup
        title="Hero pozície"
        hint="Hlavný obrázok stránky — zobrazí sa iba prvý."
        keys={heroes}
        galleryLabels={galleryLabels}
        selected={selected}
        onToggle={onToggle}
      />
    </div>
  );
}

export default function GalleryManager({
  images,
  strips,
  heroes,
  galleryLabels,
}: GalleryManagerProps) {
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(
    null,
  );
  const [focus, setFocus] = useState(0.5);
  const [role, setRole] = useState<ImageRole>("photo");
  const [hasBackdrop, setHasBackdrop] = useState(false);
  const [slug, setSlug] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [fields, setFields] = useState<TextFields>(emptyFields);
  const [locale, setLocale] = useState<Locale>(defaultLocale);

  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);

  const fileInput = useRef<HTMLInputElement>(null);

  // The URL is derived from the file rather than stored in state, so the effect
  // has nothing to do but release it — a blob URL lives as long as the document
  // otherwise, and a long editing session would hold every file ever previewed.
  const previewUrl = useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file],
  );
  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  /** Hero slots holding more than one image — only the first would be rendered. */
  const crowdedHeroes = heroes.filter(
    (key) => images.filter((image) => image.galleries.includes(key)).length > 1,
  );

  const ratio = dimensions ? dimensions.width / dimensions.height : null;
  const window16by9 = ratio === null ? null : cropWindow(ratio, focus);

  const report = (text: string, isError: boolean) => {
    setMessage(text);
    setFailed(isError);
  };

  const resetForm = () => {
    setFile(null);
    setDimensions(null);
    setFocus(0.5);
    setRole("photo");
    setHasBackdrop(false);
    setSlug("");
    setSelected([]);
    setFields(emptyFields());
    if (fileInput.current) fileInput.current.value = "";
  };

  const pickFile = (next: File | null) => {
    setFile(next);
    setDimensions(null);
    setFocus(0.5);
    if (!next) return;

    // Read the intrinsic size so the crop window can be drawn before upload.
    // This URL is separate from the preview one and is released as soon as the
    // dimensions are known.
    const probeUrl = URL.createObjectURL(next);
    const probe = new window.Image();
    probe.onload = () => {
      setDimensions({ width: probe.naturalWidth, height: probe.naturalHeight });
      URL.revokeObjectURL(probeUrl);
    };
    probe.onerror = () => URL.revokeObjectURL(probeUrl);
    probe.src = probeUrl;
  };

  const upload = async () => {
    if (!file) return report("Vyberte súbor.", true);
    if (selected.length === 0) return report("Vyberte aspoň jednu galériu.", true);
    if (!locales.some((candidate) => fields.alt[candidate].trim())) {
      return report("Alt text je povinný aspoň v jednom jazyku.", true);
    }

    setBusy(true);
    report("Nahrávam originál…", false);

    try {
      const target = await requestUpload(file.name);
      if (target.status === "error") {
        report(target.message, true);
        return;
      }

      const supabase = createSupabaseBrowserClient();
      const upladed = await supabase.storage
        .from(BUCKET)
        .uploadToSignedUrl(target.path, target.token, file);
      if (upladed.error) {
        report(`Nahrávanie zlyhalo: ${upladed.error.message}`, true);
        return;
      }

      report("Spracúvam orez a WebP…", false);
      const axis = window16by9?.axis;
      const result = await addImage({
        originalPath: target.path,
        focusX: axis === "x" ? focus : 0.5,
        focusY: axis === "y" ? focus : 0.5,
        slug: slug || fields.title[defaultLocale] || fields.alt[defaultLocale],
        role,
        hasBackdrop,
        galleries: selected,
        alt: toLocalized(fields.alt),
        title: toLocalized(fields.title),
        caption: toLocalized(fields.caption),
      });

      report(result.message, result.status === "error");
      if (result.status === "ok") {
        resetForm();
        router.refresh();
      }
    } catch (error) {
      report(error instanceof Error ? error.message : "Nahrávanie zlyhalo.", true);
    } finally {
      setBusy(false);
    }
  };

  const move = async (index: number, direction: -1 | 1) => {
    const next = [...images];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];

    setBusy(true);
    const result = await saveOrder(next.map((image) => image.id));
    report(result.message, result.status === "error");
    setBusy(false);
    if (result.status === "ok") router.refresh();
  };

  const destroy = async (image: GalleryImage) => {
    if (!window.confirm("Zmazať obrázok aj súbory v úložisku?")) return;

    setBusy(true);
    const result = await removeImage(image.id);
    report(result.message, result.status === "error");
    setBusy(false);
    if (result.status === "ok") router.refresh();
  };

  return (
    <div className="mx-auto flex max-w-400 flex-col gap-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Galéria</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-500">
          Obrázok sa nahrá v pôvodnej kvalite, oreže sa na 16:9 podľa ohniska, ktoré
          nastavíte, a uloží ako WebP šírky 2400 px. Originál zostáva v úložisku, takže
          sa dá neskôr preorezať bez nového nahrávania.
        </p>
      </header>

      {message ? (
        <p
          className={`rounded-lg px-3 py-2 text-sm ${
            failed ? "bg-rose-50 text-rose-900" : "bg-emerald-50 text-emerald-900"
          }`}
        >
          {message}
        </p>
      ) : null}

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-900">Nový obrázok</h2>

        <input
          ref={fileInput}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif,image/tiff"
          onChange={(event) => pickFile(event.target.files?.[0] ?? null)}
          className="mt-3 block w-full text-sm"
        />

        {previewUrl && window16by9 && dimensions ? (
          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div>
              <div className="relative overflow-hidden rounded-lg bg-slate-900">
                {/* A blob: URL has no known dimensions at build time and needs no
                    optimisation, so next/image would only get in the way here. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="" className="block w-full" />
                {role === "photo" ? (
                <div
                  className="pointer-events-none absolute border-2 border-white"
                  style={{
                    left: `${window16by9.left * 100}%`,
                    top: `${window16by9.top * 100}%`,
                    width: `${window16by9.width * 100}%`,
                    height: `${window16by9.height * 100}%`,
                    boxShadow: "0 0 0 9999px rgba(2,6,23,0.6)",
                  }}
                />
                ) : null}
              </div>

              <p className="mt-2 text-xs text-slate-500">
                Originál {dimensions.width}×{dimensions.height} ({ratio?.toFixed(2)}
                :1).{" "}
                {role === "render"
                  ? "Render sa neoreže — pomer aj priehľadnosť zostanú."
                  : window16by9.axis === null
                  ? "Presne 16:9, orezávať netreba."
                    : `Orez odreže ${Math.round(
                        (1 -
                          (window16by9.axis === "y"
                            ? window16by9.height
                            : window16by9.width)) *
                          100,
                      )} % ${window16by9.axis === "y" ? "výšky" : "šírky"}.`}
              </p>

              {role === "photo" && window16by9.axis ? (
                <label className="mt-2 block">
                  <span className="text-xs font-medium text-slate-700">
                    Ohnisko orezu — {window16by9.axis === "y" ? "zvislo" : "vodorovne"}
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={focus}
                    onChange={(event) => setFocus(Number(event.target.value))}
                    className="mt-1 w-full"
                  />
                </label>
              ) : null}
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-xs font-medium text-slate-700">Typ obrázka</span>
                <div className="mt-1 grid gap-1">
                  {(["photo", "render"] as const).map((candidate) => (
                    <button
                      key={candidate}
                      type="button"
                      onClick={() => setRole(candidate)}
                      aria-pressed={role === candidate}
                      className={`rounded-lg border px-3 py-1.5 text-left text-xs ${
                        role === candidate
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-300 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {ROLE_LABELS[candidate]}
                    </button>
                  ))}
                </div>
                {role === "render" ? (
                  <label className="mt-2 flex items-start gap-2 text-xs text-slate-600">
                    <input
                      type="checkbox"
                      checked={hasBackdrop}
                      onChange={(event) => setHasBackdrop(event.target.checked)}
                      className="mt-0.5"
                    />
                    <span>
                      Render má tmavé pozadie, nie priehľadné — stránka ho zmieša
                      s podkladom namiesto zobrazenia obdĺžnika.
                    </span>
                  </label>
                ) : null}
              </div>

              <div>
                <span className="text-xs font-medium text-slate-700">Umiestnenie</span>
                <div className="mt-1">
                  <GalleryPicker
                    strips={strips}
                    heroes={heroes}
                    galleryLabels={galleryLabels}
                    selected={selected}
                    onToggle={(key) =>
                      setSelected((current) =>
                        current.includes(key)
                          ? current.filter((item) => item !== key)
                          : [...current, key],
                      )
                    }
                  />
                </div>
              </div>

              <label className="block">
                <span className="text-xs font-medium text-slate-700">
                  Názov súboru (nepovinné)
                </span>
                <input
                  type="text"
                  value={slug}
                  onChange={(event) => setSlug(event.target.value)}
                  placeholder="odvodí sa z titulku"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                />
                <span className="mt-0.5 block text-xs text-slate-400">
                  Čitateľný názov súboru pomáha SEO.
                </span>
              </label>

              <div>
                <div className="flex gap-1">
                  {locales.map((candidate) => (
                    <button
                      key={candidate}
                      type="button"
                      onClick={() => setLocale(candidate)}
                      className={`rounded-lg px-2 py-1 text-xs ${
                        candidate === locale
                          ? "bg-slate-900 text-white"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {localeLabels[candidate]}
                      {fields.alt[candidate].trim() ? "" : " ·"}
                    </button>
                  ))}
                </div>
                <div className="mt-2">
                  <LocaleFields
                    fields={fields}
                    locale={locale}
                    onChange={(field, value) =>
                      setFields((current) => ({
                        ...current,
                        [field]: { ...current[field], [locale]: value },
                      }))
                    }
                    onCopyToAll={(field) =>
                      setFields((current) => {
                        const value = current[field][locale];
                        return {
                          ...current,
                          [field]: Object.fromEntries(
                            locales.map((key) => [key, value]),
                          ) as Record<Locale, string>,
                        };
                      })
                    }
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => void upload()}
                disabled={busy}
                className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
              >
                {busy ? "Pracujem…" : "Nahrať obrázok"}
              </button>
            </div>
          </div>
        ) : null}
      </section>

      {crowdedHeroes.length > 0 ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          V hero pozícii {crowdedHeroes.map((key) => galleryLabels[key] ?? key).join(", ")}
          {" "}je viac obrázkov. Stránka zobrazí iba prvý v poradí — ostatné odtiaľ
          odoberte, aby bolo zjavné, ktorý platí.
        </p>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-900">
          Nahrané obrázky ({images.length})
        </h2>

        {images.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white px-4 py-6 text-sm text-slate-500">
            Zatiaľ žiadne obrázky. Galéria sa na stránke nezobrazí, kým tu niečo nebude.
          </p>
        ) : null}

        {images.map((image, index) => (
          <GalleryRow
            // Content, not just identity: remounting on save is what lets the
            // editor state be seeded from props without an effect.
            key={`${image.id}:${image.updatedAt ?? ""}`}
            image={image}
            index={index}
            total={images.length}
            strips={strips}
            heroes={heroes}
            galleryLabels={galleryLabels}
            busy={busy}
            expanded={editing === image.id}
            onExpand={() => setEditing(editing === image.id ? null : image.id)}
            onMove={move}
            onDelete={destroy}
            onSaved={(text, isError) => {
              report(text, isError);
              if (!isError) {
                setEditing(null);
                router.refresh();
              }
            }}
            setBusy={setBusy}
          />
        ))}
      </section>
    </div>
  );
}

function GalleryRow({
  image,
  index,
  total,
  strips,
  heroes,
  galleryLabels,
  busy,
  expanded,
  onExpand,
  onMove,
  onDelete,
  onSaved,
  setBusy,
}: {
  image: GalleryImage;
  index: number;
  total: number;
  strips: string[];
  heroes: string[];
  galleryLabels: Record<string, string>;
  busy: boolean;
  expanded: boolean;
  onExpand: () => void;
  onMove: (index: number, direction: -1 | 1) => Promise<void>;
  onDelete: (image: GalleryImage) => Promise<void>;
  onSaved: (message: string, isError: boolean) => void;
  setBusy: (value: boolean) => void;
}) {
  // Seeded once from the row. The parent keys this component by the row's
  // `updated_at`, so a refresh after saving remounts it and these initialisers
  // run again against the stored values — no effect syncing props into state.
  const [fields, setFields] = useState<TextFields>(() => fieldsFrom(image));
  const [selected, setSelected] = useState<string[]>(image.galleries);
  const [locale, setLocale] = useState<Locale>(defaultLocale);

  const save = async () => {
    setBusy(true);
    const result = await saveImage(image.id, {
      galleries: selected,
      alt: toLocalized(fields.alt),
      title: toLocalized(fields.title),
      caption: toLocalized(fields.caption),
    });
    setBusy(false);
    onSaved(result.message, result.status === "error");
  };

  const missing = locales.filter((candidate) => !fields.alt[candidate].trim());

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center gap-4 p-3">
        <Image
          src={image.url}
          alt={image.alt[defaultLocale] ?? ""}
          width={160}
          height={90}
          className="h-22.5 w-40 shrink-0 rounded-lg object-cover"
        />

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-slate-900">
            {image.title[defaultLocale] || image.alt[defaultLocale] || image.path}
          </p>
          <p className="mt-0.5 flex flex-wrap items-center gap-1 text-xs text-slate-500">
            {image.galleries.map((key) => (
              <span
                key={key}
                className={`rounded px-1.5 py-0.5 ${
                  isHeroKey(key) ? "bg-violet-100 text-violet-900" : "bg-slate-100"
                }`}
              >
                {isHeroKey(key) ? "hero: " : ""}
                {galleryLabels[key] ?? key}
              </span>
            ))}
            <span>
              {image.width}×{image.height}
            </span>
            {image.role === "render" ? (
              <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-indigo-900">
                render{image.hasBackdrop ? " · pozadie" : ""}
              </span>
            ) : null}
            {missing.length > 0 ? (
              <span className="rounded bg-rose-100 px-1.5 py-0.5 text-rose-900">
                chýba alt: {missing.map((key) => localeLabels[key]).join(", ")}
              </span>
            ) : null}
          </p>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => void onMove(index, -1)}
            disabled={busy || index === 0}
            aria-label="Posunúť vyššie"
            className="rounded-lg border border-slate-300 px-2 py-1 text-sm disabled:opacity-30"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => void onMove(index, 1)}
            disabled={busy || index === total - 1}
            aria-label="Posunúť nižšie"
            className="rounded-lg border border-slate-300 px-2 py-1 text-sm disabled:opacity-30"
          >
            ↓
          </button>
          <button
            type="button"
            onClick={onExpand}
            className="rounded-lg border border-slate-300 px-3 py-1 text-sm"
          >
            {expanded ? "Zavrieť" : "Upraviť"}
          </button>
          <button
            type="button"
            onClick={() => void onDelete(image)}
            disabled={busy}
            className="rounded-lg border border-rose-300 px-3 py-1 text-sm text-rose-700 disabled:opacity-40"
          >
            Zmazať
          </button>
        </div>
      </div>

      {expanded ? (
        <div className="grid gap-4 border-t border-slate-100 p-4 lg:grid-cols-2">
          <div>
            <span className="text-xs font-medium text-slate-700">Galérie</span>
            <div className="mt-1">
              <GalleryPicker
                strips={strips}
                heroes={heroes}
                galleryLabels={galleryLabels}
                selected={selected}
                onToggle={(key) =>
                  setSelected((current) =>
                    current.includes(key)
                      ? current.filter((item) => item !== key)
                      : [...current, key],
                  )
                }
              />
            </div>
            <p className="mt-3 font-mono text-xs break-all text-slate-400">{image.path}</p>
          </div>

          <div>
            <div className="flex gap-1">
              {locales.map((candidate) => (
                <button
                  key={candidate}
                  type="button"
                  onClick={() => setLocale(candidate)}
                  className={`rounded-lg px-2 py-1 text-xs ${
                    candidate === locale
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {localeLabels[candidate]}
                </button>
              ))}
            </div>
            <div className="mt-2">
              <LocaleFields
                fields={fields}
                locale={locale}
                onChange={(field, value) =>
                  setFields((current) => ({
                    ...current,
                    [field]: { ...current[field], [locale]: value },
                  }))
                }
                onCopyToAll={(field) =>
                  setFields((current) => {
                    const value = current[field][locale];
                    return {
                      ...current,
                      [field]: Object.fromEntries(
                        locales.map((key) => [key, value]),
                      ) as Record<Locale, string>,
                    };
                  })
                }
              />
            </div>
            <button
              type="button"
              onClick={() => void save()}
              disabled={busy}
              className="mt-3 rounded-lg bg-slate-900 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-40"
            >
              Uložiť
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
