import { notFound } from "next/navigation";

import GalleryManager from "@/components/admin/GalleryManager";
import { products } from "@/data/products";
import { heroKeys, loadAllImages, stripKeys, HOME_GALLERY } from "@/lib/gallery";
import { isEditor } from "@/lib/editors";
import { getEditor } from "@/lib/supabase/server";

/**
 * Upload and describe the gallery images.
 *
 * The list is read uncached, so it always shows what is actually stored rather
 * than what the site currently serves. Access requires a Supabase session,
 * enforced by proxy.ts.
 */
export default async function GalleryPage() {
  const editor = await getEditor();
  // Middleware already checks this; repeated here so nothing renders even if
  // the route is reached another way.
  if (!(await isEditor(editor?.email))) notFound();

  /** Product slugs read as "PUDU T300"; the home page names itself. */
  const nameOf = (key: string) =>
    key === HOME_GALLERY
      ? "Domovská stránka"
      : (products.find((product) => product.slug === key)?.slug ?? key)
          .replace("pudu-", "PUDU ")
          .toUpperCase();

  const labels = Object.fromEntries([
    ...stripKeys().map((key) => [key, nameOf(key)]),
    // The prefix is an implementation detail; the editor sees where it lands.
    ...heroKeys().map((key) => [key, nameOf(key.replace("hero:", ""))]),
  ]);

  return (
    <GalleryManager
      images={await loadAllImages()}
      strips={stripKeys()}
      heroes={heroKeys()}
      galleryLabels={labels}
    />
  );
}
