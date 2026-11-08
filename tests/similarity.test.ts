import { describe, expect, it } from "vitest";
import { dedupeWithinRun, similarity, trigrams } from "@/lib/similarity";
import type { VariantType } from "@/lib/types";

describe("trigrams", () => {
  it("lowercases and strips punctuation before splitting", () => {
    expect(trigrams("Ab,C!")).toEqual(new Set(["abc"]));
  });

  it("builds character 3-grams including spaces", () => {
    expect(trigrams("a sock")).toEqual(new Set(["a s", " so", "soc", "ock"]));
  });

  it("returns the whole string for inputs shorter than 3 characters", () => {
    expect(trigrams("Hi")).toEqual(new Set(["hi"]));
  });

  it("returns an empty set for empty or punctuation-only input", () => {
    expect(trigrams("").size).toBe(0);
    expect(trigrams("?!.").size).toBe(0);
  });
});

describe("similarity", () => {
  it("returns 1 for identical texts regardless of case and punctuation", () => {
    expect(similarity("Your dryer is a sock thief.", "your dryer is a sock THIEF")).toBe(1);
  });

  it("returns a low score for unrelated texts", () => {
    expect(similarity("Your dryer is a sock thief.", "Gift 5 pairs for $29")).toBeLessThan(0.2);
  });

  it("returns 0 when either text is empty", () => {
    expect(similarity("", "socks")).toBe(0);
    expect(similarity("socks", "")).toBe(0);
  });

  it("is symmetric and stays between 0 and 1", () => {
    const a = "Where do all the missing socks go?";
    const b = "Where do the missing socks go?";
    const score = similarity(a, b);
    expect(score).toBe(similarity(b, a));
    expect(score).toBeGreaterThan(0.6);
    expect(score).toBeLessThan(1);
  });
});

describe("dedupeWithinRun", () => {
  function variant(type: VariantType, text: string) {
    return { type, text };
  }

  it("drops near-identical variants of the same type and keeps the first one", () => {
    const result = dedupeWithinRun([
      variant("hook", "Your dryer is a sock thief."),
      variant("hook", "Your dryer is a sock thief!"),
      variant("hook", "Two socks go in, one comes out."),
    ]);
    expect(result.map((item) => item.text)).toEqual(["Your dryer is a sock thief.", "Two socks go in, one comes out."]);
  });

  it("keeps identical texts when their types differ", () => {
    const result = dedupeWithinRun([variant("hook", "Click. Wash. Still a pair."), variant("onScreen", "Click. Wash. Still a pair.")]);
    expect(result).toHaveLength(2);
  });

  it("respects a custom threshold", () => {
    const items = [variant("hook", "Where do all the missing socks go?"), variant("hook", "Where do the missing socks go?")];
    expect(dedupeWithinRun(items)).toHaveLength(2);
    expect(dedupeWithinRun(items, 0.6)).toHaveLength(1);
  });
});
