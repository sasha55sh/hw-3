import { describe, expect, it } from "vitest";
import { lengthCheck, nearCopyFlag, policyCheck, runChecks, similarityFlags } from "@/lib/checks";
import { SAMPLE_LIBRARY } from "@/lib/sampleData";
import type { ScriptParts, Variant, VariantType } from "@/lib/types";

const ORIGINAL: ScriptParts = {
  hook: "Your washing machine has been eating your socks for years.",
  firstLines: "Two go in, one comes out.",
  onScreen: "The washer eats socks. Not these.",
  body: "Body text.",
  cta: "Start with 5 pairs for $29.",
};

function makeVariant(type: VariantType, text: string, id = text): Variant {
  return { id, type, text, angle: "pain", rationale: "", flags: [], selected: false, edited: false };
}

describe("similarityFlags", () => {
  it("flags a hook copied from the tested library", () => {
    const flags = similarityFlags(makeVariant("hook", "Your dryer is a sock thief."), SAMPLE_LIBRARY, 0.6);
    expect(flags).toHaveLength(1);
    expect(flags[0]).toMatchObject({ kind: "similar_tested", score: 1, match: "Your dryer is a sock thief." });
  });

  it("returns no flags below the threshold", () => {
    expect(similarityFlags(makeVariant("hook", "Gift 5 pairs for $29"), SAMPLE_LIBRARY, 0.6)).toEqual([]);
  });

  it("returns no flags for an empty library", () => {
    expect(similarityFlags(makeVariant("hook", "Your dryer is a sock thief."), [], 0.6)).toEqual([]);
  });
});

describe("nearCopyFlag", () => {
  it("flags a hook that is almost the original hook", () => {
    const flag = nearCopyFlag(makeVariant("hook", "Your washing machine has been eating your socks for years!"), ORIGINAL);
    expect(flag?.kind).toBe("near_copy");
  });

  it("compares first lines against the original first lines", () => {
    expect(nearCopyFlag(makeVariant("firstLine", "Two go in, one comes out."), ORIGINAL)?.kind).toBe("near_copy");
    expect(nearCopyFlag(makeVariant("hook", "Two go in, one comes out."), ORIGINAL)).toBeNull();
  });

  it("returns null for a clearly different variant", () => {
    expect(nearCopyFlag(makeVariant("hook", "Click. Wash. Still a pair."), ORIGINAL)).toBeNull();
  });
});

describe("lengthCheck", () => {
  it("flags hooks longer than 12 words", () => {
    const thirteenWords = "one two three four five six seven eight nine ten eleven twelve thirteen";
    expect(lengthCheck(makeVariant("hook", thirteenWords))?.kind).toBe("too_long");
  });

  it("accepts hooks of exactly 12 words", () => {
    expect(lengthCheck(makeVariant("hook", "one two three four five six seven eight nine ten eleven twelve"))).toBeNull();
  });

  it("flags first lines longer than 25 words", () => {
    expect(lengthCheck(makeVariant("firstLine", Array(26).fill("word").join(" ")))?.kind).toBe("too_long");
    expect(lengthCheck(makeVariant("firstLine", Array(25).fill("word").join(" ")))).toBeNull();
  });

  it("flags on-screen text longer than 40 characters", () => {
    expect(lengthCheck(makeVariant("onScreen", "x".repeat(41)))?.kind).toBe("too_long");
    expect(lengthCheck(makeVariant("onScreen", "x".repeat(40)))).toBeNull();
  });
});

describe("policyCheck", () => {
  it("flags personal attribute questions", () => {
    const flags = policyCheck("Are you tired of losing socks?");
    expect(flags).toHaveLength(1);
    expect(flags[0]).toMatchObject({ kind: "policy_risk", match: "Are you" });
  });

  it.each([
    ["Track your weight with socks", "your weight"],
    ["Guaranteed to stay together", "Guaranteed"],
    ["100% cotton comfort", "100%"],
    ["Socks that heal tired feet", "heal"],
    ["Before & after laundry day", "Before & after"],
    ["Only 3 left today", "Only 3 left"],
    ["Last 24 hours to order", "Last 24 hours"],
  ])("flags %s", (text, match) => {
    expect(policyCheck(text).map((flag) => flag.match)).toContain(match);
  });

  it("returns no flags for clean copy", () => {
    expect(policyCheck("Click. Wash. Still a pair.")).toEqual([]);
  });
});

describe("runChecks", () => {
  it("removes duplicates and attaches every kind of flag", () => {
    const variants = [
      makeVariant("hook", "Your dryer is a sock thief.", "a"),
      makeVariant("hook", "Your dryer is a sock thief!", "b"),
      makeVariant("hook", "Are you tired of losing socks every single week in the laundry room?", "c"),
    ];
    const result = runChecks(variants, SAMPLE_LIBRARY, ORIGINAL, 0.6);

    expect(result.map((variant) => variant.id)).toEqual(["a", "c"]);
    expect(result[0]?.flags.map((flag) => flag.kind)).toEqual(["similar_tested"]);
    expect(result[1]?.flags.map((flag) => flag.kind)).toEqual(["too_long", "policy_risk"]);
  });

  it("does not mutate the input variants", () => {
    const variants = [makeVariant("hook", "Your dryer is a sock thief.")];
    runChecks(variants, SAMPLE_LIBRARY, ORIGINAL, 0.6);
    expect(variants[0]?.flags).toEqual([]);
  });

  it("uses the threshold passed in", () => {
    const variants = [makeVariant("hook", "Where do the missing socks go?")];
    expect(runChecks(variants, SAMPLE_LIBRARY, ORIGINAL, 0.6)[0]?.flags).toHaveLength(1);
    expect(runChecks(variants, SAMPLE_LIBRARY, ORIGINAL, 0.95)[0]?.flags).toHaveLength(0);
  });
});
