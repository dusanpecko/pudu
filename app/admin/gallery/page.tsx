import { notFound } from "next/navigation";

import GalleryManager from "@/components/admin/GalleryManager";
import { products } from "@/data/products";
import { galleryKeys, loadAllImages, HOME_GALLERY } from "@/lib/gallery";
import { isEditor } from "@/lib/supabase/editors";
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
  if (!isEditor(editor?.email)) notFound();

  const labels = Object.fromEntries(
    galleryKeys().map((key) => [
      key,
      key === HOME_GALLERY
        ? "Domovská stránka"
        : (products.find((product) => product.slug === key)?.slug ?? key)
            .replace("pudu-", "PUDU ")
            .toUpperCase(),
    ]),
  );

  return (
    <GalleryManager
      images={await loadAllImages()}
      galleries={galleryKeys()}
      galleryLabels={labels}
    />
  );
}
