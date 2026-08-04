import type { sk } from "@/data/translations/sk";

/**
 * The Slovak file is the reference shape — every other language file is typed
 * against it, so a missing or extra key is a compile error.
 */
export type Translation = typeof sk;
