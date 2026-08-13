import ContactForm, {
  type ContactProductOption,
} from "@/components/contact/ContactForm";
import Reveal from "@/components/effects/Reveal";
import { products } from "@/data/products";
import type { Locale } from "@/lib/i18n";
import { sectionId } from "@/lib/routes";
import { loadSmtpSettings } from "@/lib/smtp-settings";
import { getProductTexts, getTranslations } from "@/lib/translations";
import type { ProductSlug } from "@/types/product";

type ContactSectionProps = {
  locale: Locale;
  /** Overrides the generic heading on product pages. */
  eyebrow?: string;
  title?: string;
  description?: string;
  /** Preselects the product in the enquiry form. */
  defaultProduct?: ProductSlug;
};

export default async function ContactSection({
  locale,
  eyebrow,
  title,
  description,
  defaultProduct,
}: ContactSectionProps) {
  const t = await getTranslations(locale);
  const texts = await getProductTexts(locale);
  // Read from the mail settings, so each company links its own notice.
  const settings = await loadSmtpSettings(locale);
  const privacyUrl = settings.ok ? settings.data.privacyUrl : "";

  const productOptions: ContactProductOption[] = products.map((product) => ({
    value: product.slug,
    label: texts[product.slug].name,
  }));

  return (
    <section id={sectionId(locale, "contact")} className="section">
      <div className="wrap">
        <Reveal className="cta">
          <div>
            <p className="eyebrow center">{eyebrow ?? t.contact.eyebrow}</p>
            <h2>{title ?? t.contact.title}</h2>
            <p>{description ?? t.contact.description}</p>

            <ContactForm
              content={t.contact}
              locale={locale}
              privacyUrl={privacyUrl}
              productOptions={productOptions}
              defaultProduct={defaultProduct}
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
