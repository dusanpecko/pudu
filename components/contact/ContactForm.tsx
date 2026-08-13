"use client";

import { useActionState, useId, useState } from "react";

import { sendEnquiry, type EnquiryState } from "@/app/[locale]/contact-actions";
import { SubmitButton } from "@/components/ui/Button";
import type { Locale } from "@/lib/i18n";
import type { Translation } from "@/types/translation";

export type ContactProductOption = {
  value: string;
  label: string;
};

type ContactFormProps = {
  content: Translation["contact"];
  productOptions: ContactProductOption[];
  /** Preselected product, used on product pages. */
  defaultProduct?: string;
  /** Decides which company's mailbox the enquiry reaches. */
  locale: Locale;
};

type FieldName = "name" | "email" | "message";
type Errors = Partial<Record<FieldName, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const INITIAL: EnquiryState = { status: "idle", message: "" };

/**
 * Enquiry form.
 *
 * Validated twice on purpose: in the browser so a mistake is pointed at
 * immediately and the field takes focus, and again on the server, which is the
 * check that counts — a request need not come from this form at all.
 */
export default function ContactForm({
  content,
  productOptions,
  defaultProduct = "",
  locale,
}: ContactFormProps) {
  const id = useId();
  const [errors, setErrors] = useState<Errors>({});
  const [state, formAction, pending] = useActionState(sendEnquiry, INITIAL);

  const fieldId = (field: string) => `${id}-${field}`;
  const errorId = (field: FieldName) => `${id}-${field}-error`;

  const validate = (data: FormData): Errors => {
    const next: Errors = {};
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();

    if (!name) next.name = content.errors.name;
    if (!email) next.email = content.errors.email;
    else if (!EMAIL_PATTERN.test(email)) next.email = content.errors.emailInvalid;
    if (!message) next.message = content.errors.message;

    return next;
  };

  /**
   * Runs before the action. Returning early on a client-side error keeps the
   * round trip for requests that have a chance of succeeding.
   */
  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const found = validate(new FormData(event.currentTarget));
    setErrors(found);

    const firstError = Object.keys(found)[0] as FieldName | undefined;
    if (firstError) {
      event.preventDefault();
      // getElementById avoids escaping the generated id inside a CSS selector.
      document.getElementById(fieldId(firstError))?.focus();
    }
  };

  if (state.status === "sent") {
    return (
      <div className="form-status" role="status" aria-live="polite">
        <span className="check" aria-hidden="true">
          ✓
        </span>
        <strong>{content.success}</strong>
        <p>{content.successDetail}</p>
        {/* Reloads the section rather than resetting state, so the form comes
            back genuinely empty and the action's result is cleared with it. */}
        <button
          type="button"
          className="btn ghost"
          onClick={() => window.location.reload()}
        >
          {content.reset}
        </button>
      </div>
    );
  }

  return (
    <form className="form" action={formAction} onSubmit={onSubmit} noValidate>
      <input type="hidden" name="locale" value={locale} />
      {/* Honeypot: hidden from sight and from assistive technology, and left out
          of the tab order. A person never reaches it; a naive bot fills it. */}
      <div className="sr-only" aria-hidden="true">
        <label htmlFor={fieldId("website")}>Website</label>
        <input
          id={fieldId("website")}
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
      <div className="form-grid">
        <div className="field">
          <label htmlFor={fieldId("name")}>{content.name}</label>
          <input
            id={fieldId("name")}
            name="name"
            type="text"
            autoComplete="name"
            placeholder={content.placeholders.name}
            aria-invalid={errors.name ? "true" : undefined}
            aria-describedby={errors.name ? errorId("name") : undefined}
            required
          />
          {errors.name ? (
            <p className="field-error" id={errorId("name")} role="alert">
              {errors.name}
            </p>
          ) : null}
        </div>

        <div className="field">
          <label htmlFor={fieldId("company")}>
            {content.company} <em>({content.optional})</em>
          </label>
          <input
            id={fieldId("company")}
            name="company"
            type="text"
            autoComplete="organization"
            placeholder={content.placeholders.company}
          />
        </div>

        <div className="field">
          <label htmlFor={fieldId("email")}>{content.email}</label>
          <input
            id={fieldId("email")}
            name="email"
            type="email"
            autoComplete="email"
            placeholder={content.placeholders.email}
            aria-invalid={errors.email ? "true" : undefined}
            aria-describedby={errors.email ? errorId("email") : undefined}
            required
          />
          {errors.email ? (
            <p className="field-error" id={errorId("email")} role="alert">
              {errors.email}
            </p>
          ) : null}
        </div>

        <div className="field">
          <label htmlFor={fieldId("phone")}>
            {content.phone} <em>({content.optional})</em>
          </label>
          <input
            id={fieldId("phone")}
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder={content.placeholders.phone}
          />
        </div>

        <div className="field full">
          <label htmlFor={fieldId("product")}>{content.product}</label>
          <select
            id={fieldId("product")}
            name="product"
            defaultValue={defaultProduct}
          >
            <option value="">{content.generalInquiry}</option>
            {productOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="field full">
          <label htmlFor={fieldId("message")}>{content.message}</label>
          <textarea
            id={fieldId("message")}
            name="message"
            placeholder={content.placeholders.message}
            aria-invalid={errors.message ? "true" : undefined}
            aria-describedby={errors.message ? errorId("message") : undefined}
            required
          />
          {errors.message ? (
            <p className="field-error" id={errorId("message")} role="alert">
              {errors.message}
            </p>
          ) : null}
        </div>
      </div>

      {state.status === "error" ? (
        <p className="field-error" role="alert">
          {state.message}
        </p>
      ) : null}

      <div className="form-foot">
        <SubmitButton disabled={pending}>{content.submit}</SubmitButton>
      </div>
    </form>
  );
}
