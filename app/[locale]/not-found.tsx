import GridFloor from "@/components/effects/GridFloor";
import NotFoundContent from "@/components/layout/NotFoundContent";

/**
 * Shown for unknown paths inside a valid language, e.g. a product slug that
 * does not exist. Rendered inside the locale layout, so navigation and footer
 * stay available.
 */
export default function LocaleNotFound() {
  return (
    <section className="error-page">
      <GridFloor />
      <NotFoundContent />
    </section>
  );
}
