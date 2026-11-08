import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";
import type { Angle, VariantType } from "@/lib/types";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const BUTTON_VARIANT_CLASSES: Readonly<Record<ButtonVariant, string>> = {
  primary: "bg-accent text-accent-ink hover:bg-accent-strong",
  secondary: "border border-line bg-surface-raised text-ink hover:border-accent",
  ghost: "text-ink-muted hover:text-ink",
  danger: "bg-flag-red text-canvas hover:opacity-90",
};

export const VARIANT_TYPE_LABELS: Readonly<Record<VariantType, string>> = {
  hook: "Hooks",
  firstLine: "First lines",
  onScreen: "On-screen",
};

export const ANGLE_LABELS: Readonly<Record<Angle, string>> = {
  pain: "pain",
  curiosity: "curiosity",
  social_proof: "social proof",
  contrarian: "contrarian",
  specific_number: "specific number",
  humor: "humor",
  demo: "demo",
  identity: "identity",
  urgency_soft: "soft urgency",
};

export const inputClassName = cn(
  "w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-ink placeholder:text-ink-muted",
  "focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent",
);

export const textareaClassName = cn(inputClassName, "field-sizing-content min-h-11 resize-y leading-relaxed");

export const labelClassName ="text-xs font-semibold uppercase tracking-wide text-ink-muted mb-2";

export function buttonClassName(variant: ButtonVariant = "secondary", className?: string): string {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
    BUTTON_VARIANT_CLASSES[variant],
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50",
    "transition-colors",
    className,
  );
}

type ButtonProps = ComponentProps<"button"> & { variant?: ButtonVariant };

export function Button({ variant = "secondary", className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClassName(variant, className)} {...props} />;
}

export function Card({ className, ...props }: ComponentProps<"section">) {
  return <section className={cn("rounded-xl border border-line bg-surface p-4", className)} {...props} />;
}
