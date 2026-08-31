"use client";

import { useActionState, useId, useRef, useState } from "react";

import { sendEnquiry, type EnquiryState } from "@/app/[locale]/contact-actions";
import Turnstile from "@/components/contact/Turnstile";
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
  /**
   * This market's privacy notice, from the mail settings. Empty means none is
   * configured; the consent is still required, only unlinked.
   */
  privacyUrl: string;
  /**
   * Cloudflare Turnstile's public key. Empty means the challenge is not
   * configured and no widget is rendered — the form still works, with the other
   * defences carrying the load. See lib/turnstile.ts.
   */
  turnstileSiteKey: string;
  /** The action name the widget declares, verified server-side on the way back. */
  turnstileAction: string;
};

type FieldName = "name" | "email" | "message" | "consent";
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
  privacyUrl,
  turnstileSiteKey,
  turnstileAction,
}: ContactFormProps) {
  const id = useId();
  const [errors, setErrors] = useState<Errors>({});
  const [state, formAction, pending] = useActionState(sendEnquiry, INITIAL);

  /**
   * The signed timestamp that dates the visitor's arrival at this form.
   *
   * Fetched on the first interaction rather than on mount, for two reasons: this
   * form sits on every page, so minting one per page view would be a request
   * nobody asked for, and the moment somebody first touches a field is a more
   * honest start time than the moment a section scrolled into view. A bot that
   * POSTs straight at the action never runs any of this and arrives without a
   * token. See lib/form-token.ts for why that costs points rather than the
   * submission.
   */
  const [formToken, setFormToken] = useState("");
  const tokenRequested = useRef(false);

  /**
   * The solved Turnstile token, held here rather than in the widget's own injected
   * input — see the note in Turnstile.tsx for why that injection is not relied on.
   * Empty until the challenge resolves, and emptied again whenever it is spent.
   */
  const [turnstileToken, setTurnstileToken] = useState("");

  const requestToken = () => {
    if (tokenRequested.current) return;
    tokenRequested.current = true;

    fetch("/api/form-token", { method: "POST" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { token?: unknown } | null) => {
        if (data && typeof data.token === "string") setFormToken(data.token);
      })
      // Swallowed deliberately. Without a token the submission is merely
      // scored a little more suspiciously; telling the visitor that a request
      // they never made has failed would be noise about nothing they can fix.
      .catch(() => {});
  };

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
    if (!data.get("consent")) next.consent = content.errors.consent;

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
    <form
      className="form"
      action={formAction}
      onSubmit={onSubmit}
      // Both, because either can come first: a click into a field fires focus,
      // while browser autofill can populate the form without one.
      onFocus={requestToken}
      onChange={requestToken}
      noValidate
    >
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="formToken" value={formToken} />
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

      <div className="consent">
        <label className="consent-label">
          <input
            id={fieldId("consent")}
            name="consent"
            type="checkbox"
            aria-invalid={errors.consent ? "true" : undefined}
            aria-describedby={errors.consent ? errorId("consent") : undefined}
            required
          />
          <span>
            {content.consent}{" "}
            {privacyUrl ? (
              <a href={privacyUrl} target="_blank" rel="noopener noreferrer">
                {content.consentLink}
              </a>
            ) : null}
          </span>
        </label>
        {errors.consent ? (
          <p className="field-error" id={errorId("consent")} role="alert">
            {errors.consent}
          </p>
        ) : null}
      </div>

      {turnstileSiteKey ? (
        <>
          <input
            type="hidden"
            name="cf-turnstile-response"
            value={turnstileToken}
          />
          {/* `state` is a fresh object for every result the action returns, which
              is exactly when the widget's spent token needs replacing.
              `setTurnstileToken` is passed rather than a closure over it because
              the widget rebuilds itself if this identity changes. */}
          <Turnstile
            siteKey={turnstileSiteKey}
            action={turnstileAction}
            locale={locale}
            resetOn={state}
            onToken={setTurnstileToken}
          />
        </>
      ) : null}

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
