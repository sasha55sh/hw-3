import { dedupeWithinRun, similarity } from "@/lib/similarity";
import type { Flag, LibraryItem, ScriptParts, Variant, VariantType } from "@/lib/types";

type CheckableVariant = Pick<Variant, "type" | "text">;

export const NEAR_COPY_THRESHOLD = 0.75;

interface LengthLimit {
  unit: "words" | "characters";
  max: number;
}

export const LENGTH_LIMITS: Readonly<Record<VariantType, LengthLimit>> = {
  hook: { unit: "words", max: 12 },
  firstLine: { unit: "words", max: 25 },
  onScreen: { unit: "characters", max: 40 },
};

const ORIGINAL_FIELDS: Readonly<Record<VariantType, keyof ScriptParts>> = {
  hook: "hook",
  firstLine: "firstLines",
  onScreen: "onScreen",
};

export interface PolicyRule {
  id: string;
  pattern: RegExp;
  message: string;
}

export const POLICY_RULES: readonly PolicyRule[] = [
  {
    id: "personal_attributes_question",
    pattern: /^\s*(are you|do you suffer|you're (fat|old|single|broke|depressed))/i,
    message: "Personal attributes: Meta rejects copy that asserts or implies the viewer's personal traits.",
  },
  {
    id: "personal_attributes_your",
    pattern: /\byour (weight|debt|illness|age)\b/i,
    message: "Personal attributes: avoid referring to the viewer's weight, debt, illness or age.",
  },
  {
    id: "guarantees",
    pattern: /\bguarantee(d)?\b|\b100%/i,
    message: "Guarantee: absolute promises need proof and often get flagged.",
  },
  {
    id: "health",
    pattern: /\b(cure|heal|treat(s|ment)?)\b/i,
    message: "Health claim: socks must not be presented as curing or treating anything.",
  },
  {
    id: "before_after",
    pattern: /before\s*(and|&|\/)\s*after/i,
    message: "Before/after: Meta restricts before-and-after framing.",
  },
  {
    id: "fake_urgency",
    pattern: /\b(only|last) \d+ (left|hours?)\b/i,
    message: "Fake urgency: scarcity claims must be true and are often flagged.",
  },
];

function countWords(text: string): number {
  return text.split(/\s+/).filter((word) => word.length > 0).length;
}

function asList(flag: Flag | null): Flag[] {
  return flag === null ? [] : [flag];
}

export function similarityFlags(variant: CheckableVariant, library: readonly LibraryItem[], threshold: number): Flag[] {
  let best: { score: number; match: string } | null = null;
  for (const item of library) {
    const score = similarity(variant.text, item.hook);
    if (best === null || score > best.score) {
      best = { score, match: item.hook };
    }
  }
  if (best === null || best.score < threshold) {
    return [];
  }
  return [
    {
      kind: "similar_tested",
      message: `Similar to a tested hook (${Math.round(best.score * 100)}%): "${best.match}"`,
      score: best.score,
      match: best.match,
    },
  ];
}

export function nearCopyFlag(variant: CheckableVariant, original: ScriptParts): Flag | null {
  const originalText = original[ORIGINAL_FIELDS[variant.type]];
  const score = similarity(variant.text, originalText);
  if (score < NEAR_COPY_THRESHOLD) {
    return null;
  }
  return {
    kind: "near_copy",
    message: `Almost a copy of the original (${Math.round(score * 100)}%)`,
    score,
    match: originalText,
  };
}

export function lengthCheck(variant: CheckableVariant): Flag | null {
  const limit = LENGTH_LIMITS[variant.type];
  const size = limit.unit === "words" ? countWords(variant.text) : variant.text.trim().length;
  if (size <= limit.max) {
    return null;
  }
  return { kind: "too_long", message: `Too long: ${size} ${limit.unit}, max ${limit.max}` };
}

export function policyCheck(text: string): Flag[] {
  return POLICY_RULES.flatMap((rule) => {
    const match = text.match(rule.pattern);
    return match ? [{ kind: "policy_risk" as const, message: rule.message, match: match[0] }] : [];
  });
}

export function checkVariant(
  variant: CheckableVariant,
  library: readonly LibraryItem[],
  scriptParts: ScriptParts,
  threshold: number,
): Flag[] {
  return [
    ...similarityFlags(variant, library, threshold),
    ...asList(nearCopyFlag(variant, scriptParts)),
    ...asList(lengthCheck(variant)),
    ...policyCheck(variant.text),
  ];
}

export function runChecks(
  variants: readonly Variant[],
  library: readonly LibraryItem[],
  scriptParts: ScriptParts,
  threshold: number,
): Variant[] {
  return dedupeWithinRun(variants).map((variant) => ({
    ...variant,
    flags: checkVariant(variant, library, scriptParts, threshold),
  }));
}
