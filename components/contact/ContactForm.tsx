"use client";

import { useId, useState } from "react";

import { SubmitButton } from "@/components/ui/Button";
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
};

type FieldName = "name" | "email" | "message";
type Errors = Partial<Record<FieldName, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Enquiry form. Validation and confirmation happen entirely in the browser —
 * nothing is submitted to a server in this version.
 */
export default function ContactForm({
  content,
  productOptions,
  defaultProduct = "",
}: ContactFormProps) {
  const id = useId();
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState(false);

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

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const found = validate(new FormData(form));
    setErrors(found);

    const firstError = Object.keys(found)[0] as FieldName | undefined;
    if (firstError) {
      // getElementById avoids escaping the generated id inside a CSS selector.
      document.getElementById(fieldId(firstError))?.focus();
      return;
    }

    form.reset();
    setSent(true);
  };

  if (sent) {
    return (
      <div className="form-status" role="status" aria-live="polite">
        <span className="check" aria-hidden="true">
          ✓
        </span>
        <strong>{content.success}</strong>
        <p>{content.successDetail}</p>
        <button type="button" className="btn ghost" onClick={() => setSent(false)}>
          {content.reset}
        </button>
      </div>
    );
  }

  return (
    <form className="form" onSubmit={onSubmit} noValidate>
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

      <div className="form-foot">
        <p className="form-note">{content.note}</p>
        <SubmitButton>{content.submit}</SubmitButton>
      </div>
    </form>
  );
}
