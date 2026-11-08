"use client";

import { useState, type KeyboardEvent } from "react";
import { ANGLE_LABELS, Button, textareaClassName } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { Flag, FlagKind, Variant } from "@/lib/types";

interface FlagStyle {
  icon: string;
  label: string;
}

const FLAG_STYLES: Readonly<Record<FlagKind, FlagStyle>> = {
  similar_tested: { icon: "🟡", label: "Similar to a tested hook" },
  near_copy: { icon: "🟡", label: "Near copy of the original" },
  too_long: { icon: "🟠", label: "Too long" },
  policy_risk: { icon: "🔴", label: "Policy risk" },
};

function FlagBadge({ flag }: { flag: Flag }) {
  const style = FLAG_STYLES[flag.kind];
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        aria-label={`${style.label}: ${flag.message}`}
        className="rounded text-sm leading-none focus-visible:outline-2 focus-visible:outline-accent"
      >
        <span aria-hidden="true">{style.icon}</span>
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute right-0 top-full z-10 mt-1 hidden w-64 flex-col gap-1 rounded-lg border border-line bg-surface-raised p-2 text-xs text-ink group-focus-within:flex group-hover:flex"
      >
        <span className="font-semibold">{style.label}</span>
        <span>{flag.message}</span>
        {flag.match && <span className="text-ink-muted">Match: «{flag.match}»</span>}
      </span>
    </span>
  );
}

interface VariantRowProps {
  variant: Variant;
  isRegenerating: boolean;
  onToggleSelect: (variantId: string) => void;
  onTextChange: (variantId: string, text: string) => void;
  onRegenerate: (variantId: string) => void;
}

export function VariantRow({ variant, isRegenerating, onToggleSelect, onTextChange, onRegenerate }: VariantRowProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const checkboxId = `select-${variant.id}`;

  function handleCommit() {
    if (draft !== null && draft.trim() !== "") {
      onTextChange(variant.id, draft.trim());
    }
    setDraft(null);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleCommit();
    }
    if (event.key === "Escape") {
      setDraft(null);
    }
  }

  return (
    <li
      className={cn(
        "flex items-start gap-3 rounded-lg border p-3",
        variant.selected ? "border-accent bg-surface-raised" : "border-line bg-surface",
      )}
    >
      <input
        id={checkboxId}
        type="checkbox"
        checked={variant.selected}
        onChange={() => onToggleSelect(variant.id)}
        className="mt-1 size-4 shrink-0 accent-accent"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <label htmlFor={checkboxId} className="sr-only">
          Select variant
        </label>
        {draft === null ? (
          <button
            type="button"
            onClick={() => setDraft(variant.text)}
            title="Click to edit"
            className="rounded text-left text-sm text-ink hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-accent"
          >
            {variant.text}
          </button>
        ) : (
          <textarea
            autoFocus
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={handleCommit}
            onKeyDown={handleKeyDown}
            aria-label="Edit variant text. Enter to save, Escape to cancel."
            className={textareaClassName}
          />
        )}
        <p className="text-xs text-ink-muted">{variant.rationale}</p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
        <span className="rounded-full border border-line px-2 py-0.5 text-xs text-ink-muted">
          {ANGLE_LABELS[variant.angle]}
        </span>
        {variant.edited && <span className="text-xs text-ink-muted">edited</span>}
        {variant.flags.map((flag) => (
          <FlagBadge key={`${flag.kind}-${flag.message}`} flag={flag} />
        ))}
        <Button
          variant="ghost"
          onClick={() => onRegenerate(variant.id)}
          disabled={isRegenerating}
          aria-label="Regenerate this variant"
          className="px-2 py-1"
        >
          <span aria-hidden="true" className={cn("inline-block", isRegenerating && "motion-safe:animate-spin")}>
            ↻
          </span>
        </Button>
      </div>
    </li>
  );
}
