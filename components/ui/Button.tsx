import Link from "next/link";
import type { ReactNode } from "react";

import { cx } from "@/lib/cx";

type Variant = "primary" | "ghost";

type ButtonProps = {
  children: ReactNode;
  variant?: Variant;
  className?: string;
};

type LinkButtonProps = ButtonProps & {
  href: string;
};

/** Pill shaped call to action rendered as an internal link. */
export function LinkButton({
  href,
  children,
  variant = "primary",
  className,
}: LinkButtonProps) {
  return (
    <Link className={cx("btn", variant, className)} href={href}>
      {children}
    </Link>
  );
}

type SubmitButtonProps = ButtonProps & {
  disabled?: boolean;
};

/** Same styling as {@link LinkButton}, used for form submission. */
export function SubmitButton({
  children,
  variant = "primary",
  className,
  disabled = false,
}: SubmitButtonProps) {
  return (
    <button
      type="submit"
      className={cx("btn", variant, className)}
      aria-disabled={disabled || undefined}
    >
      {children}
    </button>
  );
}
