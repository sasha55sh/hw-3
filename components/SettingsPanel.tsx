"use client";

import { ANGLE_LABELS, inputClassName, labelClassName, textareaClassName } from "@/components/ui";
import { cn } from "@/lib/cn";
import { ALL_ANGLES, BRAND_GUIDE_MAX_LENGTH, VARIANT_COUNT_MAX } from "@/lib/schema";
import type { Angle, Settings } from "@/lib/types";

type CountKey = keyof Settings["counts"];

const COUNT_FIELDS: readonly { key: CountKey; label: string }[] = [
  { key: "hooks", label: "Hooks" },
  { key: "firstLines", label: "First lines" },
  { key: "onScreen", label: "On-screen" },
];

const LANGUAGE_SUGGESTIONS = ["English", "Spanish", "Ukrainian", "German", "French", "Portuguese"] as const;

interface SettingsPanelProps {
  settings: Settings;
  brandGuide: string;
  onSettingsChange: (settings: Settings) => void;
  onBrandGuideChange: (brandGuide: string) => void;
}

function clampCount(value: string): number {
  const parsed = Math.round(Number(value));
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }
  return Math.min(parsed, VARIANT_COUNT_MAX);
}

export function SettingsPanel({ settings, brandGuide, onSettingsChange, onBrandGuideChange }: SettingsPanelProps) {
  function handleAngleToggle(angle: Angle) {
    const isEnabled = settings.angles.includes(angle);
    if (isEnabled && settings.angles.length === 1) {
      return;
    }
    const angles = ALL_ANGLES.filter((candidate) =>
      candidate === angle ? !isEnabled : settings.angles.includes(candidate),
    );
    onSettingsChange({ ...settings, angles });
  }

  function handleCountChange(key: CountKey, value: string) {
    onSettingsChange({ ...settings, counts: { ...settings.counts, [key]: clampCount(value) } });
  }

  return (
    <details className="group rounded-xl border border-line bg-surface">
      <summary className="cursor-pointer list-none rounded-xl p-4 text-base font-semibold text-ink focus-visible:outline-2 focus-visible:outline-accent">
        <span aria-hidden="true" className="mr-2 inline-block group-open:rotate-90 motion-safe:transition-transform">
          ▸
        </span>
        3. Settings
        <span className="ml-2 text-xs font-normal text-ink-muted">angles, counts, language, threshold, brand guide</span>
      </summary>

      <div className="flex flex-col gap-5 border-t border-line p-4">
        <fieldset className="flex flex-col gap-2">
          <legend className={labelClassName}>Angles</legend>
          <div className="flex flex-wrap gap-2">
            {ALL_ANGLES.map((angle) => {
              const isEnabled = settings.angles.includes(angle);
              return (
                <label
                  key={angle}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1 text-sm has-focus-visible:outline-2 has-focus-visible:outline-accent",
                    isEnabled ? "border-accent text-ink" : "border-line text-ink-muted",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={() => handleAngleToggle(angle)}
                    className="accent-accent"
                  />
                  {ANGLE_LABELS[angle]}
                </label>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="grid grid-cols-3 gap-3">
          <legend className={cn(labelClassName, "mb-2")}>Number of variants</legend>
          {COUNT_FIELDS.map((field) => (
            <div key={field.key} className="flex flex-col gap-1">
              <label htmlFor={`count-${field.key}`} className="text-sm text-ink-muted">
                {field.label}
              </label>
              <input
                id={`count-${field.key}`}
                type="number"
                min={1}
                max={VARIANT_COUNT_MAX}
                value={settings.counts[field.key]}
                onChange={(event) => handleCountChange(field.key, event.target.value)}
                className={inputClassName}
              />
            </div>
          ))}
        </fieldset>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="language" className={labelClassName}>
              Output language
            </label>
            <input
              id="language"
              list="language-suggestions"
              value={settings.language}
              onChange={(event) => onSettingsChange({ ...settings, language: event.target.value })}
              className={inputClassName}
            />
            <datalist id="language-suggestions">
              {LANGUAGE_SUGGESTIONS.map((language) => (
                <option key={language} value={language} />
              ))}
            </datalist>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="threshold" className={labelClassName}>
              Similarity threshold: {settings.similarityThreshold.toFixed(2)}
            </label>
            <input
              id="threshold"
              type="range"
              min={0.3}
              max={0.9}
              step={0.05}
              value={settings.similarityThreshold}
              onChange={(event) => onSettingsChange({ ...settings, similarityThreshold: Number(event.target.value) })}
              className="accent-accent"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="brand-guide" className={labelClassName}>
            Brand guide
          </label>
          <textarea
            id="brand-guide"
            maxLength={BRAND_GUIDE_MAX_LENGTH}
            value={brandGuide}
            onChange={(event) => onBrandGuideChange(event.target.value)}
            aria-describedby="brand-guide-count"
            className={cn(textareaClassName, "max-h-128 min-h-32")}
          />
          <p id="brand-guide-count" className="text-right text-xs text-ink-muted">
            {brandGuide.length} / {BRAND_GUIDE_MAX_LENGTH}
          </p>
        </div>
      </div>
    </details>
  );
}
