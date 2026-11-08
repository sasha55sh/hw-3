import type { Variant } from "@/lib/types";

export const DEDUPE_THRESHOLD = 0.85;

const TRIGRAM_SIZE = 3;

function normalizeForTrigrams(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function trigrams(text: string): Set<string> {
  const normalized = normalizeForTrigrams(text);
  if (normalized.length === 0) {
    return new Set();
  }
  if (normalized.length < TRIGRAM_SIZE) {
    return new Set([normalized]);
  }
  const grams = new Set<string>();
  for (let index = 0; index <= normalized.length - TRIGRAM_SIZE; index += 1) {
    grams.add(normalized.slice(index, index + TRIGRAM_SIZE));
  }
  return grams;
}

export function similarity(a: string, b: string): number {
  const gramsA = trigrams(a);
  const gramsB = trigrams(b);
  if (gramsA.size === 0 || gramsB.size === 0) {
    return 0;
  }
  let shared = 0;
  for (const gram of gramsA) {
    if (gramsB.has(gram)) {
      shared += 1;
    }
  }
  return shared / (gramsA.size + gramsB.size - shared);
}

export function dedupeWithinRun<T extends Pick<Variant, "type" | "text">>(
  variants: readonly T[],
  threshold: number = DEDUPE_THRESHOLD,
): T[] {
  const kept: T[] = [];
  for (const variant of variants) {
    const isDuplicate = kept.some(
      (keptVariant) => keptVariant.type === variant.type && similarity(keptVariant.text, variant.text) >= threshold,
    );
    if (!isDuplicate) {
      kept.push(variant);
    }
  }
  return kept;
}
