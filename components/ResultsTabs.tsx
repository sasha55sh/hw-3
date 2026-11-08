"use client";

import { useState } from "react";
import { VariantRow } from "@/components/VariantRow";
import { ANGLE_LABELS, VARIANT_TYPE_LABELS, inputClassName } from "@/components/ui";
import { cn } from "@/lib/cn";
import { ALL_ANGLES } from "@/lib/schema";
import type { Angle, Variant, VariantType } from "@/lib/types";

const TAB_ORDER: readonly VariantType[] = ["hook", "firstLine", "onScreen"];

type AngleFilter = Angle | "all";

interface ResultsTabsProps {
  variants: readonly Variant[];
  regeneratingIds: ReadonlySet<string>;
  onToggleSelect: (variantId: string) => void;
  onTextChange: (variantId: string, text: string) => void;
  onRegenerate: (variantId: string) => void;
}

function isAngleFilter(value: string): value is AngleFilter {
  return value === "all" || ALL_ANGLES.some((angle) => angle === value);
}

export function ResultsTabs({ variants, regeneratingIds, onToggleSelect, onTextChange, onRegenerate }: ResultsTabsProps) {
  const [activeType, setActiveType] = useState<VariantType>("hook");
  const [angleFilter, setAngleFilter] = useState<AngleFilter>("all");
  const [hideFlagged, setHideFlagged] = useState(false);

  const tabVariants = variants.filter((variant) => variant.type === activeType);
  const anglesInTab = ALL_ANGLES.filter((angle) => tabVariants.some((variant) => variant.angle === angle));
  const visibleVariants = tabVariants.filter(
    (variant) =>
      (angleFilter === "all" || variant.angle === angleFilter) && (!hideFlagged || variant.flags.length === 0),
  );

  return (
    <div className="flex flex-col gap-3">
      <div role="tablist" aria-label="Variant types" className="flex flex-wrap gap-2">
        {TAB_ORDER.map((type) => {
          const isActive = type === activeType;
          const count = variants.filter((variant) => variant.type === type).length;
          return (
            <button
              key={type}
              id={`tab-${type}`}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls="variants-panel"
              onClick={() => setActiveType(type)}
              className={cn(
                "rounded-lg border px-3 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-accent",
                isActive ? "border-accent bg-surface-raised text-ink" : "border-line text-ink-muted hover:text-ink",
              )}
            >
              {VARIANT_TYPE_LABELS[type]} {count}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label htmlFor="angle-filter" className="text-sm text-ink-muted">
            Angle
          </label>
          <select
            id="angle-filter"
            value={angleFilter}
            onChange={(event) => {
              if (isAngleFilter(event.target.value)) {
                setAngleFilter(event.target.value);
              }
            }}
            className={cn(inputClassName, "w-auto")}
          >
            <option value="all">All angles</option>
            {anglesInTab.map((angle) => (
              <option key={angle} value={angle}>
                {ANGLE_LABELS[angle]}
              </option>
            ))}
          </select>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-muted">
          <input
            type="checkbox"
            checked={hideFlagged}
            onChange={(event) => setHideFlagged(event.target.checked)}
            className="accent-accent"
          />
          Hide flagged
        </label>
      </div>

      <div id="variants-panel" role="tabpanel" aria-labelledby={`tab-${activeType}`}>
        {visibleVariants.length === 0 ? (
          <p className="rounded-lg border border-dashed border-line p-6 text-center text-sm text-ink-muted">
            No variants match these filters.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {visibleVariants.map((variant) => (
              <VariantRow
                key={variant.id}
                variant={variant}
                isRegenerating={regeneratingIds.has(variant.id)}
                onToggleSelect={onToggleSelect}
                onTextChange={onTextChange}
                onRegenerate={onRegenerate}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
